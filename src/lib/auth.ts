const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const SESSION_STORAGE_KEY = 'tribeblock_session';
export const AUTH_SESSION_EVENT = 'tribeblock-auth-session';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  role: string;
  preferredCurrency: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isPublicProfile?: boolean;
};

export type AuthSession = {
  user: AuthUser;
  authHeader: {
    name: string;
    value: string;
  };
};

type AuthResponse = {
  user: AuthUser;
  session: {
    header: string;
    value: string;
  };
};

type OAuthStartResponse = {
  configured: boolean;
  provider: 'google' | 'github';
  authorizationUrl?: string;
  message?: string;
};

export type CurrentSubscription = {
  id: string;
  tier: string;
  interval: string;
  status: string;
  plan: {
    name: string;
    description: string;
  };
  payments?: Array<{
    id: string;
    currency: string;
    amount: string;
    status: string;
    reference: string;
  }>;
} | null;

export type PaymentIntent = {
  id: string;
  provider: 'CELO_USDT' | 'LOCAL_BANK';
  rail: 'CELO' | 'LOCAL_BANK';
  currency: 'USD' | 'NGN' | 'KES' | 'GHS';
  amount: string;
  status: string;
  reference: string;
  blockchainChainId?: number | null;
  blockchainToken?: string | null;
  blockchainTokenSymbol?: string | null;
  blockchainDecimals?: number | null;
  receiverAddress?: string | null;
  transactionHash?: string | null;
  providerMetadata?: {
    amountUnits?: string;
    rpcUrl?: string;
    instruction?: string;
    paymentMode?: 'DIRECT_TRANSFER' | 'CONTRACT_PAYMENT';
    paymentContractAddress?: string;
    treasuryAddress?: string;
    contractMethod?: string;
    usdAmount?: string;
    couponCode?: string;
    discountPercent?: number;
    originalAmountUsd?: string;
    discountedAmountUsd?: string;
    estimatedExchangeRate?: number;
    provider?: string;
    confirmationNote?: string;
    verificationNote?: string;
    verifiedAt?: string;
    onChainProof?: {
      mode?: 'DIRECT_TRANSFER' | 'CONTRACT_PAYMENT';
      payer?: string;
      from?: string;
      to?: string | null;
      receiverAddress?: string;
      contractAddress?: string;
      tokenAddress?: string;
      amountUnits?: string;
      paymentReference?: string;
      blockNumber?: string;
      gasUsed?: string;
      effectiveGasPrice?: string;
      transactionHash?: string;
    };
  } | null;
  expiresAt?: string | null;
};

export type AdminPayment = PaymentIntent & {
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    role: string;
  };
  subscription?: (NonNullable<CurrentSubscription> & {
    plan: NonNullable<CurrentSubscription>['plan'] & {
      tier?: string;
    };
  }) | null;
};

export type AdminCourseReviewItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  status: string;
  visibility: string;
  sourceRepositoryUrl?: string | null;
  sourcePath?: string | null;
  updatedAt: string;
  createdAt: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
    role: string;
  } | null;
  reviews: Array<{
    id: string;
    status: string;
    notes?: string | null;
    createdAt: string;
    reviewer?: {
      displayName: string;
      role: string;
    } | null;
  }>;
};

