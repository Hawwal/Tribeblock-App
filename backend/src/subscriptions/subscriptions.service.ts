import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, Currency, SubscriptionStatus } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';

type CheckoutInput = {
  planId: string;
  interval: BillingInterval;
  currency: Currency;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  listPlans() {
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

    const amountUsd = input.interval === BillingInterval.YEARLY ? plan.yearlyPriceUsd : plan.monthlyPriceUsd;
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
      amount: amountUsd.toString(),
      currency: input.currency,
    });

    return {
      subscription,
      paymentIntent,
    };
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
}
