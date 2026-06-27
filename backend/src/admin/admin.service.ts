import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  ContentVisibility,
  ContributorApplicationStatus,
  ContributorContributionStatus,
  ContributorRewardStatus,
  CourseLevel,
  CourseStatus,
  ExerciseRuntime,
  PaymentStatus,
  SubscriptionTier,
  UserRole,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CourseSyncService } from '../courses/course-sync.service';
import { GithubOrgService } from './github-org.service';

type ReviewInput = {
  status: CourseStatus;
  notes?: string;
};

type ContributorReviewInput = {
  status: ContributorApplicationStatus;
  adminNotes?: string;
};

type ContributorRewardInput = {
  contributionId?: string;
  amountGd: string;
  title?: string;
  contributionType?: string;
  repositoryUrl?: string;
  pullRequestUrl?: string;
  notes?: string;
};

type GithubContributionSyncInput = {
  githubUsername: string;
  repositoryUrl: string;
  pullRequestUrl?: string;
  commitSha?: string;
  title: string;
  contributionType: string;
  status?: ContributorContributionStatus;
};

type GithubCourseSyncInput = {
  fullName: string;
  ref?: string;
  repositoryUrl?: string;
};

type GithubRepoTeamAccessInput = {
  fullName: string;
};

type CouponInput = {
  code: string;
  description?: string;
  discountPercent: number;
  appliesToTiers: SubscriptionTier[];
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number;
};

type CourseAuthoringInput = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: CourseLevel;
  visibility: ContentVisibility;
  isFreeBasic?: boolean;
  estimatedHours: number;
  languageTags: string[];
  skillTags: string[];
};

type ModuleAuthoringInput = {
  title: string;
  summary: string;
  sortOrder?: number;
};

type LessonAuthoringInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  visibility: ContentVisibility;
  estimatedMinutes: number;
  sortOrder?: number;
};

