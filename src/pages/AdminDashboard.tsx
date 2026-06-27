import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Code2,
  CreditCard,
  FileCheck2,
  Gift,
  GitPullRequest,
  Layers3,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SignUpModal from '@/components/SignUpModal';
import {
  AUTH_SESSION_EVENT,
  applyAdminGithubRepoTeamAccess,
  createAdminCourse,
  createAdminContributorReward,
  createAdminCoupon,
  createAdminExercise,
  createAdminLesson,
  createAdminModule,
  fetchAdminAuthoringCourses,
  fetchAdminCoupons,
  fetchAdminContributorApplications,
  fetchAdminCourseReviewQueue,
  fetchAdminGoodDollarConfig,
  fetchAdminOverview,
  fetchAdminPayments,
  getSession,
  publishAdminCourse,
  reviewAdminContributorApplication,
  reviewAdminCourse,
  syncAdminGithubContribution,
  syncAdminGithubCourseRepository,
  verifyPaymentIntent,
  type AdminAuthoringCourse,
  type AdminContributorApplication,
  type AdminContributorReward,
  type AdminCoupon,
  type AdminGoodDollarConfig,
  type AdminCourseReviewItem,
  type AdminOverview,
  type AdminPayment,
  type AuthUser,
  type CourseAuthoringInput,
  type ExerciseAuthoringInput,
  type LessonAuthoringInput,
  type ModuleAuthoringInput,
} from '@/lib/auth';
import { formatWalletAddress, prepareGoodDollarReward } from '@/lib/wallet';

const paymentFilters = ['', 'PENDING', 'REQUIRES_ACTION', 'CONFIRMED', 'FAILED'];
const courseFilters = ['', 'DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED'];
const safeArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const applicationFilters = ['', 'PENDING', 'APPROVED', 'REJECTED'];
type GithubSyncStatus = 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';

type RewardFormState = {
  amountGd: string;
  title: string;
  contributionType: string;
  repositoryUrl: string;
  pullRequestUrl: string;
  notes: string;
};

const defaultRewardForm: RewardFormState = {
  amountGd: '25',
  title: 'Approved TribeBlock contribution',
  contributionType: 'Platform improvement',
  repositoryUrl: 'https://github.com/Tribe-Block-University',
  pullRequestUrl: '',
  notes: '',
};

const defaultGithubSyncForm = {
  githubUsername: '',
  repositoryUrl: 'https://github.com/Tribe-Block-University',
  pullRequestUrl: '',
  commitSha: '',
  title: '',
  contributionType: 'Platform improvement',
  status: 'APPROVED' as GithubSyncStatus,
};

const defaultGithubCourseSyncForm = {
  fullName: 'Tribe-Block-University/course-repository-name',
  ref: '',
  repositoryUrl: 'https://github.com/Tribe-Block-University/course-repository-name',
};