export type AdminContributorContribution = {
  id: string;
  githubUsername: string;
  repositoryUrl: string;
  pullRequestUrl?: string | null;
  commitSha?: string | null;
  title: string;
  contributionType: string;
  status: string;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminContributorReward = {
  id: string;
  contributorId: string;
  contributionId?: string | null;
  amountGd: string;
  status: string;
  walletAddress: string;
  tokenSymbol: string;
  tokenAddress?: string | null;
  chainId?: number | null;
  transactionHash?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  contribution?: AdminContributorContribution | null;
};

export type AdminContributorApplication = {
  id: string;
  fullName: string;
  email: string;
  githubUsername: string;
  walletAddress: string;
  country: string;
  skills: string[];
  interests: string[];
  experienceLevel: string;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  contributions?: AdminContributorContribution[];
  rewards?: AdminContributorReward[];
};

export type AdminGoodDollarConfig = {
  tokenSymbol: 'G$';
  tokenAddress?: string | null;
  vaultAddress?: string | null;
  chainId: number;
  decimals: number;
  distributionMode: string;
};

export type AdminOverview = {
  totals: {
    users: number;
    activeSubscriptions: number;
    pendingContributorApplications: number;
    pendingRewards: number;
    courses: Record<string, number>;
    payments: Record<string, number>;
  };
  recentPayments: AdminPayment[];
};

export type AdminCoupon = {
  id: string;
  code: string;
  description?: string | null;
  discountPercent: number;
  appliesToTiers: Array<'BASIC' | 'PLUS' | 'PRO'>;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  redemptionCount: number;
  createdAt: string;
};

export type CouponPreview = {
  code: string;
  discountPercent: number;
  originalAmount: string;
  discountedAmount: string;
  savingsAmount: string;
};

export type AdminAuthoringCourse = AdminCourseReviewItem & {
  modules: Array<{
    id: string;
    title: string;
    summary: string;
    sortOrder: number;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      visibility: string;
      sortOrder: number;
      exercises: Array<{
        id: string;
        slug: string;
        title: string;
        runtime: string;
        visibility: string;
        tests: Array<{
          id: string;
          name: string;
          assertion: string;
          isHidden: boolean;
        }>;
      }>;
    }>;
  }>;
};

export type CourseAuthoringInput = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  visibility: 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
  isFreeBasic: boolean;
  estimatedHours: number;
  languageTags: string[];
  skillTags: string[];
};

export type ModuleAuthoringInput = {
  title: string;
  summary: string;
};

export type LessonAuthoringInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  visibility: 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
  estimatedMinutes: number;
};

export type ExerciseAuthoringInput = {
  title: string;
  instructions: string;
  runtime: 'BROWSER_HTML_CSS_JS' | 'NODE' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'CPP' | 'BASH' | 'SQL' | 'SOLIDITY';
  starterFiles: Record<string, string>;
  solutionFiles?: Record<string, string>;
  visibility: 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
  tests: Array<{
    name: string;
    command?: string;
    assertion: string;
    isHidden?: boolean;
  }>;
};

export type CheckoutResponse = {
  subscription: NonNullable<CurrentSubscription>;
  paymentIntent: PaymentIntent | null;
  coupon?: CouponPreview | null;
};

export type EnrollmentSummary = {
  id: string;
  status: string;
  completionPercent: number;
  startedAt: string;
  completedAt?: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
  };
};

export type CodeDraft = {
  id: string;
  exerciseId: string;
  files: Record<string, string>;
  updatedAt: string;
} | null;

export type CourseAccessReport = {
  subscriptionTier: 'BASIC' | 'PLUS' | 'PRO';
  course: {
    id: string;
    slug: string;
    title: string;
    visibility: string;
    allowed: boolean;
    requiredTier: 'BASIC' | 'PLUS' | 'PRO';
  };
  lessons: Array<{
    id: string;
    title: string;
    visibility: string;
    allowed: boolean;
    requiredTier: 'BASIC' | 'PLUS' | 'PRO';
  }>;
  projects: Array<{
    id: string;
    title: string;
    visibility: string;
    allowed: boolean;
    requiredTier: 'BASIC' | 'PLUS' | 'PRO';
  }>;
};

export type CertificateRecord = {
  id: string;
  courseId: string;
  status: string;
  certificateNumber: string;
  metadataUri?: string | null;
  nftChainId?: number | null;
  nftContract?: string | null;
  nftTokenId?: string | null;
  transactionHash?: string | null;
  verificationUrl?: string | null;
  issuedAt?: string | null;
  course: {
    id?: string;
    slug: string;
    title: string;
  };
};

export type PublicCertificateVerification = CertificateRecord & {
  user: {
    displayName: string;
    handle: string;
  };
  course: {
    slug: string;
    title: string;
  };
};

export async function registerWithEmail(input: {
  displayName: string;
  email: string;
  password: string;
}) {
  const response = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return saveSessionFromAuthResponse(response);
}

