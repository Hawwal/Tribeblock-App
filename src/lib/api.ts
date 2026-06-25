import {
  courses as fallbackCourses,
  getCourseBySlug as getFallbackCourseBySlug,
  learningPaths as fallbackLearningPaths,
  type Course,
} from '@/lib/courseData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

type BackendLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type BackendVisibility = 'FREE' | 'PREVIEW' | 'PLUS' | 'PRO';
type BackendTier = 'BASIC' | 'PLUS' | 'PRO';

type BackendCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: BackendLevel;
  visibility: BackendVisibility;
  isFreeBasic: boolean;
  hasProProject: boolean;
  estimatedHours: number;
  languageTags: string[];
  skillTags: string[];
  sourceRepositoryUrl?: string | null;
  sourcePath?: string | null;
  sourceProvider?: string | null;
  sourceSyncEnabled?: boolean;
  modules?: BackendModule[];
};

type BackendModule = {
  id: string;
  title: string;
  summary: string;
  sortOrder: number;
  lessons: BackendLesson[];
  projects: BackendProject[];
};

type BackendLesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  visibility: BackendVisibility;
  sortOrder: number;
  estimatedMinutes: number;
  exercises: BackendExercise[];
  quizzes: BackendQuiz[];
  assets: BackendAsset[];
};

type BackendProject = {
  id: string;
  slug: string;
  title: string;
  visibility: BackendVisibility;
};

type BackendAsset = {
  id: string;
  type: string;
  title: string;
  url: string;
  license?: string | null;
};

type BackendQuiz = {
  id: string;
  title: string;
  passingScore: number;
  questions?: Array<{
    id: string;
    prompt: string;
    options: unknown;
    correctAnswer: unknown;
    explanation?: string | null;
  }>;
};

type BackendExercise = {
  id: string;
  slug: string;
  title: string;
  instructions: string;
  runtime: string;
  starterFiles: Record<string, string>;
  visibility: BackendVisibility;
  tests?: Array<{
    id: string;
    name: string;
    assertion: string;
    isHidden: boolean;
  }>;
};

type BackendCareerPath = {
  id: string;
  slug: string;
  title: string;
  description: string;
  courses: Array<{
    course: Pick<BackendCourse, 'slug' | 'title' | 'level' | 'estimatedHours' | 'visibility' | 'isFreeBasic'>;
  }>;
};

export type ApiCourse = Course & {
  visibility?: BackendVisibility;
  isFreeBasic?: boolean;
  hasProProject?: boolean;
  sourceRepositoryUrl?: string | null;
  sourcePath?: string | null;
  sourceProvider?: string | null;
  sourceSyncEnabled?: boolean;
  modules?: BackendModule[];
};

export type ApiLearningPath = {
  id: string;
  title: string;
  description: string;
  courses: string[];
  duration: string;
  level: string;
};

export type ApiPlan = {
  id: string;
  name: string;
  tier: BackendTier;
  description: string;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
  features: string[];
};

export type ContributorApplicationInput = {
  fullName: string;
  email: string;
  githubUsername: string;
  walletAddress: string;
  country: string;
  discordUsername?: string;
  twitterHandle?: string;
  skills: string[];
  interests: string[];
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  portfolioUrl?: string;
  agreementReviewed: boolean;
  agreementRewards: boolean;
};

export type ContributorApplication = ContributorApplicationInput & {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
};

export type ContributorRewardsDashboard = {
  contributor: {
    id: string;
    fullName: string;
    githubUsername: string;
    walletAddress: string;
    status: string;
  } | null;
  contributions: Array<{
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
  }>;
  rewards: Array<{
    id: string;
    amountGd: string;
    status: string;
    walletAddress: string;
    tokenSymbol: string;
    tokenAddress?: string | null;
    chainId?: number | null;
    transactionHash?: string | null;
    notes?: string | null;
    createdAt: string;
  }>;
  totals: {
    approvedContributions: number;
    pendingContributions: number;
    totalRewardsGd: string;
    paidRewardsGd: string;
    pendingRewardsGd: string;
  };
  goodDollar: {
    tokenSymbol: string;
    tokenAddress?: string | null;
    chainId: number;
    distributionMode: string;
  };
};

