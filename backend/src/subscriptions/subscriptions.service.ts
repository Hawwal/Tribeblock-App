import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, Currency, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';

type CheckoutInput = {
  planId: string;
  interval: BillingInterval;
  currency: Currency;
  couponCode?: string;
};

type CouponPreviewInput = {
  planId: string;
  interval: BillingInterval;
  couponCode: string;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async listPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceUsd: 'asc' },
    });

    if (plans.length > 0) {
      return plans;
    }

    await this.ensureDefaultPlans();

    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceUsd: 'asc' },
    });
  }

  async currentForUser(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.INCOMPLETE, SubscriptionStatus.PAST_DUE] },
      },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });

    return (
      subscriptions.sort((left, right) => {
        const statusRank = (status: SubscriptionStatus) =>
          status === SubscriptionStatus.ACTIVE ? 3 : status === SubscriptionStatus.PAST_DUE ? 2 : 1;
        const tierRank = { BASIC: 0, PLUS: 1, PRO: 2 } as const;
        const tierDelta = tierRank[right.tier] - tierRank[left.tier];
        if (tierDelta !== 0) return tierDelta;

        const statusDelta = statusRank(right.status) - statusRank(left.status);
        if (statusDelta !== 0) return statusDelta;

        return right.createdAt.getTime() - left.createdAt.getTime();
      })[0] ?? null
    );
  }

  async startCheckout(userId: string, input: CheckoutInput) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found.');
    }

    const originalAmountUsd = input.interval === BillingInterval.YEARLY ? plan.yearlyPriceUsd : plan.monthlyPriceUsd;
    const coupon = input.couponCode ? await this.validateCoupon(input.couponCode, plan.tier) : null;
    const amountUsd = this.discountAmount(originalAmountUsd.toString(), coupon?.discountPercent ?? 0);
    const now = new Date();
    const periodEnd = this.addBillingPeriod(now, input.interval);

    if (Number(amountUsd) === 0) {
      const subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          tier: plan.tier,
          interval: input.interval,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true, payments: true },
      });

      return {
        subscription,
        paymentIntent: null,
        coupon: coupon ? this.couponSummary(coupon, originalAmountUsd.toString(), amountUsd) : null,
      };
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        tier: plan.tier,
        interval: input.interval,
        status: SubscriptionStatus.INCOMPLETE,
      },
      include: { plan: true },
    });

    const paymentIntent = await this.paymentsService.createSubscriptionPayment({
      userId,
      subscriptionId: subscription.id,
      amount: amountUsd,
      currency: input.currency,
      metadata: coupon
        ? {
            couponCode: coupon.code,
            discountPercent: coupon.discountPercent,
            originalAmountUsd: originalAmountUsd.toString(),
            discountedAmountUsd: amountUsd,
          }
        : undefined,
    });

    if (coupon) {
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { redemptionCount: { increment: 1 } },
      });
    }

    return {
      subscription,
      paymentIntent,
      coupon: coupon ? this.couponSummary(coupon, originalAmountUsd.toString(), amountUsd) : null,
    };
  }

  async previewCoupon(input: CouponPreviewInput) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found.');
    }

    const coupon = await this.validateCoupon(input.couponCode, plan.tier);
    const originalAmount = input.interval === BillingInterval.YEARLY ? plan.yearlyPriceUsd : plan.monthlyPriceUsd;
    const discountedAmount = this.discountAmount(originalAmount.toString(), coupon.discountPercent);

    return this.couponSummary(coupon, originalAmount.toString(), discountedAmount);
  }

  private addBillingPeriod(date: Date, interval: BillingInterval) {
    const next = new Date(date);

    if (interval === BillingInterval.YEARLY) {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  private async ensureDefaultPlans() {
    const plans = [
      {
        tier: SubscriptionTier.BASIC,
        name: 'Basic',
        description: 'Free foundational programming courses with IDE practice, quizzes, exams, and badges.',
        monthlyPriceUsd: '0',
        yearlyPriceUsd: '0',
        features: ['10 foundational courses', 'IDE practicals', 'Quizzes and exams', 'Fundamental course badges'],
      },
      {
        tier: SubscriptionTier.PLUS,
        name: 'Plus',
        description: 'Project-based learning for committed builders.',
        monthlyPriceUsd: '19',
        yearlyPriceUsd: '190',
        features: ['All courses', 'Guided build projects', 'Structured IDE checkpoints', 'Career path progress'],
      },
      {
        tier: SubscriptionTier.PRO,
        name: 'Pro',
        description: 'Career-path training with certificates, review workflow, and portfolio proof.',
        monthlyPriceUsd: '39',
        yearlyPriceUsd: '390',
        features: ['Everything in Plus', 'NFT certificates', 'Mentor review workflow', 'Advanced credential proof'],
      },
    ];

    for (const plan of plans) {
      await this.prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        update: plan,
        create: plan,
      });
    }
  }

  private async validateCoupon(code: string, tier: SubscriptionTier) {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      throw new BadRequestException('Enter a coupon code.');
    }

    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalizedCode } });
    const now = new Date();

    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Coupon not found or inactive.');
    }

    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Coupon is not active yet.');
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException('Coupon has expired.');
    }

    if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
      throw new BadRequestException('Coupon redemption limit has been reached.');
    }

    if (coupon.appliesToTiers.length > 0 && !coupon.appliesToTiers.includes(tier)) {
      throw new BadRequestException(`Coupon does not apply to the ${tier.toLowerCase()} plan.`);
    }

    return coupon;
  }

  private discountAmount(amount: string, discountPercent: number) {
    const value = Number(amount);
    const discounted = Math.max(0, value * (1 - discountPercent / 100));
    return discounted.toFixed(2);
  }

  private couponSummary(coupon: { code: string; discountPercent: number }, originalAmount: string, discountedAmount: string) {
    return {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      originalAmount,
      discountedAmount,
      savingsAmount: (Number(originalAmount) - Number(discountedAmount)).toFixed(2),
    };
  }
}
