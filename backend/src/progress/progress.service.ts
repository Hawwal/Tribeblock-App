import { Injectable } from '@nestjs/common';
import { ProgressStatus } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';

type LessonProgressInput = {
  status: ProgressStatus;
  score?: number;
};

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: AccessService,
  ) {}

  async forUser(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            modules: {
              select: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const completedLessonIds = new Set(
      (
        await this.prisma.lessonProgress.findMany({
          where: { userId, status: ProgressStatus.COMPLETED },
          select: { lessonId: true },
        })
      ).map((progress) => progress.lessonId),
    );

    return enrollments.map((enrollment) => {
      const lessonIds = enrollment.course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
      const completedCount = lessonIds.filter((lessonId) => completedLessonIds.has(lessonId)).length;
      const completionPercent = lessonIds.length === 0 ? 0 : Math.round((completedCount / lessonIds.length) * 100);

      return {
        ...enrollment,
        completionPercent,
        course: {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          title: enrollment.course.title,
        },
      };
    });
  }

  async enroll(userId: string, courseId: string) {
    await this.accessService.assertCourseAccess(userId, courseId);

    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: { status: ProgressStatus.IN_PROGRESS },
      include: { course: { select: { slug: true, title: true } } },
    });
  }

  async updateLesson(userId: string, lessonId: string, input: LessonProgressInput) {
    await this.accessService.assertLessonAccess(userId, lessonId);

    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: input.status,
        score: input.score,
        completedAt: input.status === ProgressStatus.COMPLETED ? new Date() : null,
      },
      update: {
        status: input.status,
        score: input.score,
        lastSeenAt: new Date(),
        completedAt: input.status === ProgressStatus.COMPLETED ? new Date() : null,
      },
    });

    if (input.status === ProgressStatus.COMPLETED) {
      await this.syncEnrollmentCompletion(userId, lessonId);
      await this.awardBadge(userId, 'first-lesson');
    }

    return lessonProgress;
  }

  private async syncEnrollmentCompletion(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { module: { select: { courseId: true } } },
    });

    if (!lesson) return;

    const course = await this.prisma.course.findUnique({
      where: { id: lesson.module.courseId },
      select: {
        modules: { select: { lessons: { select: { id: true } } } },
      },
    });

    if (!course) return;

    const lessonIds = course.modules.flatMap((module) => module.lessons.map((item) => item.id));
    const completedCount = await this.prisma.lessonProgress.count({
      where: { userId, lessonId: { in: lessonIds }, status: ProgressStatus.COMPLETED },
    });

    if (lessonIds.length > 0 && completedCount >= lessonIds.length) {
      await this.prisma.enrollment.updateMany({
        where: { userId, courseId: lesson.module.courseId },
        data: { status: ProgressStatus.COMPLETED, completedAt: new Date() },
      });
    }
  }

  private async awardBadge(userId: string, slug: string) {
    const badge = await this.prisma.badge.findUnique({ where: { slug } });

    if (!badge) return;

    await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });
  }
}
