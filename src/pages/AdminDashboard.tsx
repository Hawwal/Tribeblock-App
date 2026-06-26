import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Code2,
  CreditCard,
  FileCheck2,
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
  createAdminCourse,
  createAdminCoupon,
  createAdminExercise,
  createAdminLesson,
  createAdminModule,
  fetchAdminAuthoringCourses,
  fetchAdminCoupons,
  fetchAdminContributorApplications,
  fetchAdminCourseReviewQueue,
  fetchAdminOverview,
  fetchAdminPayments,
  getSession,
  publishAdminCourse,
  reviewAdminContributorApplication,
  reviewAdminCourse,
  verifyPaymentIntent,
  type AdminAuthoringCourse,
  type AdminContributorApplication,
  type AdminCoupon,
  type AdminCourseReviewItem,
  type AdminOverview,
  type AdminPayment,
  type AuthUser,
  type CourseAuthoringInput,
  type ExerciseAuthoringInput,
  type LessonAuthoringInput,
  type ModuleAuthoringInput,
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
  const [authoringCourses, setAuthoringCourses] = useState<AdminAuthoringCourse[]>([]);
  const [applications, setApplications] = useState<AdminContributorApplication[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthoringLoading, setIsAuthoringLoading] = useState(false);
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
      setPayments(nextPayments);
      setCourses(nextCourses);
      setApplications(nextApplications);
      if (isAdmin) {
        setCoupons(await fetchAdminCoupons());
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
                {courses.find((course) => course.id === selectedCourseId)?.modules.map((module) => (
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
              <p className="text-sm text-muted-foreground mt-1">{coupon.discountPercent}% off {coupon.appliesToTiers.join(', ')}</p>
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
