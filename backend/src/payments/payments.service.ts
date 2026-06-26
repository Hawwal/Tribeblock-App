import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingInterval, Currency, PaymentProvider, PaymentRail, PaymentStatus, SubscriptionStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createPublicClient, decodeFunctionData, http, parseUnits } from 'viem';
import { PrismaService } from '../prisma/prisma.service';

type CreateSubscriptionPaymentInput = {
  userId: string;
  subscriptionId: string;
  amount: string;
  currency: Currency;
  metadata?: Record<string, unknown>;
};

const erc20TransferAbi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

const tribeBlockPaymentsAbi = [
  {
    name: 'paySubscription',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'paymentReference', type: 'string' },
    ],
    outputs: [],
  },
] as const;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  createSubscriptionPayment(input: CreateSubscriptionPaymentInput) {
    if (input.currency === Currency.USD) {
      return this.createCeloUsdtIntent(input);
    }

    return this.createLocalBankIntent(input);
  }

  findByReference(reference: string) {
    return this.prisma.paymentIntent.findUniqueOrThrow({
      where: { reference },
      include: { subscription: { include: { plan: true } } },
    });
  }

  async attachCeloTransaction(reference: string, transactionHash: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      throw new BadRequestException('A valid transaction hash is required.');
    }

    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { reference },
      include: { subscription: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found.');
    }

    const updatedPayment = await this.prisma.paymentIntent.update({
      where: { reference },
      data: {
        transactionHash,
        status: PaymentStatus.REQUIRES_ACTION,
        providerMetadata: {
          ...this.asObject(paymentIntent.providerMetadata),
          confirmationNote: 'Transaction hash received. A chain watcher should verify token, amount, and receiver.',
        },
      },
      include: { subscription: { include: { plan: true } } },
    });

    const verification = await this.verifyCeloTransaction(reference, transactionHash);

    if (!verification.verified) {
      return this.prisma.paymentIntent.update({
        where: { reference },
        data: {
          providerMetadata: {
            ...this.asObject(updatedPayment.providerMetadata),
            verificationNote: verification.note,
          },
        },
        include: { subscription: { include: { plan: true } } },
      });
    }

    return this.confirmPayment(reference, verification.note);
  }

  async verifyPayment(adminUserId: string, reference: string, status: 'CONFIRMED' | 'FAILED', note?: string) {
    await this.assertAdmin(adminUserId);

    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { reference },
      include: { subscription: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found.');
    }

    if (status === 'FAILED') {
      return this.prisma.paymentIntent.update({
        where: { reference },
        data: {
          status: PaymentStatus.FAILED,
          providerMetadata: {
            ...this.asObject(paymentIntent.providerMetadata),
            verificationNote: note ?? 'Payment marked failed during local verification.',
          },
        },
        include: { subscription: { include: { plan: true } } },
      });
    }

    return this.confirmPayment(reference, note ?? 'Payment confirmed by admin.');
  }

  private createCeloUsdtIntent(input: CreateSubscriptionPaymentInput) {
    const decimals = this.config.get<number>('CELO_USDT_DECIMALS') ?? 6;
    const amountUnits = parseUnits(input.amount, decimals).toString();
    const paymentContractAddress = this.config.get<string>('CELO_PAYMENT_CONTRACT_ADDRESS');
    const treasuryAddress = this.config.get<string>('CELO_PAYMENT_RECEIVER_ADDRESS');
    const receiverAddress = paymentContractAddress ?? treasuryAddress;
    const paymentMode = paymentContractAddress ? 'CONTRACT_PAYMENT' : 'DIRECT_TRANSFER';

    return this.prisma.paymentIntent.create({
      data: {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        provider: PaymentProvider.CELO_USDT,
        rail: PaymentRail.CELO,
        currency: Currency.USD,
        amount: input.amount,
        reference: this.reference('CELO'),
        blockchainChainId: this.config.get<number>('CELO_CHAIN_ID'),
        blockchainToken: this.config.get<string>('CELO_USDT_TOKEN_ADDRESS'),
        blockchainTokenSymbol: 'USDT',
        blockchainDecimals: decimals,
        receiverAddress,
        status: PaymentStatus.PENDING,
        expiresAt: this.expiresInMinutes(45),
        providerMetadata: {
          ...input.metadata,
          amountUnits,
          rpcUrl: this.config.get<string>('CELO_RPC_URL'),
          paymentMode,
          paymentContractAddress,
          treasuryAddress,
          contractMethod: paymentContractAddress ? 'approve USDT, then call paySubscription(amount, reference)' : undefined,
          instruction: paymentContractAddress
            ? 'Approve exact USDT amount, then call the TribeBlock payment contract with the payment reference.'
            : 'Send exact USDT amount to receiver on Celo. Receiver can be replaced with the final smart contract address later.',
        },
      },
    });
  }

  private createLocalBankIntent(input: CreateSubscriptionPaymentInput) {
    const amountUsd = Number(input.amount);
    const rate = this.localCurrencyRate(input.currency);
    const localAmount = Math.round(amountUsd * rate * 100) / 100;

    return this.prisma.paymentIntent.create({
      data: {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        provider: PaymentProvider.LOCAL_BANK,
        rail: PaymentRail.LOCAL_BANK,
        currency: input.currency,
        amount: localAmount.toString(),
        reference: this.reference(input.currency),
        status: PaymentStatus.PENDING,
        expiresAt: this.expiresInMinutes(60),
        providerMetadata: {
          ...input.metadata,
          provider: this.config.get<string>('LOCAL_BANK_PROVIDER') ?? 'manual',
          usdAmount: input.amount,
          estimatedExchangeRate: rate,
          instruction:
            'Route this intent through the selected local bank/card/mobile money provider later. Replace this estimated rate with the provider quote before production.',
        },
      },
    });
  }

  private localCurrencyRate(currency: Currency) {
    const rates: Partial<Record<Currency, number>> = {
      [Currency.NGN]: this.config.get<number>('USD_TO_NGN_RATE') ?? 1500,
      [Currency.KES]: this.config.get<number>('USD_TO_KES_RATE') ?? 130,
      [Currency.GHS]: this.config.get<number>('USD_TO_GHS_RATE') ?? 15,
    };

    return rates[currency] ?? 1;
  }

  private reference(prefix: string) {
    return `TBU-${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private expiresInMinutes(minutes: number) {
    return new Date(Date.now() + minutes * 60_000);
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

  private asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private async confirmPayment(reference: string, note: string) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { reference },
      include: { subscription: true },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found.');
    }

    if (!paymentIntent.subscription) {
      throw new BadRequestException('Payment intent is not attached to a subscription.');
    }

    const now = new Date();
    const currentPeriodEnd = this.addBillingPeriod(now, paymentIntent.subscription.interval);

    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: paymentIntent.subscription!.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd,
        },
      });

      return tx.paymentIntent.update({
        where: { reference },
        data: {
          status: PaymentStatus.CONFIRMED,
          providerMetadata: {
            ...this.asObject(paymentIntent.providerMetadata),
            verificationNote: note,
            verifiedAt: now.toISOString(),
          },
        },
        include: { subscription: { include: { plan: true } } },
      });
    });
  }

  private async verifyCeloTransaction(reference: string, transactionHash: string) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({ where: { reference } });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found.');
    }

    const metadata = this.asObject(paymentIntent.providerMetadata);
    const rpcUrl = (metadata.rpcUrl as string | undefined) ?? this.config.get<string>('CELO_RPC_URL') ?? 'https://forno.celo.org';
    const client = createPublicClient({ transport: http(rpcUrl) });
    const hash = transactionHash as `0x${string}`;

    try {
      const [transaction, receipt] = await Promise.all([
        client.getTransaction({ hash }),
        client.getTransactionReceipt({ hash }),
      ]);

      if (receipt.status !== 'success') {
        return { verified: false, note: 'Transaction was found but did not succeed on-chain.' };
      }

      const expectedAmount = parseUnits(paymentIntent.amount.toString(), paymentIntent.blockchainDecimals ?? 6);
      const paymentMode = metadata.paymentMode;

      if (paymentMode === 'CONTRACT_PAYMENT') {
        const contractAddress = ((metadata.paymentContractAddress as string | undefined) ?? paymentIntent.receiverAddress ?? '').toLowerCase();

        if (!transaction.to || transaction.to.toLowerCase() !== contractAddress) {
          return { verified: false, note: 'Transaction was not sent to the configured TribeBlock payment contract.' };
        }

        const decoded = decodeFunctionData({
          abi: tribeBlockPaymentsAbi,
          data: transaction.input,
        });

        const [amount, paymentReference] = decoded.args;

        if (decoded.functionName !== 'paySubscription' || amount !== expectedAmount || paymentReference !== reference) {
          return { verified: false, note: 'Contract payment did not match the expected amount and TribeBlock reference.' };
        }

        return { verified: true, note: 'Celo contract payment verified on-chain.' };
      }

      if (!transaction.to || transaction.to.toLowerCase() !== (paymentIntent.blockchainToken ?? '').toLowerCase()) {
        return { verified: false, note: 'Transaction was not sent to the configured USDT token contract.' };
      }

      const decoded = decodeFunctionData({
        abi: erc20TransferAbi,
        data: transaction.input,
      });
      const [to, amount] = decoded.args;

      if (decoded.functionName !== 'transfer' || to.toLowerCase() !== (paymentIntent.receiverAddress ?? '').toLowerCase() || amount !== expectedAmount) {
        return { verified: false, note: 'USDT transfer did not match the expected receiver and amount.' };
      }

      return { verified: true, note: 'Celo USDT transfer verified on-chain.' };
    } catch {
      return { verified: false, note: 'Transaction hash saved. Waiting for Celo RPC confirmation before activating subscription.' };
    }
  }

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can manually verify payments.');
    }
  }
}
