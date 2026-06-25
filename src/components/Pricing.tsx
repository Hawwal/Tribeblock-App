import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Sparkles, X } from 'lucide-react';
import { fetchPlans, type ApiPlan } from '@/lib/api';
import SignUpModal from '@/components/SignUpModal';
import {
  confirmCeloTransaction,
  getSession,
  startSubscriptionCheckout,
  type CheckoutResponse,
  type PaymentIntent,
} from '@/lib/auth';
import {
  connectCeloWallet,
  formatWalletAddress,
  getConnectedWallet,
  getErc20Balance,
  sendContractSubscriptionPayment,
  sendCeloTokenPayment,
  WALLET_EVENT,
  type ConnectedWallet,
} from '@/lib/wallet';

type PricingPlan = {
  id?: string;
  tier?: 'BASIC' | 'PLUS' | 'PRO';
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
};

const fallbackPlans: PricingPlan[] = [
  {
    name: 'Basic',
    tier: 'BASIC',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    period: 'forever',
    description: 'Start with free programming foundations',
    features: [
      '10 foundational programming courses',
      'Text and interactive lessons',
      'IDE practicals in each lesson',
      'Course quizzes and exams',
      'Fundamental course badges',
    ],
    cta: 'Start Basic',
    featured: false,
  },
  {
    name: 'Plus',
    tier: 'PLUS',
    monthlyPrice: '$19',
    yearlyPrice: '$190',
    period: 'per month',
    description: 'Unlock projects and full course paths',
    features: [
      'Access to all published courses',
      'Interactive coding exercises',
      'Guided build-a-project training',
      'Structured IDE checkpoints',
      'Saved IDE drafts',
      'Career path progress',
      'USD payments via Celo USDT',
    ],
    cta: 'Choose Plus',
    featured: true,
  },
  {
    name: 'Pro',
    tier: 'PRO',
    monthlyPrice: '$39',
    yearlyPrice: '$390',
    period: 'per month',
    description: 'Earn certificates and advanced proof',
    features: [
      'Everything in Plus',
      'Portfolio-ready project briefs',
      'NFT certificates',
      'Mentor review workflow',
      'Yearly billing option',
      'Local-bank rails for NGN, KES, and GHS',
    ],
    cta: 'Choose Pro',
    featured: false,
  },
];

