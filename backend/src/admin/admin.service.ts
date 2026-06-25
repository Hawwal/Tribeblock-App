import { ForbiddenException, Injectable } from '@nestjs/common';
import { ContributorApplicationStatus, CourseStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ReviewInput = {
  status: CourseStatus;
  notes?: string;
};

type ContributorReviewInput = {
  status: ContributorApplicationStatus;
  adminNotes?: string;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
    });
  }

  async reviewContributorApplication(userId: string, applicationId: string, input: ContributorReviewInput) {
    await this.assertAdminOrReviewer(userId);

    return this.prisma.contributorApplication.update({
      where: { id: applicationId },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
      },
    });
  }

  private toCountMap<T extends { _count: Record<string, number> }>(items: T[], key: keyof T & string) {
    return items.reduce<Record<string, number>>((counts, item) => {
      counts[String(item[key])] = item._count[key] ?? 0;
      return counts;
    }, {});
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

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can publish courses.');
    }
  }
}
