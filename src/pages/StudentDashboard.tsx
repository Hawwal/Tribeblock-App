import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Award, BadgeCheck, BookOpen, CreditCard, Globe2, UserCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignUpModal from '@/components/SignUpModal';
import {
  AUTH_SESSION_EVENT,
  fetchCurrentSubscription,
  fetchCurrentUser,
  fetchMyProgress,
  fetchMyCertificates,
  getSession,
  requestCourseCertificate,
  updatePreferredCurrency,
  type AuthUser,
  type CertificateRecord,
  type CurrentSubscription,
  type EnrollmentSummary,
} from '@/lib/auth';
import { connectCeloWallet, formatWalletAddress, getConnectedWallet, type ConnectedWallet } from '@/lib/wallet';

const currencies = [
  { value: 'USD', label: 'USD', detail: 'Celo USDT' },
  { value: 'NGN', label: 'Naira', detail: 'Local bank' },
  { value: 'KES', label: 'KSH', detail: 'Local bank' },
  { value: 'GHS', label: 'GHcedis', detail: 'Local bank' },
];

const StudentDashboard: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getSession()?.user ?? null);
  const [subscription, setSubscription] = useState<CurrentSubscription>(null);
  const [progress, setProgress] = useState<EnrollmentSummary[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(() => getConnectedWallet());
  const [isLoading, setIsLoading] = useState(Boolean(getSession()));
  const [message, setMessage] = useState('');

  useEffect(() => {
    const syncSession = () => {
      const session = getSession();
      setUser(session?.user ?? null);
    };

    window.addEventListener(AUTH_SESSION_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setIsLoading(false);
      setSubscription(null);
      setProgress([]);
      setCertificates([]);
      return;
    }

    setIsLoading(true);
    Promise.allSettled([fetchCurrentUser(), fetchCurrentSubscription(), fetchMyProgress(), fetchMyCertificates()])
      .then(([profileResult, subscriptionResult, progressResult, certificatesResult]) => {
        if (!isMounted) return;

        if (profileResult.status === 'fulfilled') setUser(profileResult.value);
        if (subscriptionResult.status === 'fulfilled') setSubscription(subscriptionResult.value);
        if (progressResult.status === 'fulfilled') setProgress(progressResult.value);
        if (certificatesResult.status === 'fulfilled') setCertificates(certificatesResult.value);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const activeCourses = progress.filter((item) => item.status !== 'COMPLETED').length;
    const completedCourses = progress.filter((item) => item.status === 'COMPLETED').length;
    const averageProgress =
      progress.length === 0
        ? 0
        : Math.round(progress.reduce((total, item) => total + item.completionPercent, 0) / progress.length);

    return { activeCourses, completedCourses, averageProgress };
  }, [progress]);

  const handleCurrencyChange = async (currency: string) => {
    if (!user) return;

    setMessage('');
    try {
      await updatePreferredCurrency(currency);
      setUser({ ...user, preferredCurrency: currency });
      setMessage('Currency preference updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update currency.');
    }
  };

  const handleCertificateRequest = async (courseId: string) => {
    setMessage('');

    try {
      const connectedWallet = wallet ?? (await connectCeloWallet());
      setWallet(connectedWallet);
      const certificate = await requestCourseCertificate(courseId, connectedWallet.address);
      setCertificates((current) => {
        const existing = current.filter((item) => item.id !== certificate.id);
        return [certificate, ...existing];
      });
      setMessage(
        certificate.status === 'MINTED'
          ? `Certificate NFT minted to ${formatWalletAddress(connectedWallet.address)}.`
          : `Certificate queued for NFT minting to ${formatWalletAddress(connectedWallet.address)}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to request certificate.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />

      <main className="py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          {!user ? (
            <section className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-primary font-semibold mb-4">
                <UserCircle size={18} />
                Student Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Sign in to manage your learning.
              </h1>
              <p className="text-muted-foreground mb-6">
                Your dashboard will show course activity, subscription status, certificate progress,
                and your preferred payment currency.
              </p>
              <button onClick={() => setIsSignUpOpen(true)} className="btn-primary px-6 py-3">
                Sign In or Create Account
              </button>
            </section>
          ) : (
            <div className="space-y-8">
              <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-primary font-semibold mb-3">
                    <UserCircle size={18} />
                    Student Dashboard
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Welcome back, {user.displayName}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    @{user.handle} - {user.role.toLowerCase()} account
                  </p>
                </div>

                <Link to="/courses" className="btn-primary px-5 py-3 inline-flex items-center justify-center gap-2">
                  <BookOpen size={18} />
                  Browse Courses
                </Link>
              </section>

              {message && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                  {message}
                </div>
              )}

              <section className="grid md:grid-cols-3 gap-4">
                <Metric icon={BookOpen} label="Active Courses" value={stats.activeCourses} />
                <Metric icon={Award} label="Completed Courses" value={stats.completedCourses} />
                <Metric icon={Activity} label="Average Progress" value={`${stats.averageProgress}%`} />
              </section>

              <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="bg-card border border-border rounded-lg p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <CreditCard className="text-primary" size={22} />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Subscription</h2>
                      <p className="text-sm text-muted-foreground">
                        Your plan unlocks courses for the active billing period.
                      </p>
                    </div>
                  </div>

                  {isLoading ? (
                    <p className="text-muted-foreground">Loading subscription...</p>
                  ) : subscription ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {subscription.plan.name}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-secondary text-foreground text-sm font-semibold">
                          {subscription.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{subscription.plan.description}</p>
                      {subscription.status !== 'ACTIVE' && (
                        <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                          Payment is still pending. Your paid access starts only after TribeBlock verifies the payment on-chain or through the bank provider.
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Billing interval: {subscription.interval.toLowerCase()}
                      </p>
                      {subscription.payments && subscription.payments.length > 0 && (
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase text-muted-foreground mb-1">Latest payment</p>
                          <p className="text-sm font-semibold text-foreground">
                            {subscription.payments[0].currency} {subscription.payments[0].amount} - {subscription.payments[0].status}
                          </p>
                          <p className="text-xs text-muted-foreground break-all">
                            Ref: {subscription.payments[0].reference}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        No active subscription yet. Basic access is available, and Plus or Pro unlocks full learning paths.
                      </p>
                      <Link to="/#pricing" className="payment-cta inline-flex">
                        View Plans
                      </Link>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <Globe2 className="text-primary" size={22} />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Payment Currency</h2>
                      <p className="text-sm text-muted-foreground">
                        USD uses Celo USDT. Local currencies use bank checkout.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {currencies.map((currency) => (
                      <button
                        key={currency.value}
                        onClick={() => handleCurrencyChange(currency.value)}
                        className={`text-left rounded-lg border p-3 transition-colors ${
                          user.preferredCurrency === currency.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-secondary/60'
                        }`}
                      >
                        <span className="block font-semibold text-foreground">{currency.label}</span>
                        <span className="text-xs text-muted-foreground">{currency.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bg-card border border-border rounded-lg p-5 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <BadgeCheck className="text-primary" size={22} />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Learning Activity</h2>
                    <p className="text-sm text-muted-foreground">
                      Course progress will update as students complete lessons, quizzes, and projects.
                    </p>
                  </div>
                </div>

                {isLoading ? (
                  <p className="text-muted-foreground">Loading activity...</p>
                ) : progress.length > 0 ? (
                  <div className="space-y-3">
                    {progress.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
                          <Link to={`/course/${item.course.slug}`} className="font-semibold text-foreground hover:text-primary">
                            {item.course.title}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{item.completionPercent}%</span>
                            {item.status === 'COMPLETED' && (
                              <button
                                onClick={() => handleCertificateRequest(item.course.id)}
                                className="text-sm text-primary font-semibold hover:underline"
                              >
                                Request Certificate
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(0, item.completionPercent))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      No enrollments yet. Choose a course to start building your path.
                    </p>
                    <Link to="/courses" className="btn-primary px-5 py-2.5 inline-flex">
                      Explore Courses
                    </Link>
                  </div>
                )}
              </section>

              <section className="bg-card border border-border rounded-lg p-5 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Award className="text-primary" size={22} />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Certificates</h2>
                    <p className="text-sm text-muted-foreground">
                      Pro certificates are generated with NFT-ready metadata and verification links.
                    </p>
                  </div>
                </div>

                {isLoading ? (
                  <p className="text-muted-foreground">Loading certificates...</p>
                ) : certificates.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {certificates.map((certificate) => (
                      <div key={certificate.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-semibold text-foreground">{certificate.course.title}</p>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {certificate.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground break-all mb-3">
                          {certificate.certificateNumber}
                        </p>
                        {certificate.nftContract && (
                          <div className="rounded-md bg-secondary/70 px-3 py-2 text-xs text-muted-foreground mb-3 space-y-1">
                            <p className="break-all">Contract: {certificate.nftContract}</p>
                            {certificate.nftTokenId && <p>Token ID: {certificate.nftTokenId}</p>}
                            {certificate.transactionHash && <p className="break-all">Tx: {certificate.transactionHash}</p>}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm">
                          {certificate.verificationUrl && (
                            <a href={certificate.verificationUrl} className="text-primary hover:underline">
                              Verify
                            </a>
                          )}
                          {certificate.metadataUri && (
                            <a href={certificate.metadataUri} className="text-primary hover:underline">
                              Metadata
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-muted-foreground">
                      Complete all lessons in a course on Pro to generate your certificate.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

type MetricProps = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
};

const Metric: React.FC<MetricProps> = ({ icon: Icon, label, value }) => (
  <div className="bg-card border border-border rounded-lg p-5">
    <Icon size={22} className="text-primary mb-4" />
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

export default StudentDashboard;