const currencies = [
  { value: 'USD', label: 'USD', note: 'Celo USDT' },
  { value: 'NGN', label: 'NGN', note: 'Local bank' },
  { value: 'KES', label: 'KES', note: 'Local bank' },
  { value: 'GHS', label: 'GHS', note: 'Local bank' },
] as const;

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>(fallbackPlans);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [currency, setCurrency] = useState<(typeof currencies)[number]['value']>('USD');
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [wallet, setWallet] = useState<ConnectedWallet | null>(() => getConnectedWallet());
  const [isWalletPaymentPending, setIsWalletPaymentPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchPlans()
      .then((backendPlans) => {
        if (isMounted) {
          setPlans(backendPlans.length > 0 ? backendPlans.map(toPricingPlan) : fallbackPlans);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlans(fallbackPlans);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleWalletChange = () => setWallet(getConnectedWallet());

    window.addEventListener(WALLET_EVENT, handleWalletChange);
    window.addEventListener('storage', handleWalletChange);

    return () => {
      window.removeEventListener(WALLET_EVENT, handleWalletChange);
      window.removeEventListener('storage', handleWalletChange);
    };
  }, []);

  const handleCheckout = async (plan: PricingPlan) => {
    setCheckoutError('');
    setConfirmationMessage('');

    if (!getSession()) {
      setIsSignUpOpen(true);
      return;
    }

    if (!plan.id) {
      setCheckoutError('This plan is not ready for checkout yet. Please try again when the API is available.');
      return;
    }

    if (currency === 'USD' && plan.tier !== 'BASIC' && !getConnectedWallet()) {
      try {
        setConfirmationMessage('Connect a Celo wallet to pay USD subscriptions with USDT.');
        const connectedWallet = await connectCeloWallet();
        setWallet(connectedWallet);
      } catch (error) {
        setCheckoutError(error instanceof Error ? error.message : 'Please connect MetaMask or MiniPay to continue with USDT checkout.');
        return;
      }
    }

    setIsCheckingOut(plan.name);

    try {
      const result = await startSubscriptionCheckout({
        planId: plan.id,
        interval: billingInterval,
        currency,
      });
      setCheckoutResult(result);
      setTransactionHash('');
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to start checkout.');
    } finally {
      setIsCheckingOut('');
    }
  };

  const handleConfirmCelo = async () => {
    const paymentIntent = checkoutResult?.paymentIntent;

    if (!paymentIntent || !transactionHash.trim()) return;

    try {
      const updatedPayment = await confirmCeloTransaction(paymentIntent.reference, transactionHash.trim());
      setCheckoutResult({
        ...checkoutResult,
        paymentIntent: updatedPayment,
      });
      setConfirmationMessage(
        updatedPayment.status === 'CONFIRMED'
          ? 'Payment verified on-chain. Your subscription is now active.'
          : 'Transaction hash saved. Your subscription remains pending while TribeBlock verifies the on-chain payment.',
      );
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to save transaction hash.');
    }
  };

  const handlePayWithWallet = async () => {
    const paymentIntent = checkoutResult?.paymentIntent;

    if (!paymentIntent) return;

    setCheckoutError('');
    setConfirmationMessage('');
    setIsWalletPaymentPending(true);

    try {
      const connectedWallet = getConnectedWallet() ?? (await connectCeloWallet());
      setWallet(connectedWallet);

      const tokenAddress = paymentIntent.blockchainToken ?? '';
      const amount = paymentIntent.amount;
      const decimals = paymentIntent.blockchainDecimals ?? 6;
      const hash = paymentIntent.providerMetadata?.paymentMode === 'CONTRACT_PAYMENT'
        ? await sendContractSubscriptionPayment({
            tokenAddress,
            contractAddress: paymentIntent.providerMetadata.paymentContractAddress ?? paymentIntent.receiverAddress ?? '',
            receiverAddress: paymentIntent.receiverAddress ?? '',
            amount,
            decimals,
            reference: paymentIntent.reference,
          })
        : await sendCeloTokenPayment({
            tokenAddress,
            receiverAddress: paymentIntent.receiverAddress ?? '',
            amount,
            decimals,
          });

      setTransactionHash(hash);

      const updatedPayment = await confirmCeloTransaction(paymentIntent.reference, hash);
      setCheckoutResult({
        ...checkoutResult,
        paymentIntent: updatedPayment,
      });
      setConfirmationMessage(
        updatedPayment.status === 'CONFIRMED'
          ? 'Payment verified on-chain. Your subscription is now active.'
          : paymentIntent.providerMetadata?.paymentMode === 'CONTRACT_PAYMENT'
            ? 'Contract payment sent. The payment reference is on-chain, and your subscription is pending verification.'
            : 'Wallet payment sent. Your subscription is pending verification.',
      );
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to send wallet payment.');
    } finally {
      setIsWalletPaymentPending(false);
    }
  };

  const copyValue = async (value?: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setConfirmationMessage('Copied to clipboard.');
  };

  return (
    <section className="section-padding" id="pricing">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free, then upgrade monthly or yearly when you need guided projects, full paths, and certificates.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="inline-flex rounded-lg border border-border bg-card p-1 w-fit">
            {(['MONTHLY', 'YEARLY'] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => setBillingInterval(interval)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  billingInterval === interval ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                }`}
              >
                {interval === 'MONTHLY' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {currencies.map((item) => (
              <button
                key={item.value}
                onClick={() => setCurrency(item.value)}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  currency === item.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.note}</span>
              </button>
            ))}
          </div>
        </div>

        {checkoutError && (
          <div className="max-w-5xl mx-auto mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {checkoutError}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`pricing-card relative ${plan.featured ? 'featured' : ''}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles size={14} />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {billingInterval === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.tier === 'BASIC' ? plan.period : billingInterval === 'YEARLY' ? 'year' : 'month'}
                  </span>
                </div>
                {plan.tier !== 'BASIC' && billingInterval === 'YEARLY' && (
                  <p className="text-xs text-primary font-semibold mt-2">Includes two months free</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={Boolean(isCheckingOut)}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.featured
                    ? 'btn-primary'
                    : 'border border-border hover:border-primary hover:text-primary'
                }`}
              >
                {isCheckingOut === plan.name ? 'Starting checkout...' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Preferred currencies: USD, NGN, KES, and GHS. USD checkout will use Celo USDT.
          </p>
        </motion.div>
      </div>

      {checkoutResult && (
        <CheckoutModal
          result={checkoutResult}
          transactionHash={transactionHash}
          confirmationMessage={confirmationMessage}
          onTransactionHashChange={setTransactionHash}
          onClose={() => {
            setCheckoutResult(null);
            setConfirmationMessage('');
          }}
          onCopy={copyValue}
          onConfirmCelo={handleConfirmCelo}
          onPayWithWallet={handlePayWithWallet}
          wallet={wallet}
          isWalletPaymentPending={isWalletPaymentPending}
        />
      )}

      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </section>
  );
};

export default Pricing;

function toPricingPlan(plan: ApiPlan): PricingPlan {
  const monthlyPrice = Number(plan.monthlyPriceUsd);
  const yearlyPrice = Number(plan.yearlyPriceUsd);

  return {
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    monthlyPrice: monthlyPrice === 0 ? '$0' : `$${monthlyPrice}`,
    yearlyPrice: yearlyPrice === 0 ? '$0' : `$${yearlyPrice}`,
    period: monthlyPrice === 0 ? 'forever' : 'month',
    description: plan.description,
    features: plan.features,
    cta: plan.tier === 'BASIC' ? 'Start Basic' : `Choose ${plan.name}`,
    featured: plan.tier === 'PLUS',
  };
}

type CheckoutModalProps = {
  result: CheckoutResponse;
  transactionHash: string;
  confirmationMessage: string;
  onTransactionHashChange: (value: string) => void;
  onClose: () => void;
  onCopy: (value?: string | null) => void;
  onConfirmCelo: () => void;
  onPayWithWallet: () => void;
  wallet: ConnectedWallet | null;
  isWalletPaymentPending: boolean;
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  result,
  transactionHash,
  confirmationMessage,
  onTransactionHashChange,
  onClose,
  onCopy,
  onConfirmCelo,
  onPayWithWallet,
  wallet,
  isWalletPaymentPending,
}) => {
  const payment = result.paymentIntent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-hero w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary">
          <X size={18} />
        </button>

        <div className="pr-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {payment ? 'Checkout Started' : 'Plan Activated'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {payment
              ? `${result.subscription.plan.name} is reserved while payment is pending.`
              : `${result.subscription.plan.name} is active on your account.`}
          </p>
        </div>

        {!payment ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700">
            Your free Basic subscription is active. You can start learning from the course catalog.
          </div>
        ) : payment.provider === 'CELO_USDT' ? (
          <CeloInstructions
            payment={payment}
            transactionHash={transactionHash}
            confirmationMessage={confirmationMessage}
            onTransactionHashChange={onTransactionHashChange}
            onCopy={onCopy}
            onConfirmCelo={onConfirmCelo}
            onPayWithWallet={onPayWithWallet}
            wallet={wallet}
            isWalletPaymentPending={isWalletPaymentPending}
          />
        ) : (
          <LocalBankInstructions
            payment={payment}
            confirmationMessage={confirmationMessage}
            onCopy={onCopy}
          />
        )}
      </div>
    </div>
  );
};

type PaymentInstructionProps = {
  payment: PaymentIntent;
  confirmationMessage?: string;
  onCopy: (value?: string | null) => void;
};

const CeloInstructions: React.FC<
  PaymentInstructionProps & {
    transactionHash: string;
    onTransactionHashChange: (value: string) => void;
    onConfirmCelo: () => void;
    onPayWithWallet: () => void;
    wallet: ConnectedWallet | null;
    isWalletPaymentPending: boolean;
  }
> = ({
  payment,
  transactionHash,
  confirmationMessage,
  onTransactionHashChange,
  onCopy,
  onConfirmCelo,
  onPayWithWallet,
  wallet,
  isWalletPaymentPending,
}) => (
  <div className="space-y-4">
    <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
      <p className="text-sm font-semibold text-foreground mb-1">
        {wallet ? `Connected ${wallet.provider}` : 'Connect a Celo wallet'}
      </p>
      <p className="text-sm text-muted-foreground">
        {wallet
          ? `${formatWalletAddress(wallet.address)} will approve the Celo USDT payment in wallet.`
          : 'MetaMask and MiniPay can approve this USDT payment directly in the wallet.'}
      </p>
      {payment.providerMetadata?.paymentMode === 'CONTRACT_PAYMENT' && (
        <p className="text-xs text-muted-foreground mt-2">
          Contract checkout uses two wallet prompts: approve USDT spending, then submit the TribeBlock payment reference on-chain.
        </p>
      )}
    </div>

    <div className="rounded-lg border border-primary/30 bg-card p-4">
      <p className="text-xs uppercase text-muted-foreground mb-1">Amount due</p>
      <p className="text-3xl font-extrabold text-foreground">{payment.amount} USDT</p>
      <p className="text-sm text-muted-foreground mt-1">
        Your subscription remains pending until TribeBlock verifies the on-chain payment.
      </p>
    </div>

    <WalletBalance payment={payment} wallet={wallet} />

    <InstructionRow label="Network" value="Celo Mainnet" />
    <InstructionRow label="Amount" value={`${payment.amount} USDT`} onCopy={() => onCopy(payment.amount)} />
    <InstructionRow
      label={payment.providerMetadata?.paymentMode === 'CONTRACT_PAYMENT' ? 'Payment Contract' : 'Receiver'}
      value={payment.receiverAddress ?? 'Pending receiver address'}
      onCopy={() => onCopy(payment.receiverAddress)}
    />
    <InstructionRow label="Reference" value={payment.reference} onCopy={() => onCopy(payment.reference)} />
    <InstructionRow label="Token" value={payment.blockchainToken ?? 'USDT token'} onCopy={() => onCopy(payment.blockchainToken)} />

    <button onClick={onPayWithWallet} disabled={isWalletPaymentPending} className="btn-primary w-full py-3 disabled:opacity-50">
      {isWalletPaymentPending ? 'Waiting for wallet approval...' : wallet ? 'Pay with Connected Wallet' : 'Connect Wallet and Pay'}
    </button>

    <div>
      <label className="block text-sm font-medium text-foreground mb-2">Transaction hash</label>
      <input
        value={transactionHash}
        onChange={(event) => onTransactionHashChange(event.target.value)}
        placeholder="0x..."
        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>

    <button onClick={onConfirmCelo} disabled={!transactionHash.trim()} className="w-full py-3 rounded-lg border border-border font-semibold hover:border-primary hover:text-primary disabled:opacity-50">
      Save Transaction Hash
    </button>

    {confirmationMessage && <p className="text-sm text-primary font-medium">{confirmationMessage}</p>}
  </div>
);

const LocalBankInstructions: React.FC<PaymentInstructionProps> = ({ payment, confirmationMessage, onCopy }) => (
  <div className="space-y-4">
    <InstructionRow label="Amount" value={`${payment.currency} ${payment.amount}`} onCopy={() => onCopy(payment.amount)} />
    <InstructionRow label="Reference" value={payment.reference} onCopy={() => onCopy(payment.reference)} />
    <InstructionRow label="Provider" value={payment.providerMetadata?.provider ?? 'manual'} />
    <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
      Local bank checkout is prepared as a payment intent. We will connect the final bank/card/mobile money provider in a later payment-provider stage.
    </p>
    {confirmationMessage && <p className="text-sm text-primary font-medium">{confirmationMessage}</p>}
  </div>
);

const WalletBalance: React.FC<{ payment: PaymentIntent; wallet: ConnectedWallet | null }> = ({ payment, wallet }) => {
  const [balance, setBalance] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!wallet?.address || !payment.blockchainToken) {
      setBalance('');
      return;
    }

    getErc20Balance(payment.blockchainToken, wallet.address, payment.blockchainDecimals ?? 6)
      .then((value) => {
        if (isMounted) setBalance(value);
      })
      .catch(() => {
        if (isMounted) setBalance('');
      });

    return () => {
      isMounted = false;
    };
  }, [payment.blockchainDecimals, payment.blockchainToken, wallet?.address]);

  if (!wallet) {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
        Connect a wallet to check your USDT balance before approval.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase text-muted-foreground mb-1">Connected wallet balance</p>
      <p className="text-sm font-semibold text-foreground">
        {balance ? `${balance} USDT` : 'Checking USDT balance...'}
      </p>
    </div>
  );
};

type InstructionRowProps = {
  label: string;
  value: string;
  onCopy?: () => void;
};

const InstructionRow: React.FC<InstructionRowProps> = ({ label, value, onCopy }) => (
  <div className="rounded-lg border border-border p-3">
    <p className="text-xs uppercase text-muted-foreground mb-1">{label}</p>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-foreground break-all">{value}</p>
      {onCopy && (
        <button onClick={onCopy} className="p-2 rounded-md hover:bg-secondary" aria-label={`Copy ${label}`}>
          <Copy size={16} />
        </button>
      )}
    </div>
  </div>
);