type ExerciseAuthoringInput = {
  title: string;
  instructions: string;
  runtime: ExerciseRuntime;
  starterFiles: Record<string, string>;
  solutionFiles?: Record<string, string>;
  visibility: ContentVisibility;
  sortOrder?: number;
  tests?: Array<{
    name: string;
    command?: string;
    assertion: string;
    isHidden?: boolean;
  }>;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly courseSync: CourseSyncService,
    private readonly githubOrg: GithubOrgService,
  ) {}

  async overview(userId: string) {
    await this.assertAdminOrReviewer(userId);

    const [
      totalUsers,
      activeSubscriptions,
      courseStatusCounts,
      paymentStatusCounts,
      pendingContributorApplications,
      pendingRewards,
      recentPayments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.paymentIntent.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.contributorApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.contributorReward.count({ where: { status: { in: ['PENDING', 'READY'] } } }),
      this.listPayments(userId, undefined, 5),
    ]);

    return {
      totals: {
        users: totalUsers,
        activeSubscriptions,
        pendingContributorApplications,
        pendingRewards,
        courses: this.toCountMap(courseStatusCounts, 'status'),
        payments: this.toCountMap(paymentStatusCounts, 'status'),
      },
      recentPayments,
    };
  }

  async listPayments(userId: string, status?: PaymentStatus, take = 25) {
    await this.assertAdminOrReviewer(userId);

    return this.prisma.paymentIntent.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { id: true, displayName: true, email: true, role: true } },
        subscription: { include: { plan: true } },
      },
    });
  }

  async listCoursesForReview(userId: string, status?: CourseStatus) {
    await this.assertAdminOrReviewer(userId);

    return this.prisma.course.findMany({
      where: status ? { status } : { status: { in: ['DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUESTED'] } },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, displayName: true, email: true, role: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { reviewer: { select: { displayName: true, role: true } } },
        },
      },
    });
  }

  async listAuthoringCourses(userId: string) {
    const user = await this.assertAuthor(userId);

    return this.prisma.course.findMany({
      where: user.role === UserRole.ADMIN ? { status: { not: CourseStatus.ARCHIVED } } : { authorId: userId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, displayName: true, email: true, role: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              include: { exercises: { orderBy: { sortOrder: 'asc' }, include: { tests: { orderBy: { sortOrder: 'asc' } } } } },
            },
            projects: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
  }

  async createCourse(authorId: string, input: CourseAuthoringInput) {
    await this.assertAuthor(authorId);
    const slug = await this.uniqueCourseSlug(input.title);

    return this.prisma.course.create({
      data: {
        title: input.title,
        slug,
        subtitle: input.subtitle,
        description: input.description,
        category: input.category,
        level: input.level,
        visibility: input.visibility,
        isFreeBasic: input.isFreeBasic ?? false,
        hasProProject: true,
        estimatedHours: input.estimatedHours,
        languageTags: input.languageTags,
        skillTags: input.skillTags,
        authorId,
        status: CourseStatus.UNDER_REVIEW,
        sourceRepositoryUrl: 'https://github.com/Tribe-Block-University',
        sourcePath: `${slug}/README.md`,
        sourceProvider: 'admin-authoring',
        sourceSyncEnabled: false,
      },
      include: { author: { select: { id: true, displayName: true, email: true, role: true } }, modules: true },
    });
  }

  async createModule(userId: string, courseId: string, input: ModuleAuthoringInput) {
    await this.assertCanEditCourse(userId, courseId);
    const sortOrder = input.sortOrder ?? (await this.nextModuleSortOrder(courseId));

    return this.prisma.courseModule.create({
      data: {
        courseId,
        title: input.title,
        summary: input.summary,
        sortOrder,
      },
    });
  }

  async createLesson(userId: string, moduleId: string, input: LessonAuthoringInput) {
    const module = await this.prisma.courseModule.findUniqueOrThrow({
      where: { id: moduleId },
      select: { courseId: true },
    });
    await this.assertCanEditCourse(userId, module.courseId);
    const sortOrder = input.sortOrder ?? (await this.nextLessonSortOrder(moduleId));
    const slug = await this.uniqueLessonSlug(moduleId, input.title);

    return this.prisma.lesson.create({
      data: {
        moduleId,
        slug,
        title: input.title,
        summary: input.summary,
        bodyMarkdown: input.bodyMarkdown,
        visibility: input.visibility,
        estimatedMinutes: input.estimatedMinutes,
        sortOrder,
      },
    });
  }

  async createExercise(userId: string, lessonId: string, input: ExerciseAuthoringInput) {
    const lesson = await this.prisma.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      select: { module: { select: { courseId: true } } },
    });
    await this.assertCanEditCourse(userId, lesson.module.courseId);
    const sortOrder = input.sortOrder ?? (await this.nextExerciseSortOrder(lessonId));
    const slug = await this.uniqueExerciseSlug(lessonId, input.title);

    return this.prisma.codingExercise.create({
      data: {
        lessonId,
        slug,
        title: input.title,
        instructions: input.instructions,
        runtime: input.runtime,
        starterFiles: input.starterFiles,
        solutionFiles: input.solutionFiles,
        visibility: input.visibility,
        sortOrder,
        tests: input.tests?.length
          ? {
              create: input.tests.map((test, index) => ({
                name: test.name,
                command: test.command,
                assertion: test.assertion,
                isHidden: test.isHidden ?? false,
                sortOrder: index + 1,
              })),
            }
          : undefined,
      },
      include: { tests: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async reviewCourse(reviewerId: string, courseId: string, input: ReviewInput) {
    if (input.status === CourseStatus.PUBLISHED) {
      await this.assertAdmin(reviewerId);
    } else {
      await this.assertAdminOrReviewer(reviewerId);
    }

    const review = await this.prisma.courseReview.create({
      data: {
        courseId,
        reviewerId,
        status: input.status,
        notes: input.notes,
      },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { status: input.status },
    });

    return review;
  }

  async publishCourse(adminUserId: string, courseId: string) {
    await this.assertAdmin(adminUserId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  async listContributorApplications(userId: string, status?: ContributorApplicationStatus) {
    await this.assertAdminOrReviewer(userId);

    return this.prisma.contributorApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        contributions: { orderBy: { createdAt: 'desc' }, take: 8 },
        rewards: { orderBy: { createdAt: 'desc' }, take: 8, include: { contribution: true } },
      },
    });
  }

  async reviewContributorApplication(userId: string, applicationId: string, input: ContributorReviewInput) {
    await this.assertAdminOrReviewer(userId);

    const application = await this.prisma.contributorApplication.update({
      where: { id: applicationId },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
      },
    });

    if (input.status !== ContributorApplicationStatus.APPROVED) {
      return application;
    }

    try {
      const result = await this.githubOrg.addContributorToTeam(application.githubUsername);
      return this.prisma.contributorApplication.update({
        where: { id: applicationId },
        data: {
          adminNotes: this.appendNote(application.adminNotes ?? undefined, `GitHub automation: ${result.message}`),
        },
      });
    } catch (error) {
      return this.prisma.contributorApplication.update({
        where: { id: applicationId },
        data: {
          adminNotes: this.appendNote(
            application.adminNotes ?? undefined,
            `GitHub automation failed: ${error instanceof Error ? error.message : 'Unable to add contributor to GitHub team.'}`,
          ),
        },
      });
    }
  }

  async syncGithubContribution(userId: string, input: GithubContributionSyncInput) {
    await this.assertAdminOrReviewer(userId);

    const githubUsername = this.normalizeGithubUsername(input.githubUsername);
    const contributor = await this.prisma.contributorApplication.findFirst({
      where: { githubUsername },
      orderBy: { createdAt: 'desc' },
    });
    const status = input.status ?? ContributorContributionStatus.APPROVED;
    const approvedAt = status === ContributorContributionStatus.APPROVED || status === ContributorContributionStatus.REWARDED ? new Date() : undefined;

    const existing = input.pullRequestUrl
      ? await this.prisma.contributorContribution.findFirst({ where: { pullRequestUrl: input.pullRequestUrl.trim() } })
      : null;

    const data = {
      contributorId: contributor?.id,
      githubUsername,
      repositoryUrl: input.repositoryUrl.trim(),
      pullRequestUrl: this.optionalTrim(input.pullRequestUrl),
      commitSha: this.optionalTrim(input.commitSha),
      title: input.title.trim(),
      contributionType: input.contributionType.trim(),
      status,
      approvedAt,
    };

    return existing
      ? this.prisma.contributorContribution.update({ where: { id: existing.id }, data, include: { contributor: true, rewards: true } })
      : this.prisma.contributorContribution.create({ data, include: { contributor: true, rewards: true } });
  }

  async syncGithubCourseRepository(userId: string, input: GithubCourseSyncInput) {
    await this.assertAdmin(userId);

    return this.courseSync.syncRepository({
      fullName: input.fullName.trim(),
      ref: this.optionalTrim(input.ref),
      repositoryUrl: this.optionalTrim(input.repositoryUrl),
    });
  }

  async applyGithubRepoTeamAccess(userId: string, input: GithubRepoTeamAccessInput) {
    await this.assertAdmin(userId);

    return this.githubOrg.applyCourseRepoTeamAccess({
      fullName: input.fullName,
    });
  }

  async createContributorReward(userId: string, applicationId: string, input: ContributorRewardInput) {
    await this.assertAdmin(userId);

    const amountGd = this.normalizeRewardAmount(input.amountGd);
    const contributor = await this.prisma.contributorApplication.findUniqueOrThrow({ where: { id: applicationId } });

    if (contributor.status !== ContributorApplicationStatus.APPROVED) {
      throw new BadRequestException('Approve this contributor before creating a G$ reward.');
    }

    const contribution = input.contributionId
      ? await this.prisma.contributorContribution.update({
          where: { id: input.contributionId },
          data: {
            contributorId: contributor.id,
            status: ContributorContributionStatus.APPROVED,
            approvedAt: new Date(),
          },
        })
      : await this.prisma.contributorContribution.create({
          data: {
            contributorId: contributor.id,
            githubUsername: contributor.githubUsername,
            repositoryUrl: input.repositoryUrl?.trim() || 'https://github.com/Tribe-Block-University',
            pullRequestUrl: this.optionalTrim(input.pullRequestUrl),
            title: input.title?.trim() || 'Approved TribeBlock contribution',
            contributionType: input.contributionType?.trim() || 'Platform improvement',
            status: ContributorContributionStatus.APPROVED,
            approvedAt: new Date(),
          },
        });

    return this.prisma.contributorReward.create({
      data: {
        contributorId: contributor.id,
        contributionId: contribution.id,
        amountGd,
        status: ContributorRewardStatus.READY,
        walletAddress: contributor.walletAddress,
        tokenAddress: this.config.get<string>('GOODDOLLAR_TOKEN_ADDRESS'),
        chainId: this.config.get<number>('GOODDOLLAR_CHAIN_ID') ?? 42220,
        notes: this.appendNote(input.notes, 'Created from admin dashboard. Prepare this reward in the G$ vault before contributor claim.'),
      },
      include: { contribution: true, contributor: true },
    });
  }

  async goodDollarConfig(userId: string) {
    await this.assertAdminOrReviewer(userId);

    return {
      tokenSymbol: 'G$',
      tokenAddress: this.config.get<string>('GOODDOLLAR_TOKEN_ADDRESS') ?? null,
      vaultAddress: this.config.get<string>('GOODDOLLAR_REWARDS_VAULT_ADDRESS') ?? null,
      chainId: this.config.get<number>('GOODDOLLAR_CHAIN_ID') ?? 42220,
      decimals: this.config.get<number>('GOODDOLLAR_DECIMALS') ?? 18,
      distributionMode: 'vault claim',
    };
  }

  async listCoupons(userId: string) {
    await this.assertAdmin(userId);

    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { displayName: true, email: true } } },
    });
  }

  async createCoupon(userId: string, input: CouponInput) {
    await this.assertAdmin(userId);
    const code = input.code.trim().toUpperCase();

    return this.prisma.coupon.create({
      data: {
        code,
        description: input.description,
        discountPercent: input.discountPercent,
        appliesToTiers: input.appliesToTiers,
        isActive: input.isActive ?? true,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        maxRedemptions: input.maxRedemptions,
        createdById: userId,
      },
      include: { createdBy: { select: { displayName: true, email: true } } },
    });
  }

  private toCountMap<T extends { _count: Record<string, number> }>(items: T[], key: keyof T & string) {
    return items.reduce<Record<string, number>>((counts, item) => {
      counts[String(item[key])] = item._count[key] ?? 0;
      return counts;
    }, {});
  }

  private normalizeGithubUsername(value: string) {
    const username = value.trim().replace(/^@/, '');

    if (!username) {
      throw new BadRequestException('GitHub username is required.');
    }

    return username;
  }

  private normalizeRewardAmount(value: string) {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Reward amount must be greater than zero.');
    }

    return amount.toFixed(2);
  }

  private optionalTrim(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private appendNote(existing: string | undefined, note: string) {
    return existing?.trim() ? existing.trim() + ' ' + note : note;
  }

  private async assertAdminOrReviewer(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MENTOR_REVIEWER)) {
      throw new ForbiddenException('Admin or mentor reviewer access is required.');
    }
  }

  private async assertAuthor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.INSTRUCTOR)) {
      throw new ForbiddenException('Admin or instructor access is required.');
    }

    return user;
  }

  private async assertCanEditCourse(userId: string, courseId: string) {
    const user = await this.assertAuthor(userId);
    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: { authorId: true, status: true },
    });

    if (course.status === CourseStatus.PUBLISHED && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Published courses can only be edited by admins.');
    }

    if (user.role !== UserRole.ADMIN && course.authorId !== userId) {
      throw new ForbiddenException('You can only edit courses you authored.');
    }
  }

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action.');
    }
  }

  private async uniqueCourseSlug(title: string) {
    return this.uniqueSlug(title, async (slug) => Boolean(await this.prisma.course.findUnique({ where: { slug } })));
  }

  private async uniqueLessonSlug(moduleId: string, title: string) {
    return this.uniqueSlug(title, async (slug) =>
      Boolean(await this.prisma.lesson.findUnique({ where: { moduleId_slug: { moduleId, slug } } })),
    );
  }

  private async uniqueExerciseSlug(lessonId: string, title: string) {
    return this.uniqueSlug(title, async (slug) =>
      Boolean(await this.prisma.codingExercise.findUnique({ where: { lessonId_slug: { lessonId, slug } } })),
    );
  }

  private async uniqueSlug(title: string, exists: (slug: string) => Promise<boolean>) {
    const root =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'untitled';
    let slug = root;
    let suffix = 1;

    while (await exists(slug)) {
      suffix += 1;
      slug = root + '-' + suffix;
    }

    return slug;
  }

  private async nextModuleSortOrder(courseId: string) {
    const result = await this.prisma.courseModule.aggregate({ where: { courseId }, _max: { sortOrder: true } });
    return (result._max.sortOrder ?? 0) + 1;
  }

  private async nextLessonSortOrder(moduleId: string) {
    const result = await this.prisma.lesson.aggregate({ where: { moduleId }, _max: { sortOrder: true } });
    return (result._max.sortOrder ?? 0) + 1;
  }

  private async nextExerciseSortOrder(lessonId: string) {
    const result = await this.prisma.codingExercise.aggregate({ where: { lessonId }, _max: { sortOrder: true } });
    return (result._max.sortOrder ?? 0) + 1;
  }
}
