import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  ShieldCheck,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SignUpModal from '@/components/SignUpModal';
import {
  AUTH_SESSION_EVENT,
  fetchAdminContributorApplications,
  fetchAdminCourseReviewQueue,
  fetchAdminOverview,
  fetchAdminPayments,
  getSession,
  publishAdminCourse,
  reviewAdminContributorApplication,
  reviewAdminCourse,
  verifyPaymentIntent,
  type AdminContributorApplication,
  type AdminCourseReviewItem,
  type AdminOverview,
  type AdminPayment,
  type AuthUser,
} from '@/lib/auth';

const paymentFilters = ['', 'PENDING', 'REQUIRES_ACTION', 'CONFIRMED', 'FAILED'];
const courseFilters = ['', 'DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED'];
const applicationFilters = ['', 'PENDING', 'APPROVED', 'REJECTED'];

const AdminDashboard: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getSession()?.user ?? null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [courses, setCourses] = useState<AdminCourseReviewItem[]>([]);
  const [applications, setApplications] = useState<AdminContributorApplication[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const canReview = user?.role === 'ADMIN' || user?.role === 'MENTOR_REVIEWER';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const syncSession = () => setUser(getSession()?.user ?? null);

    window.addEventListener(AUTH_SESSION_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  useEffect(() => {
    if (!canReview) return;
    void loadDashboard();
  }, [canReview, paymentFilter, courseFilter, applicationFilter]);

  const paymentTotals = overview?.totals.payments ?? {};
  const courseTotals = overview?.totals.courses ?? {};

  const queueCount = useMemo(() => {
    return (courseTotals.DRAFT ?? 0) + (courseTotals.UNDER_REVIEW ?? 0) + (courseTotals.CHANGES_REQUESTED ?? 0);
  }, [courseTotals]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const [nextOverview, nextPayments, nextCourses, nextApplications] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminPayments(paymentFilter || undefined),
        fetchAdminCourseReviewQueue(courseFilter || undefined),
        fetchAdminContributorApplications(applicationFilter || undefined),
      ]);

      setOverview(nextOverview);
      setPayments(nextPayments);
      setCourses(nextCourses);
      setApplications(nextApplications);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentReview = async (reference: string, status: 'CONFIRMED' | 'FAILED') => {
    setMessage('');

    try {
      await verifyPaymentIntent(
        reference,
        status,
        status === 'CONFIRMED' ? 'Manual admin verification from operations dashboard.' : 'Marked failed from operations dashboard.',
      );
      setMessage(status === 'CONFIRMED' ? 'Payment confirmed and subscription activated.' : 'Payment marked failed.');
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update payment.');
    }
  };

  const handleCourseReview = async (courseId: string, status: string) => {
    setMessage('');

    try {
      await reviewAdminCourse(
        courseId,
        status,
        status === 'CHANGES_REQUESTED' ? 'Changes requested from review dashboard.' : 'Review checkpoint recorded.',
      );
      setMessage('Course review updated.');
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update course review.');
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    setMessage('');

    try {
      await publishAdminCourse(courseId);
      setMessage('Course published.');
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to publish course.');
    }
  };

  const handleApplicationReview = async (applicationId: string, status: string) => {
    setMessage('');

    try {
      await reviewAdminContributorApplication(
        applicationId,
        status,
        status === 'APPROVED' ? 'Approved from contributor operations dashboard.' : 'Rejected from contributor operations dashboard.',
      );
      setMessage('Contributor application updated.');
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update contributor application.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSignUpClick={() => setIsSignUpOpen(true)} />

      <main className="py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6 space-y-8">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold mb-3">
                <ShieldCheck size={18} />
                Stage 7 Operations
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Monitor payments, course reviews, contributor applications, subscriptions, and reward queues.
              </p>
            </div>

            {canReview && (
              <button onClick={loadDashboard} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3">
                <Clock3 size={18} />
                Refresh
              </button>
            )}
          </section>

          {!user ? (
            <AccessNotice
              title="Sign in with an admin or reviewer account."
              detail="This workspace is limited to operations staff."
              action={<button onClick={() => setIsSignUpOpen(true)} className="btn-primary px-5 py-3">Sign In</button>}
            />
          ) : !canReview ? (
            <AccessNotice
              title="This account does not have operations access."
              detail="Admin and mentor reviewer roles can open this dashboard."
            />
          ) : (
            <>
              {message && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                  {message}
                </div>
              )}

              <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Metric icon={Users} label="Users" value={overview?.totals.users ?? 0} />
                <Metric icon={BadgeCheck} label="Active subscriptions" value={overview?.totals.activeSubscriptions ?? 0} />
                <Metric icon={BookOpenCheck} label="Course review queue" value={queueCount} />
                <Metric icon={WalletCards} label="Pending rewards" value={overview?.totals.pendingRewards ?? 0} />
              </section>

              <section className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
                <OperationsPanel
                  title="Payments"
                  icon={CreditCard}
                  controls={<FilterBar value={paymentFilter} values={paymentFilters} onChange={setPaymentFilter} />}
                >
                  <div className="grid sm:grid-cols-4 gap-3 mb-4">
                    <MiniStat label="Pending" value={paymentTotals.PENDING ?? 0} />
                    <MiniStat label="Action needed" value={paymentTotals.REQUIRES_ACTION ?? 0} />
                    <MiniStat label="Confirmed" value={paymentTotals.CONFIRMED ?? 0} />
                    <MiniStat label="Failed" value={paymentTotals.FAILED ?? 0} />
                  </div>

                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill status={payment.status} />
                              <span className="font-semibold text-foreground">{payment.currency} {payment.amount}</span>
                              <span className="text-xs text-muted-foreground">{payment.provider}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {payment.user.displayName} - {payment.user.email}
                            </p>
                            <p className="text-xs text-muted-foreground break-all mt-1">
                              Ref: {payment.reference}
                            </p>
                            {payment.transactionHash && (
                              <p className="text-xs text-muted-foreground break-all mt-1">
                                Tx: {payment.transactionHash}
                              </p>
                            )}
                          </div>

                          {isAdmin && payment.status !== 'CONFIRMED' && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handlePaymentReview(payment.reference, 'CONFIRMED')}
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                              >
                                <CheckCircle2 size={16} />
                                Confirm
                              </button>
                              <button
                                onClick={() => handlePaymentReview(payment.reference, 'FAILED')}
                                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground"
                              >
                                <XCircle size={16} />
                                Fail
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!payments.length && <EmptyState text={isLoading ? 'Loading payments...' : 'No payments match this filter.'} />}
                  </div>
                </OperationsPanel>

                <OperationsPanel
                  title="Course Review"
                  icon={FileCheck2}
                  controls={<FilterBar value={courseFilter} values={courseFilters} onChange={setCourseFilter} />}
                >
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div key={course.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <StatusPill status={course.status} />
                          <span className="text-xs text-muted-foreground">{course.category}</span>
                        </div>
                        <h3 className="font-bold text-foreground">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{course.subtitle}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Author: {course.author?.displayName ?? 'Unassigned'} - Source: {course.sourcePath ?? 'Not connected'}
                        </p>
                        {course.reviews[0]?.notes && (
                          <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm text-foreground">
                            {course.reviews[0].notes}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => handleCourseReview(course.id, 'CHANGES_REQUESTED')}
                            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground"
                          >
                            Request Changes
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handlePublishCourse(course.id)}
                              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {!courses.length && <EmptyState text={isLoading ? 'Loading review queue...' : 'No courses match this filter.'} />}
                  </div>
                </OperationsPanel>
              </section>

              <OperationsPanel
                title="Contributor Applications"
                icon={Users}
                controls={<FilterBar value={applicationFilter} values={applicationFilters} onChange={setApplicationFilter} />}
              >
                <div className="grid lg:grid-cols-2 gap-3">
                  {applications.map((application) => (
                    <div key={application.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusPill status={application.status} />
                        <span className="text-xs text-muted-foreground">@{application.githubUsername}</span>
                      </div>
                      <h3 className="font-bold text-foreground">{application.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{application.email} - {application.country}</p>
                      <p className="text-xs text-muted-foreground break-all mt-2">Wallet: {application.walletAddress}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {application.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                      {application.status === 'PENDING' && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => handleApplicationReview(application.id, 'APPROVED')}
                            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationReview(application.id, 'REJECTED')}
                            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!applications.length && <EmptyState text={isLoading ? 'Loading applications...' : 'No contributor applications match this filter.'} />}
                </div>
              </OperationsPanel>
            </>
          )}
        </div>
      </main>

      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <Icon className="text-primary mb-4" size={24} />
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md bg-secondary px-3 py-2">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-foreground">{value}</p>
  </div>
);

const OperationsPanel = ({
  title,
  icon: Icon,
  controls,
  children,
}: {
  title: string;
  icon: React.ElementType;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-border bg-card p-5 md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
      <div className="flex items-center gap-3">
        <Icon className="text-primary" size={22} />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {controls}
    </div>
    {children}
  </section>
);

const FilterBar = ({
  value,
  values,
  onChange,
}: {
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {values.map((item) => (
      <button
        key={item || 'ALL'}
        onClick={() => onChange(item)}
        className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
          value === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10'
        }`}
      >
        {item || 'ALL'}
      </button>
    ))}
  </div>
);

const StatusPill = ({ status }: { status: string }) => (
  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
    {status.replaceAll('_', ' ')}
  </span>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
    {text}
  </div>
);

const AccessNotice = ({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) => (
  <section className="max-w-2xl rounded-lg border border-border bg-card p-6">
    <h2 className="text-2xl font-bold text-foreground">{title}</h2>
    <p className="text-muted-foreground mt-2 mb-5">{detail}</p>
    {action}
  </section>
);

export default AdminDashboard;
