import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentVisibility, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const tierRank: Record<SubscriptionTier, number> = {
  [SubscriptionTier.BASIC]: 0,
  [SubscriptionTier.PLUS]: 1,
  [SubscriptionTier.PRO]: 2,
};

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async courseAccessReport(userId: string, courseId: string) {
    const [tier, course] = await Promise.all([
      this.currentTier(userId),
      this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { sortOrder: 'asc' },
            include: {
              lessons: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, visibility: true } },
              projects: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, visibility: true } },
            },
          },
        },
      }),
    ]);

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    return {
      subscriptionTier: tier,
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        visibility: course.visibility,
        allowed: this.canAccessCourse(course.visibility, course.isFreeBasic, tier),
        requiredTier: this.requiredTier(course.visibility, course.isFreeBasic),
      },
      lessons: course.modules.flatMap((module) =>
        module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          visibility: lesson.visibility,
          allowed: this.canAccessVisibility(lesson.visibility, tier),
          requiredTier: this.requiredTier(lesson.visibility),
        })),
      ),
      projects: course.modules.flatMap((module) =>
        module.projects.map((project) => ({
          id: project.id,
          title: project.title,
          visibility: project.visibility,
          allowed: this.canAccessVisibility(project.visibility, tier),
          requiredTier: this.requiredTier(project.visibility),
        })),
      ),
    };
  }

  async assertCourseAccess(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { visibility: true, isFreeBasic: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    const tier = await this.currentTier(userId);

    if (!this.canAccessCourse(course.visibility, course.isFreeBasic, tier)) {
      throw new ForbiddenException(`This course requires the ${this.requiredTier(course.visibility, course.isFreeBasic)} plan.`);
    }
  }

  async assertLessonAccess(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { visibility: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }

    const tier = await this.currentTier(userId);

    if (!this.canAccessVisibility(lesson.visibility, tier)) {
      throw new ForbiddenException(`This lesson requires the ${this.requiredTier(lesson.visibility)} plan.`);
    }
  }

  async currentTier(userId: string): Promise<SubscriptionTier> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gte: new Date() } }],
      },
      select: { tier: true },
    });

    return subscriptions.reduce<SubscriptionTier>(
      (highest, subscription) => (tierRank[subscription.tier] > tierRank[highest] ? subscription.tier : highest),
      SubscriptionTier.BASIC,
    );
  }

  private canAccessCourse(visibility: ContentVisibility, isFreeBasic: boolean, tier: SubscriptionTier) {
    return isFreeBasic || this.canAccessVisibility(visibility, tier);
  }

  private canAccessVisibility(visibility: ContentVisibility, tier: SubscriptionTier) {
    if (visibility === ContentVisibility.FREE || visibility === ContentVisibility.PREVIEW) return true;
    if (visibility === ContentVisibility.PLUS) return tierRank[tier] >= tierRank[SubscriptionTier.PLUS];
    if (visibility === ContentVisibility.PRO) return tierRank[tier] >= tierRank[SubscriptionTier.PRO];
    return false;
  }

  private requiredTier(visibility: ContentVisibility, isFreeBasic = false) {
    if (isFreeBasic || visibility === ContentVisibility.FREE || visibility === ContentVisibility.PREVIEW) {
      return SubscriptionTier.BASIC;
    }

    return visibility === ContentVisibility.PRO ? SubscriptionTier.PRO : SubscriptionTier.PLUS;
  }
}