export async function fetchCourses(): Promise<ApiCourse[]> {
  const backendCourses = await request<BackendCourse[]>('/api/courses');
  return backendCourses.map(normalizeCourse);
}

export async function fetchCourse(slug: string): Promise<ApiCourse | undefined> {
  const backendCourse = await request<BackendCourse>(`/api/courses/${slug}`);
  return normalizeCourse(backendCourse);
}

export async function fetchCareerPaths(): Promise<ApiLearningPath[]> {
  const paths = await request<BackendCareerPath[]>('/api/courses/career-paths');
  return paths.map((path) => {
    const totalHours = path.courses.reduce((total, item) => total + item.course.estimatedHours, 0);
    const levels = new Set(path.courses.map((item) => toTitleCase(item.course.level)));

    return {
      id: path.slug,
      title: path.title,
      description: path.description,
      courses: path.courses.map((item) => item.course.slug),
      duration: `${totalHours} hours`,
      level: Array.from(levels).join(' to ') || 'Beginner',
    };
  });
}

export async function fetchPlans(): Promise<ApiPlan[]> {
  return request<ApiPlan[]>('/api/subscriptions/plans');
}

export async function submitContributorApplication(input: ContributorApplicationInput) {
  return request<ContributorApplication>('/api/contributors/applications', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchContributorRewards(input: { githubUsername?: string; walletAddress?: string }) {
  const params = new URLSearchParams();
  if (input.githubUsername) params.set('githubUsername', input.githubUsername);
  if (input.walletAddress) params.set('walletAddress', input.walletAddress);

  return request<ContributorRewardsDashboard>(`/api/contributors/rewards?${params.toString()}`);
}

export async function loadCoursesWithFallback(): Promise<ApiCourse[]> {
  try {
    return await fetchCourses();
  } catch {
    return fallbackCourses;
  }
}

export async function loadCourseWithFallback(slug: string): Promise<ApiCourse | undefined> {
  try {
    return await fetchCourse(slug);
  } catch {
    return getFallbackCourseBySlug(slug);
  }
}

export async function loadCareerPathsWithFallback(): Promise<ApiLearningPath[]> {
  try {
    return await fetchCareerPaths();
  } catch {
    return fallbackLearningPaths;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeCourse(course: BackendCourse): ApiCourse {
  const lessonCount =
    course.modules?.reduce((total, module) => total + module.lessons.length, 0) ??
    Math.max(2, Math.round(course.estimatedHours * 2));
  const projectCount = course.modules?.reduce((total, module) => total + module.projects.length, 0) ?? 1;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description || course.subtitle || '',
    category: toCategoryLabel(course.category),
    categorySlug: course.category,
    level: toTitleCase(course.level) as Course['level'],
    duration: `${course.estimatedHours} hours`,
    lessons: lessonCount,
    projects: projectCount,
    rating: 4.8,
    reviews: 0,
    students: 0,
    instructor: 'Tribe Block University',
    image: `/images/courses/${course.slug}.jpg`,
    tags: course.languageTags,
    topics: [...course.languageTags, ...course.skillTags].slice(0, 6),
    featured: course.isFreeBasic || course.visibility === 'PRO',
    visibility: course.visibility,
    isFreeBasic: course.isFreeBasic,
    hasProProject: course.hasProProject,
    sourceRepositoryUrl: course.sourceRepositoryUrl,
    sourcePath: course.sourcePath,
    sourceProvider: course.sourceProvider,
    sourceSyncEnabled: course.sourceSyncEnabled,
    modules: course.modules,
  };
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    frontend: 'Frontend Development',
    backend: 'Backend Development',
    blockchain: 'Blockchain & Web3',
    data: 'Data Science & AI',
    devops: 'DevOps & Cloud',
  };

  return labels[value] ?? toTitleCase(value);
}