export async function loginWithEmail(input: { email: string; password: string }) {
  const response = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return saveSessionFromAuthResponse(response);
}

export async function startOAuth(provider: 'google' | 'github') {
  return request<OAuthStartResponse>(`/api/auth/oauth/${provider}/start`);
}

export async function fetchCurrentUser() {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  const user = await request<AuthUser>('/api/users/me', {
    headers: sessionHeaders(session),
  });

  saveSession({ ...session, user });
  return user;
}

export async function updatePreferredCurrency(currency: string) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  const result = await request<{ id: string; preferredCurrency: string }>('/api/users/me/currency', {
    method: 'PATCH',
    headers: sessionHeaders(session),
    body: JSON.stringify({ currency }),
  });

  saveSession({
    ...session,
    user: {
      ...session.user,
      preferredCurrency: result.preferredCurrency,
    },
  });

  return result;
}

export async function fetchCurrentSubscription() {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CurrentSubscription>('/api/subscriptions/me', {
    headers: sessionHeaders(session),
  });
}

export async function fetchMyProgress() {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<EnrollmentSummary[]>('/api/progress/me', {
    headers: sessionHeaders(session),
  });
}

export async function enrollInCourse(courseId: string) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<EnrollmentSummary>('/api/progress/enrollments', {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify({ courseId }),
  });
}