const AdminDashboard: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getSession()?.user ?? null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [courses, setCourses] = useState<AdminCourseReviewItem[]>([]);
  const [authoringCourses, setAuthoringCourses] = useState<AdminAuthoringCourse[]>([]);
  const [applications, setApplications] = useState<AdminContributorApplication[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [goodDollarConfig, setGoodDollarConfig] = useState<AdminGoodDollarConfig | null>(null);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthoringLoading, setIsAuthoringLoading] = useState(false);
  const [preparingRewardId, setPreparingRewardId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [courseForm, setCourseForm] = useState<CourseAuthoringInput>({
    title: '',
    subtitle: '',
    description: '',
    category: 'frontend',
    level: 'BEGINNER',
    visibility: 'FREE',
    isFreeBasic: true,
    estimatedHours: 8,
    languageTags: ['JavaScript'],
    skillTags: ['Programming fundamentals'],
  });
  const [moduleForm, setModuleForm] = useState<ModuleAuthoringInput>({ title: '', summary: '' });
  const [lessonForm, setLessonForm] = useState<LessonAuthoringInput>({
    title: '',
    summary: '',
    bodyMarkdown: '# Lesson\n\nWrite lesson content here.',
    visibility: 'FREE',
    estimatedMinutes: 25,
  });
  const [exerciseForm, setExerciseForm] = useState({
    title: '',
    instructions: 'Complete the starter files so the exercise meets the requirement.',
    runtime: 'BROWSER_HTML_CSS_JS' as ExerciseAuthoringInput['runtime'],
    visibility: 'FREE' as ExerciseAuthoringInput['visibility'],
    starterFilesJson: '{\n  "index.html": "<main id=\\"app\\">Build here</main>",\n  "style.css": "body { font-family: system-ui, sans-serif; }",\n  "script.js": "console.log(\\"Tribe Block University\\");"\n}',
    testsJson: '[\n  {\n    "name": "Required output exists",\n    "assertion": "Submitted files include the requested solution.",\n    "isHidden": false\n  }\n]',
  });
  const [githubSyncForm, setGithubSyncForm] = useState(defaultGithubSyncForm);
  const [githubCourseSyncForm, setGithubCourseSyncForm] = useState(defaultGithubCourseSyncForm);
  const [rewardForms, setRewardForms] = useState<Record<string, RewardFormState>>({});
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountPercent: 20,
    appliesToTiers: ['PLUS', 'PRO'] as Array<'BASIC' | 'PLUS' | 'PRO'>,
    isActive: true,
    maxRedemptions: '',
  });

  const canReview = user?.role === 'ADMIN' || user?.role === 'MENTOR_REVIEWER';
  const canAuthor = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';
  const canOpenWorkspace = canReview || canAuthor;
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

  useEffect(() => {
    if (!canAuthor) return;
    void loadAuthoringCourses();
  }, [canAuthor]);

  const paymentTotals = overview?.totals.payments ?? {};
  const courseTotals = overview?.totals.courses ?? {};

  const queueCount = useMemo(() => {
    return (courseTotals.DRAFT ?? 0) + (courseTotals.UNDER_REVIEW ?? 0) + (courseTotals.CHANGES_REQUESTED ?? 0);
  }, [courseTotals]);
  const selectedCourse = authoringCourses.find((course) => course.id === selectedCourseId);
  const availableModules = selectedCourse?.modules ?? [];
  const selectedModule = availableModules.find((module) => module.id === selectedModuleId);
  const availableLessons = selectedModule?.lessons ?? [];

  useEffect(() => {
    const firstModule = availableModules[0];
    if (!firstModule) {
      setSelectedModuleId('');
      setSelectedLessonId('');
      return;
    }

    if (!availableModules.some((module) => module.id === selectedModuleId)) {
      setSelectedModuleId(firstModule.id);
    }
  }, [selectedCourseId, authoringCourses]);

  useEffect(() => {
    const firstLesson = availableLessons[0];
    if (!firstLesson) {
      setSelectedLessonId('');
      return;
    }

    if (!availableLessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(firstLesson.id);
    }
  }, [selectedModuleId, authoringCourses]);

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
      setPayments(Array.isArray(nextPayments) ? nextPayments : []);
      setCourses(Array.isArray(nextCourses) ? nextCourses : []);
      setApplications(Array.isArray(nextApplications) ? nextApplications : []);

      fetchAdminGoodDollarConfig()
        .then(setGoodDollarConfig)
        .catch(() => setGoodDollarConfig(null));

      if (isAdmin) {
        fetchAdminCoupons()
          .then((nextCoupons) => setCoupons(Array.isArray(nextCoupons) ? nextCoupons : []))
          .catch(() => setCoupons([]));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuthoringCourses = async () => {
    setIsAuthoringLoading(true);
    setMessage('');

    try {
      const nextCourses = await fetchAdminAuthoringCourses();
      setAuthoringCourses(nextCourses);

      if (!selectedCourseId && nextCourses[0]) {
        setSelectedCourseId(nextCourses[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load authoring courses.');
    } finally {
      setIsAuthoringLoading(false);
    }
  };

  const handleCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    try {
      const created = await createAdminCourse({
        ...courseForm,
        languageTags: courseForm.languageTags.filter(Boolean),
        skillTags: courseForm.skillTags.filter(Boolean),
      });
      setMessage('Course draft created and placed under review.');
      setSelectedCourseId(created.id);
      setCourseForm({ ...courseForm, title: '', subtitle: '', description: '' });
      await loadAuthoringCourses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create course.');
    }
  };

  const handleCreateModule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    try {
      await createAdminModule(selectedCourseId, moduleForm);
      setMessage('Module added.');
      setModuleForm({ title: '', summary: '' });
      await loadAuthoringCourses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add module.');
    }
  };

  const handleCreateLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedModuleId) return;

    try {
      await createAdminLesson(selectedModuleId, lessonForm);
      setMessage('Lesson added.');
      setLessonForm({ title: '', summary: '', bodyMarkdown: '# Lesson\n\nWrite lesson content here.', visibility: 'FREE', estimatedMinutes: 25 });
      await loadAuthoringCourses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add lesson.');
    }
  };

  const handleCreateExercise = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLessonId) return;

    try {
      const starterFiles = JSON.parse(exerciseForm.starterFilesJson) as Record<string, string>;
      const tests = JSON.parse(exerciseForm.testsJson) as ExerciseAuthoringInput['tests'];
      await createAdminExercise(selectedLessonId, {
        title: exerciseForm.title,
        instructions: exerciseForm.instructions,
        runtime: exerciseForm.runtime,
        starterFiles,
        visibility: exerciseForm.visibility,
        tests,
      });
      setMessage('IDE exercise added.');
      setExerciseForm({ ...exerciseForm, title: '' });
      await loadAuthoringCourses();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add IDE exercise. Check that starter files and tests are valid JSON.');
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

  const updateRewardForm = (applicationId: string, patch: Partial<RewardFormState>) => {
    setRewardForms((current) => ({
      ...current,
      [applicationId]: { ...(current[applicationId] ?? defaultRewardForm), ...patch },
    }));
  };

  const rewardFormFor = (applicationId: string) => rewardForms[applicationId] ?? defaultRewardForm;

  const handleSyncGithubContribution = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    try {
      await syncAdminGithubContribution({
        ...githubSyncForm,
        pullRequestUrl: githubSyncForm.pullRequestUrl || undefined,
        commitSha: githubSyncForm.commitSha || undefined,
      });
      setMessage('GitHub contribution synced into contributor operations.');
      setGithubSyncForm(defaultGithubSyncForm);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sync GitHub contribution.');
    }
  };

  const handleSyncGithubCourseRepository = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    try {
      const result = await syncAdminGithubCourseRepository({
        fullName: githubCourseSyncForm.fullName,
        ref: githubCourseSyncForm.ref || undefined,
        repositoryUrl: githubCourseSyncForm.repositoryUrl || undefined,
      });
      setMessage(`Course sync complete. ${result.coursesSynced} of ${result.coursesFound} course package(s) synced.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sync GitHub course repository.');
    }
  };

  const handleApplyGithubRepoTeamAccess = async () => {
    setMessage('');

    try {
      const result = await applyAdminGithubRepoTeamAccess({ fullName: githubCourseSyncForm.fullName });
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to apply GitHub team access.');
    }
  };

  const handleCreateReward = async (application: AdminContributorApplication, event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    const form = rewardFormFor(application.id);

    try {
      const reward = await createAdminContributorReward(application.id, {
        amountGd: form.amountGd,
        title: form.title,
        contributionType: form.contributionType,
        repositoryUrl: form.repositoryUrl,
        pullRequestUrl: form.pullRequestUrl || undefined,
        notes: form.notes || undefined,
      });
      setMessage(`G$ reward created. Reward ID ${reward.id} is ready to prepare in the vault.`);
      setRewardForms((current) => ({ ...current, [application.id]: defaultRewardForm }));
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create contributor reward.');
    }
  };

  const handlePrepareReward = async (reward: AdminContributorReward) => {
    setMessage('');

    if (!goodDollarConfig?.vaultAddress) {
      setMessage('The G$ rewards vault address is not configured yet.');
      return;
    }

    setPreparingRewardId(reward.id);

    try {
      const transactionHash = await prepareGoodDollarReward({
        vaultAddress: goodDollarConfig.vaultAddress,
        rewardId: reward.id,
        recipientAddress: reward.walletAddress,
        amount: reward.amountGd,
        decimals: goodDollarConfig.decimals,
      });
      setMessage(`Reward prepared in the G$ vault. Transaction: ${transactionHash}`);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to prepare reward in the G$ vault.');
    } finally {
      setPreparingRewardId('');
    }
  };

  const handleCreateCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    try {
      await createAdminCoupon({
        code: couponForm.code,
        description: couponForm.description || undefined,
        discountPercent: couponForm.discountPercent,
        appliesToTiers: couponForm.appliesToTiers,
        isActive: couponForm.isActive,
        maxRedemptions: couponForm.maxRedemptions ? Number(couponForm.maxRedemptions) : undefined,
      });
      setMessage('Coupon created.');
      setCouponForm({ ...couponForm, code: '', description: '', maxRedemptions: '' });
      setCoupons(await fetchAdminCoupons());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create coupon.');
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
                Stage 10 Authoring
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Create courses, program IDE exercises, review submissions, and operate payments and contributor workflows.
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
          ) : !canOpenWorkspace ? (
            <AccessNotice
              title="This account does not have operations access."
              detail="Admin, instructor, and mentor reviewer roles can open this dashboard."
            />
          ) : (
            <>
              {message && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                  {message}
                </div>
              )}

              {canAuthor && (
                <AuthoringWorkspace
                  courses={authoringCourses}
                  isLoading={isAuthoringLoading}
                  selectedCourseId={selectedCourseId}
                  selectedModuleId={selectedModuleId}
                  selectedLessonId={selectedLessonId}
                  availableModules={availableModules}
                  availableLessons={availableLessons}
                  courseForm={courseForm}
                  moduleForm={moduleForm}
                  lessonForm={lessonForm}
                  exerciseForm={exerciseForm}
                  onCourseChange={setSelectedCourseId}
                  onModuleChange={setSelectedModuleId}
                  onLessonChange={setSelectedLessonId}
                  onCourseFormChange={setCourseForm}
                  onModuleFormChange={setModuleForm}
                  onLessonFormChange={setLessonForm}
                  onExerciseFormChange={setExerciseForm}
                  onCreateCourse={handleCreateCourse}
                  onCreateModule={handleCreateModule}
                  onCreateLesson={handleCreateLesson}
                  onCreateExercise={handleCreateExercise}
                />
              )}

              {canReview && (
                <>
                  <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Metric icon={Users} label="Users" value={overview?.totals.users ?? 0} />
                    <Metric icon={BadgeCheck} label="Active subscriptions" value={overview?.totals.activeSubscriptions ?? 0} />
                    <Metric icon={BookOpenCheck} label="Course review queue" value={queueCount} />
                    <Metric icon={WalletCards} label="Pending rewards" value={overview?.totals.pendingRewards ?? 0} />
                  </section>

                  {isAdmin && (
                    <CouponManager
                      coupons={coupons}
                      couponForm={couponForm}
                      onCouponFormChange={setCouponForm}
                      onCreateCoupon={handleCreateCoupon}
                    />
                  )}

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
                            <PaymentProof payment={payment} />
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
                        {safeArray(course.reviews)[0]?.notes && (
                          <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm text-foreground">
                            {safeArray(course.reviews)[0].notes}
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

                  <GithubContributionSync
                    form={githubSyncForm}
                    onFormChange={setGithubSyncForm}
                    onSubmit={handleSyncGithubContribution}
                    webhookPath="/api/contributors/github/webhook"
                  />

                  {isAdmin && (
                    <GithubCourseSync
                      form={githubCourseSyncForm}
                      onFormChange={setGithubCourseSyncForm}
                      onSubmit={handleSyncGithubCourseRepository}
                      onApplyTeamAccess={handleApplyGithubRepoTeamAccess}
                    />
                  )}

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
                        {safeArray(application.skills).slice(0, 4).map((skill) => (
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

                      <div className="mt-4 space-y-3">
                        <div className="rounded-md bg-secondary/50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Synced contributions</p>
                          {safeArray(application.contributions).slice(0, 3).map((contribution) => (
                            <div key={contribution.id} className="mt-2 text-sm">
                              <p className="font-semibold text-foreground">{contribution.title}</p>
                              <p className="text-xs text-muted-foreground">{contribution.contributionType} - {contribution.status}</p>
                              {contribution.pullRequestUrl && (
                                <a className="text-xs font-semibold text-primary break-all" href={contribution.pullRequestUrl} target="_blank" rel="noreferrer">
                                  Pull request
                                </a>
                              )}
                            </div>
                          ))}
                          {!safeArray(application.contributions).length && <p className="mt-2 text-xs text-muted-foreground">No GitHub contributions synced yet.</p>}
                        </div>

                        <div className="rounded-md bg-secondary/50 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">G$ rewards</p>
                          {safeArray(application.rewards).slice(0, 3).map((reward) => (
                            <div key={reward.id} className="mt-2 rounded-md border border-border bg-background p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-foreground">{reward.amountGd} G$</p>
                                  <p className="text-xs text-muted-foreground">{reward.status} - {formatWalletAddress(reward.walletAddress)}</p>
                                </div>
                                {isAdmin && reward.status === 'READY' && !reward.transactionHash && (
                                  <button
                                    onClick={() => handlePrepareReward(reward)}
                                    disabled={preparingRewardId === reward.id}
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                                  >
                                    <Gift size={14} />
                                    {preparingRewardId === reward.id ? 'Preparing...' : 'Prepare Vault'}
                                  </button>
                                )}
                              </div>
                              <p className="mt-2 break-all text-[11px] text-muted-foreground">Reward ID: {reward.id}</p>
                            </div>
                          ))}
                          {!safeArray(application.rewards).length && <p className="mt-2 text-xs text-muted-foreground">No rewards created yet.</p>}
                        </div>

                        {isAdmin && application.status === 'APPROVED' && (
                          <form onSubmit={(event) => handleCreateReward(application, event)} className="rounded-md border border-border p-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <Gift className="text-primary" size={16} />
                              <p className="font-semibold text-foreground">Create G$ Reward</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <AdminInput label="Amount G$" value={rewardFormFor(application.id).amountGd} onChange={(amountGd) => updateRewardForm(application.id, { amountGd })} required />
                              <AdminInput label="Contribution Type" value={rewardFormFor(application.id).contributionType} onChange={(contributionType) => updateRewardForm(application.id, { contributionType })} required />
                            </div>
                            <AdminInput label="Contribution Title" value={rewardFormFor(application.id).title} onChange={(title) => updateRewardForm(application.id, { title })} required />
                            <AdminInput label="Pull Request URL" value={rewardFormFor(application.id).pullRequestUrl} onChange={(pullRequestUrl) => updateRewardForm(application.id, { pullRequestUrl })} />
                            <AdminInput label="Notes" value={rewardFormFor(application.id).notes} onChange={(notes) => updateRewardForm(application.id, { notes })} />
                            <button className="btn-primary w-full py-3" type="submit">Create Reward Record</button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                  {!applications.length && <EmptyState text={isLoading ? 'Loading applications...' : 'No contributor applications match this filter.'} />}
                </div>
                  </OperationsPanel>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

type ExerciseFormState = {
  title: string;
  instructions: string;
  runtime: ExerciseAuthoringInput['runtime'];
  visibility: ExerciseAuthoringInput['visibility'];
  starterFilesJson: string;
  testsJson: string;
};

type AuthoringWorkspaceProps = {
  courses: AdminAuthoringCourse[];
  isLoading: boolean;
  selectedCourseId: string;
  selectedModuleId: string;
  selectedLessonId: string;
  availableModules: AdminAuthoringCourse['modules'];
  availableLessons: AdminAuthoringCourse['modules'][number]['lessons'];
  courseForm: CourseAuthoringInput;
  moduleForm: ModuleAuthoringInput;
  lessonForm: LessonAuthoringInput;
  exerciseForm: ExerciseFormState;
  onCourseChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onLessonChange: (value: string) => void;
  onCourseFormChange: (value: CourseAuthoringInput) => void;
  onModuleFormChange: (value: ModuleAuthoringInput) => void;
  onLessonFormChange: (value: LessonAuthoringInput) => void;
  onExerciseFormChange: (value: ExerciseFormState) => void;
  onCreateCourse: (event: React.FormEvent) => void;
  onCreateModule: (event: React.FormEvent) => void;
  onCreateLesson: (event: React.FormEvent) => void;
  onCreateExercise: (event: React.FormEvent) => void;
};

const AuthoringWorkspace: React.FC<AuthoringWorkspaceProps> = ({
  courses,
  isLoading,
  selectedCourseId,
  selectedModuleId,
  selectedLessonId,
  availableModules,
  availableLessons,
  courseForm,
  moduleForm,
  lessonForm,
  exerciseForm,
  onCourseChange,
  onModuleChange,
  onLessonChange,
  onCourseFormChange,
  onModuleFormChange,
  onLessonFormChange,
  onExerciseFormChange,
  onCreateCourse,
  onCreateModule,
  onCreateLesson,
  onCreateExercise,
}) => (
  <OperationsPanel title="Course Authoring" icon={PencilLine}>
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenCheck className="text-primary" size={18} />
            <h3 className="font-bold text-foreground">Create Course Draft</h3>
          </div>
          <form onSubmit={onCreateCourse} className="space-y-3">
            <AdminInput label="Title" value={courseForm.title} onChange={(title) => onCourseFormChange({ ...courseForm, title })} required />
            <AdminInput label="Subtitle" value={courseForm.subtitle} onChange={(subtitle) => onCourseFormChange({ ...courseForm, subtitle })} required />
            <AdminTextarea label="Description" value={courseForm.description} onChange={(description) => onCourseFormChange({ ...courseForm, description })} required />
            <div className="grid sm:grid-cols-2 gap-3">
              <AdminSelect
                label="Category"
                value={courseForm.category}
                values={['frontend', 'backend', 'blockchain', 'data', 'devops', 'design', 'business', 'cybersecurity']}
                onChange={(category) => onCourseFormChange({ ...courseForm, category })}
              />
              <AdminSelect
                label="Level"
                value={courseForm.level}
                values={['BEGINNER', 'INTERMEDIATE', 'ADVANCED']}
                onChange={(level) => onCourseFormChange({ ...courseForm, level: level as CourseAuthoringInput['level'] })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <AdminSelect
                label="Visibility"
                value={courseForm.visibility}
                values={['FREE', 'PREVIEW', 'PLUS', 'PRO']}
                onChange={(visibility) => onCourseFormChange({ ...courseForm, visibility: visibility as CourseAuthoringInput['visibility'] })}
              />
              <AdminInput
                label="Estimated Hours"
                type="number"
                value={String(courseForm.estimatedHours)}
                onChange={(estimatedHours) => onCourseFormChange({ ...courseForm, estimatedHours: Number(estimatedHours) })}
                required
              />
            </div>
            <AdminInput
              label="Language Tags"
              value={courseForm.languageTags.join(', ')}
              onChange={(value) => onCourseFormChange({ ...courseForm, languageTags: commaList(value) })}
            />
            <AdminInput
              label="Skill Tags"
              value={courseForm.skillTags.join(', ')}
              onChange={(value) => onCourseFormChange({ ...courseForm, skillTags: commaList(value) })}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={courseForm.isFreeBasic}
                onChange={(event) => onCourseFormChange({ ...courseForm, isFreeBasic: event.target.checked })}
              />
              Free foundational course
            </label>
            <button className="btn-primary w-full py-3" type="submit">Create Draft</button>
          </form>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers3 className="text-primary" size={18} />
            <h3 className="font-bold text-foreground">Course Structure</h3>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading authoring courses...</p>
          ) : courses.length ? (
            <div className="space-y-3">
              <AdminSelect
                label="Course"
                value={selectedCourseId}
                values={courses.map((course) => course.id)}
                labels={Object.fromEntries(courses.map((course) => [course.id, `${course.title} (${course.status})`]))}
                onChange={onCourseChange}
              />
              <div className="space-y-2">
                {safeArray(courses.find((course) => course.id === selectedCourseId)?.modules).map((module) => (
                  <div key={module.id} className="rounded-md bg-secondary/60 p-3">
                    <p className="font-semibold text-foreground">{module.sortOrder}. {module.title}</p>
                    <p className="text-xs text-muted-foreground">{module.lessons.length} lessons</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="No drafts yet. Create a course draft to begin." />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <form onSubmit={onCreateModule} className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-bold text-foreground">Add Module</h3>
            <AdminInput label="Module Title" value={moduleForm.title} onChange={(title) => onModuleFormChange({ ...moduleForm, title })} required />
            <AdminTextarea label="Summary" value={moduleForm.summary} onChange={(summary) => onModuleFormChange({ ...moduleForm, summary })} required />
            <button disabled={!selectedCourseId} className="btn-primary w-full py-3 disabled:opacity-50" type="submit">Add Module</button>
          </form>

          <form onSubmit={onCreateLesson} className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-bold text-foreground">Add Lesson</h3>
            <AdminSelect
              label="Module"
              value={selectedModuleId}
              values={availableModules.map((module) => module.id)}
              labels={Object.fromEntries(availableModules.map((module) => [module.id, module.title]))}
              onChange={onModuleChange}
            />
            <AdminInput label="Lesson Title" value={lessonForm.title} onChange={(title) => onLessonFormChange({ ...lessonForm, title })} required />
            <AdminTextarea label="Summary" value={lessonForm.summary} onChange={(summary) => onLessonFormChange({ ...lessonForm, summary })} required />
            <div className="grid sm:grid-cols-2 gap-3">
              <AdminSelect
                label="Visibility"
                value={lessonForm.visibility}
                values={['FREE', 'PREVIEW', 'PLUS', 'PRO']}
                onChange={(visibility) => onLessonFormChange({ ...lessonForm, visibility: visibility as LessonAuthoringInput['visibility'] })}
              />
              <AdminInput
                label="Minutes"
                type="number"
                value={String(lessonForm.estimatedMinutes)}
                onChange={(estimatedMinutes) => onLessonFormChange({ ...lessonForm, estimatedMinutes: Number(estimatedMinutes) })}
                required
              />
            </div>
            <AdminTextarea label="Body Markdown" rows={5} value={lessonForm.bodyMarkdown} onChange={(bodyMarkdown) => onLessonFormChange({ ...lessonForm, bodyMarkdown })} />
            <button disabled={!selectedModuleId} className="btn-primary w-full py-3 disabled:opacity-50" type="submit">Add Lesson</button>
          </form>
        </div>

        <form onSubmit={onCreateExercise} className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="text-primary" size={18} />
            <h3 className="font-bold text-foreground">Program IDE Exercise</h3>
          </div>
          <AdminSelect
            label="Lesson"
            value={selectedLessonId}
            values={availableLessons.map((lesson) => lesson.id)}
            labels={Object.fromEntries(availableLessons.map((lesson) => [lesson.id, lesson.title]))}
            onChange={onLessonChange}
          />
          <div className="grid lg:grid-cols-3 gap-3">
            <AdminInput label="Exercise Title" value={exerciseForm.title} onChange={(title) => onExerciseFormChange({ ...exerciseForm, title })} required />
            <AdminSelect
              label="Runtime"
              value={exerciseForm.runtime}
              values={['BROWSER_HTML_CSS_JS', 'NODE', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'BASH', 'SQL', 'SOLIDITY']}
              onChange={(runtime) => onExerciseFormChange({ ...exerciseForm, runtime: runtime as ExerciseAuthoringInput['runtime'] })}
            />
            <AdminSelect
              label="Visibility"
              value={exerciseForm.visibility}
              values={['FREE', 'PREVIEW', 'PLUS', 'PRO']}
              onChange={(visibility) => onExerciseFormChange({ ...exerciseForm, visibility: visibility as ExerciseAuthoringInput['visibility'] })}
            />
          </div>
          <AdminTextarea label="Instructions" rows={3} value={exerciseForm.instructions} onChange={(instructions) => onExerciseFormChange({ ...exerciseForm, instructions })} />
          <div className="grid lg:grid-cols-2 gap-3">
            <AdminTextarea label="Starter Files JSON" rows={8} value={exerciseForm.starterFilesJson} onChange={(starterFilesJson) => onExerciseFormChange({ ...exerciseForm, starterFilesJson })} />
            <AdminTextarea label="Tests JSON" rows={8} value={exerciseForm.testsJson} onChange={(testsJson) => onExerciseFormChange({ ...exerciseForm, testsJson })} />
          </div>
          <button disabled={!selectedLessonId} className="btn-primary w-full py-3 disabled:opacity-50" type="submit">Add IDE Exercise</button>
        </form>
      </div>
    </div>
  </OperationsPanel>
);

const GithubContributionSync = ({
  form,
  onFormChange,
  onSubmit,
  webhookPath,
}: {
  form: typeof defaultGithubSyncForm;
  onFormChange: (value: typeof defaultGithubSyncForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  webhookPath: string;
}) => (
  <OperationsPanel title="GitHub Contribution Sync" icon={GitPullRequest}>
    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-border p-4 space-y-3">
        <h3 className="font-bold text-foreground">Sync Reviewed Pull Request</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <AdminInput label="GitHub Username" value={form.githubUsername} onChange={(githubUsername) => onFormChange({ ...form, githubUsername })} required />
          <AdminSelect
            label="Status"
            value={form.status}
            values={['PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED']}
            onChange={(status) => onFormChange({ ...form, status: status as GithubSyncStatus })}
          />
        </div>
        <AdminInput label="Repository URL" value={form.repositoryUrl} onChange={(repositoryUrl) => onFormChange({ ...form, repositoryUrl })} required />
        <AdminInput label="Pull Request URL" value={form.pullRequestUrl} onChange={(pullRequestUrl) => onFormChange({ ...form, pullRequestUrl })} />
        <AdminInput label="Title" value={form.title} onChange={(title) => onFormChange({ ...form, title })} required />
        <div className="grid sm:grid-cols-2 gap-3">
          <AdminInput label="Contribution Type" value={form.contributionType} onChange={(contributionType) => onFormChange({ ...form, contributionType })} required />
          <AdminInput label="Commit SHA" value={form.commitSha} onChange={(commitSha) => onFormChange({ ...form, commitSha })} />
        </div>
        <button className="btn-primary w-full py-3" type="submit">Sync Contribution</button>
      </form>

      <div className="rounded-lg border border-border p-4">
        <h3 className="font-bold text-foreground">Webhook Automation</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add this endpoint to the GitHub repository webhook settings for pull request events. Merged PRs are recorded as approved contributions and matched by GitHub username.
        </p>
        <div className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-foreground break-all">
          {webhookPath}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          In production, set GITHUB_WEBHOOK_SECRET on Render and use the same secret in GitHub so webhook payloads are verified.
        </p>
      </div>
    </div>
  </OperationsPanel>
);

const GithubCourseSync = ({
  form,
  onFormChange,
  onSubmit,
  onApplyTeamAccess,
}: {
  form: typeof defaultGithubCourseSyncForm;
  onFormChange: (value: typeof defaultGithubCourseSyncForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onApplyTeamAccess: () => void;
}) => (
  <OperationsPanel title="GitHub Course Sync" icon={BookOpenCheck}>
    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-border p-4 space-y-3">
        <h3 className="font-bold text-foreground">Import Approved Course Repository</h3>
        <AdminInput
          label="Repository full name"
          value={form.fullName}
          onChange={(fullName) => onFormChange({ ...form, fullName })}
          required
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <AdminInput
            label="Branch or ref"
            value={form.ref}
            onChange={(ref) => onFormChange({ ...form, ref })}
          />
          <AdminInput
            label="Repository URL"
            value={form.repositoryUrl}
            onChange={(repositoryUrl) => onFormChange({ ...form, repositoryUrl })}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button className="btn-primary w-full py-3" type="submit">Sync Courses</button>
          <button className="rounded-md border border-border px-4 py-3 font-semibold text-foreground" type="button" onClick={onApplyTeamAccess}>
            Apply Team Access
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-border p-4">
        <h3 className="font-bold text-foreground">Automatic Import Rules</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a GitHub repository as owner/repo, for example Tribe-Block-University/learn-html. The importer scans for course.yml, module.yml, lessons, quizzes, IDE exercises, practicals, final exam, and final project files.
        </p>
        <div className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-foreground break-all">
          POST /api/admin/course-sync/github-repository
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Existing courses are updated by slug. Apply Team Access gives course-contributors write access, course-reviewers maintain access, and admins admin access for the selected repo.
        </p>
      </div>
    </div>
  </OperationsPanel>
);

const CouponManager = ({
  coupons,
  couponForm,
  onCouponFormChange,
  onCreateCoupon,
}: {
  coupons: AdminCoupon[];
  couponForm: {
    code: string;
    description: string;
    discountPercent: number;
    appliesToTiers: Array<'BASIC' | 'PLUS' | 'PRO'>;
    isActive: boolean;
    maxRedemptions: string;
  };
  onCouponFormChange: (value: {
    code: string;
    description: string;
    discountPercent: number;
    appliesToTiers: Array<'BASIC' | 'PLUS' | 'PRO'>;
    isActive: boolean;
    maxRedemptions: string;
  }) => void;
  onCreateCoupon: (event: React.FormEvent) => void;
}) => (
  <OperationsPanel title="Coupons" icon={Sparkles}>
    <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-5">
      <form onSubmit={onCreateCoupon} className="rounded-lg border border-border p-4 space-y-3">
        <h3 className="font-bold text-foreground">Create Discount Coupon</h3>
        <AdminInput label="Code" value={couponForm.code} onChange={(code) => onCouponFormChange({ ...couponForm, code: code.toUpperCase() })} required />
        <AdminInput label="Description" value={couponForm.description} onChange={(description) => onCouponFormChange({ ...couponForm, description })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <AdminInput
            label="Discount Percent"
            type="number"
            value={String(couponForm.discountPercent)}
            onChange={(discountPercent) => onCouponFormChange({ ...couponForm, discountPercent: Number(discountPercent) })}
            required
          />
          <AdminInput
            label="Max Redemptions"
            type="number"
            value={couponForm.maxRedemptions}
            onChange={(maxRedemptions) => onCouponFormChange({ ...couponForm, maxRedemptions })}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Applies to tiers</p>
          <div className="flex flex-wrap gap-2">
            {(['BASIC', 'PLUS', 'PRO'] as const).map((tier) => (
              <label key={tier} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={couponForm.appliesToTiers.includes(tier)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...couponForm.appliesToTiers, tier]
                      : couponForm.appliesToTiers.filter((item) => item !== tier);
                    onCouponFormChange({ ...couponForm, appliesToTiers: next });
                  }}
                />
                {tier}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={couponForm.isActive}
            onChange={(event) => onCouponFormChange({ ...couponForm, isActive: event.target.checked })}
          />
          Active immediately
        </label>
        <button className="btn-primary w-full py-3" type="submit">Create Coupon</button>
      </form>

      <div className="rounded-lg border border-border p-4">
        <h3 className="font-bold text-foreground mb-3">Existing Coupons</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-md bg-secondary/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-foreground">{coupon.code}</p>
                <StatusPill status={coupon.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{coupon.discountPercent}% off {safeArray(coupon.appliesToTiers).join(', ')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Redeemed {coupon.redemptionCount}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
              </p>
              {coupon.description && <p className="text-xs text-muted-foreground mt-2">{coupon.description}</p>}
            </div>
          ))}
          {!coupons.length && <EmptyState text="No coupons created yet." />}
        </div>
      </div>
    </div>
  </OperationsPanel>
);


const PaymentProof = ({ payment }: { payment: AdminPayment }) => {
  const metadata = payment.providerMetadata;
  const proof = metadata?.onChainProof;
  const detailRows = [
    metadata?.paymentMode ? ['Mode', metadata.paymentMode.replaceAll('_', ' ')] : null,
    metadata?.treasuryAddress ? ['Treasury', metadata.treasuryAddress] : null,
    metadata?.paymentContractAddress ? ['Contract', metadata.paymentContractAddress] : null,
    metadata?.amountUnits ? ['Amount Units', metadata.amountUnits] : null,
    proof?.payer ? ['Payer', proof.payer] : null,
    proof?.from ? ['From', proof.from] : null,
    proof?.to ? ['To', proof.to] : null,
    proof?.receiverAddress ? ['Receiver', proof.receiverAddress] : null,
    proof?.contractAddress ? ['Proof Contract', proof.contractAddress] : null,
    proof?.blockNumber ? ['Block', proof.blockNumber] : null,
  ].filter(Boolean) as Array<[string, string]>;

  if (!metadata && !proof && !payment.receiverAddress && !payment.transactionHash) {
    return null;
  }

  return (
    <div className="mt-3 rounded-md bg-secondary/60 p-3 text-xs text-muted-foreground">
      <p className="mb-2 font-bold uppercase tracking-wide text-foreground">Payment proof</p>
      <div className="space-y-1">
        {payment.receiverAddress && (
          <p className="break-all"><span className="font-semibold text-foreground">Receiver:</span> {payment.receiverAddress}</p>
        )}
        {payment.transactionHash && (
          <p className="break-all"><span className="font-semibold text-foreground">Transaction:</span> {payment.transactionHash}</p>
        )}
        {detailRows.map(([label, value]) => (
          <p key={label} className="break-all"><span className="font-semibold text-foreground">{label}:</span> {value}</p>
        ))}
        {metadata?.instruction && <p><span className="font-semibold text-foreground">Instruction:</span> {metadata.instruction}</p>}
        {metadata?.confirmationNote && <p><span className="font-semibold text-foreground">Confirmation:</span> {metadata.confirmationNote}</p>}
        {metadata?.verificationNote && <p><span className="font-semibold text-foreground">Verification:</span> {metadata.verificationNote}</p>}
      </div>
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

const AdminInput = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) => (
  <label className="block text-sm">
    <span className="block font-semibold text-foreground mb-1">{label}</span>
    <input
      type={type}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    />
  </label>
);

const AdminTextarea = ({
  label,
  value,
  onChange,
  rows = 3,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) => (
  <label className="block text-sm">
    <span className="block font-semibold text-foreground mb-1">{label}</span>
    <textarea
      value={value}
      rows={rows}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    />
  </label>
);

const AdminSelect = ({
  label,
  value,
  values,
  labels = {},
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) => (
  <label className="block text-sm">
    <span className="block font-semibold text-foreground mb-1">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {!values.length && <option value="">No options yet</option>}
      {values.map((item) => (
        <option key={item} value={item}>
          {labels[item] ?? item}
        </option>
      ))}
    </select>
  </label>
);

const commaList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default AdminDashboard;