export async function startSubscriptionCheckout(input: {
  planId: string;
  interval: 'MONTHLY' | 'YEARLY';
  currency: 'USD' | 'NGN' | 'KES' | 'GHS';
  couponCode?: string;
}) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CheckoutResponse>('/api/subscriptions/checkout', {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function previewSubscriptionCoupon(input: {
  planId: string;
  interval: 'MONTHLY' | 'YEARLY';
  couponCode: string;
}) {
  return request<CouponPreview>('/api/subscriptions/coupons/preview', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchPaymentIntent(reference: string) {
  return request<PaymentIntent>(`/api/payments/${reference}`);
}

export async function confirmCeloTransaction(reference: string, transactionHash: string) {
  return request<PaymentIntent>(`/api/payments/${reference}/celo-confirmation`, {
    method: 'PATCH',
    body: JSON.stringify({ transactionHash }),
  });
}

export async function verifyPaymentIntent(reference: string, status: 'CONFIRMED' | 'FAILED', note?: string) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<PaymentIntent>(`/api/payments/${reference}/verification`, {
    method: 'PATCH',
    headers: sessionHeaders(session),
    body: JSON.stringify({ status, note }),
  });
}

export async function fetchAdminOverview() {
  const session = requireSession();

  return request<AdminOverview>('/api/admin/overview', {
    headers: sessionHeaders(session),
  });
}

export async function fetchAdminPayments(status?: string) {
  const session = requireSession();
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return request<AdminPayment[]>(`/api/admin/payments${query}`, {
    headers: sessionHeaders(session),
  });
}

export async function fetchAdminCourseReviewQueue(status?: string) {
  const session = requireSession();
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return request<AdminCourseReviewItem[]>(`/api/admin/courses/review-queue${query}`, {
    headers: sessionHeaders(session),
  });
}

export async function reviewAdminCourse(courseId: string, status: string, notes?: string) {
  const session = requireSession();

  return request(`/api/admin/courses/${courseId}/reviews`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify({ status, notes }),
  });
}

export async function publishAdminCourse(courseId: string) {
  const session = requireSession();

  return request<AdminCourseReviewItem>(`/api/admin/courses/${courseId}/publish`, {
    method: 'PATCH',
    headers: sessionHeaders(session),
  });
}

export async function fetchAdminContributorApplications(status?: string) {
  const session = requireSession();
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return request<AdminContributorApplication[]>(`/api/admin/contributor-applications${query}`, {
    headers: sessionHeaders(session),
  });
}

export async function reviewAdminContributorApplication(applicationId: string, status: string, adminNotes?: string) {
  const session = requireSession();

  return request<AdminContributorApplication>(`/api/admin/contributor-applications/${applicationId}`, {
    method: 'PATCH',
    headers: sessionHeaders(session),
    body: JSON.stringify({ status, adminNotes }),
  });
}

export async function fetchAdminGoodDollarConfig() {
  const session = requireSession();

  return request<AdminGoodDollarConfig>('/api/admin/gooddollar/config', {
    headers: sessionHeaders(session),
  });
}

export async function syncAdminGithubContribution(input: {
  githubUsername: string;
  repositoryUrl: string;
  pullRequestUrl?: string;
  commitSha?: string;
  title: string;
  contributionType: string;
  status?: 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REWARDED';
}) {
  const session = requireSession();

  return request<AdminContributorContribution>('/api/admin/github-contributions/sync', {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function createAdminContributorReward(applicationId: string, input: {
  contributionId?: string;
  amountGd: string;
  title?: string;
  contributionType?: string;
  repositoryUrl?: string;
  pullRequestUrl?: string;
  notes?: string;
}) {
  const session = requireSession();

  return request<AdminContributorReward>(`/api/admin/contributor-applications/${applicationId}/rewards`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function fetchAdminCoupons() {
  const session = requireSession();

  return request<AdminCoupon[]>('/api/admin/coupons', {
    headers: sessionHeaders(session),
  });
}

export async function createAdminCoupon(input: {
  code: string;
  description?: string;
  discountPercent: number;
  appliesToTiers: Array<'BASIC' | 'PLUS' | 'PRO'>;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number;
}) {
  const session = requireSession();

  return request<AdminCoupon>('/api/admin/coupons', {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function fetchAdminAuthoringCourses() {
  const session = requireSession();

  return request<AdminAuthoringCourse[]>('/api/admin/authoring/courses', {
    headers: sessionHeaders(session),
  });
}

export async function createAdminCourse(input: CourseAuthoringInput) {
  const session = requireSession();

  return request<AdminAuthoringCourse>('/api/admin/authoring/courses', {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function createAdminModule(courseId: string, input: ModuleAuthoringInput) {
  const session = requireSession();

  return request(`/api/admin/authoring/courses/${courseId}/modules`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function createAdminLesson(moduleId: string, input: LessonAuthoringInput) {
  const session = requireSession();

  return request(`/api/admin/authoring/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function createAdminExercise(lessonId: string, input: ExerciseAuthoringInput) {
  const session = requireSession();

  return request(`/api/admin/authoring/lessons/${lessonId}/exercises`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify(input),
  });
}

export async function fetchExerciseDraft(exerciseId: string) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CodeDraft>(`/api/ide/exercises/${exerciseId}/draft`, {
    headers: sessionHeaders(session),
  });
}

export async function saveExerciseDraft(exerciseId: string, files: Record<string, string>) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CodeDraft>(`/api/ide/exercises/${exerciseId}/draft`, {
    method: 'PATCH',
    headers: sessionHeaders(session),
    body: JSON.stringify({ files }),
  });
}

export async function submitExerciseAttempt(exerciseId: string, files: Record<string, string>) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request(`/api/ide/exercises/${exerciseId}/attempts`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify({ files }),
  });
}

export async function updateLessonProgress(lessonId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request(`/api/progress/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: sessionHeaders(session),
    body: JSON.stringify({ status }),
  });
}

export async function fetchCourseAccess(courseId: string) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CourseAccessReport>(`/api/access/courses/${courseId}`, {
    headers: sessionHeaders(session),
  });
}

export async function fetchMyCertificates() {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CertificateRecord[]>('/api/certificates/me', {
    headers: sessionHeaders(session),
  });
}

export async function fetchCertificateVerification(certificateNumber: string) {
  return request<PublicCertificateVerification>(`/api/certificates/verify/${certificateNumber}`);
}

export async function requestCourseCertificate(courseId: string, walletAddress?: string) {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return request<CertificateRecord>(`/api/certificates/courses/${courseId}/request`, {
    method: 'POST',
    headers: sessionHeaders(session),
    body: JSON.stringify({ walletAddress }),
  });
}

export function getSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function requireSession() {
  const session = getSession();

  if (!session) {
    throw new Error('You need to sign in first.');
  }

  return session;
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: session }));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: null }));
}

export function sessionHeaders(session = getSession()): HeadersInit {
  if (!session) return {};

  return {
    [session.authHeader.name]: session.authHeader.value,
  };
}

function saveSessionFromAuthResponse(response: AuthResponse) {
  const session: AuthSession = {
    user: response.user,
    authHeader: {
      name: response.session.header,
      value: response.session.value,
    },
  };

  saveSession(session);
  return session;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();

    if (Array.isArray(body.message)) {
      return body.message.join(' ');
    }

    return body.message || body.error;
  } catch {
    return response.statusText;
  }
}

export type AdminCoupon = {
  id: string;
  code: string;
  description?: string | null;
  discountPercent: number;
  appliesToTiers: Array<'BASIC' | 'PLUS' | 'PRO'>;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  redemptionCount: number;
  createdAt: string;
};

export type CouponPreview = {
  code: string;
  discountPercent: number;
  originalAmount: string;
  discountedAmount: string;
  savingsAmount: string;
};

export type AdminAuthoringCourse = AdminCourseReviewItem & {
  modules: Array<{
    id: string;
    title: string;
    summary: string;
    sortOrder: number;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      visibility: string;
      sortOrder: number;
      exercises: Array<{
        id: string;
        slug: string;
        title: string;
        runtime: string;
        visibility: string;
        tests: Array<{
          id: string;
          name: string;
          assertion: string;
          isHidden: boolean;
        }>;
      }>;
    }>;
  }>;
};

export type CourseAuthoringInput = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  visibility: 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
  isFreeBasic: boolean;
  estimatedHours: number;
  languageTags: string[];
  skillTags: string[];
};

export type ModuleAuthoringInput = {
  title: string;
  summary: string;
};

export type LessonAuthoringInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  visibility: 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
  estimatedMinutes: number;
};

export type ExerciseAuthoringInput = {
  title: string;
  instructions: string;
  runtime: 'BROWSER_HTML_CSS_JS' | 'NODE' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'CPP' | 'BASH' | 'SQL' | 'SOLIDITY';
  starterFiles: Record<string, string>;
  solutionFiles?: Record<string, string>;
  visibility: 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
  tests: Array<{
    name: string;
    command?: string;
    assertion: string;
    isHidden?: boolean;
  }>;
};

export type CheckoutResponse = {
  subscription: NonNullable<CurrentSubscription>;
  paymentIntent: PaymentIntent | null;
  coupon?: CouponPreview | null;
};

export type EnrollmentSummary = {
  id: string;
  status: string;
  completionPercent: number;
  startedAt: string;
  completedAt?: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
  };
};

export type CodeDraft = {
  id: string;
  exerciseId: string;
  files: Record<string, string>;
  updatedAt: string;
} | null;

export type CourseAccessReport = {
  subscriptionTier: 'BASIC' | 'PLUS' | 'PRO';
  course: {
    id: string;
    slug: string;
    title: string;
    visibility: string;
    allowed: boolean;
    requiredTier: 'BASIC' | 'PLUS' | 'PRO';
  };
  lessons: Array<{
    id: string;
    title: string;
    visibility: string;
    allowed: boolean;
    requiredTier: 'BASIC' | 'PLUS' | 'PRO';
  }>;
  projects: Array<{
    id: string;
    title: string;
    visibility: string;
    allowed: boolean;
    requiredTier: 'BASIC' | 'PLUS' | 'PRO';
  }>;
};

export type CertificateRecord = {
  id: string;
  courseId: string;
  status: string;
  certificateNumber: string;
  metadataUri?: string | null;
  nftChainId?: number | null;
  nftContract?: string | null;
  nftTokenId?: string | null;
  transactionHash?: string | null;
  verificationUrl?: string | null;
  issuedAt?: string | null;
  course: {
    id?: string;
    slug: string;
    title: string;
  };
};

export type PublicCertificateVerification = CertificateRecord & {
  user: {
    displayName: string;
    handle: string;
  };
  course: {
    slug: string;
    title: string;
  };
};
