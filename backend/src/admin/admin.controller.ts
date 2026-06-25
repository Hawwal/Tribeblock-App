import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContributorApplicationStatus, CourseStatus, PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { ContributorsService } from '../contributors/contributors.service';
import { AdminService } from './admin.service';

class ReviewDto {
  @IsEnum(CourseStatus)
  status: CourseStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

class ContributorApplicationReviewDto {
  @IsEnum(ContributorApplicationStatus)
  status: ContributorApplicationStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly contributorsService: ContributorsService,
  ) {}

  @Get('overview')
  overview(@CurrentUser() user: RequestUser) {
    return this.adminService.overview(user.id);
  }

  @Get('payments')
  listPayments(@CurrentUser() user: RequestUser, @Query('status') status?: PaymentStatus) {
    return this.adminService.listPayments(user.id, status);
  }

  @Get('courses/review-queue')
  listCoursesForReview(@CurrentUser() user: RequestUser, @Query('status') status?: CourseStatus) {
    return this.adminService.listCoursesForReview(user.id, status);
  }

  @Post('courses/:courseId/reviews')
  reviewCourse(@CurrentUser() user: RequestUser, @Param('courseId') courseId: string, @Body() dto: ReviewDto) {
    return this.adminService.reviewCourse(user.id, courseId, dto);
  }

  @Patch('courses/:courseId/publish')
  publishCourse(@CurrentUser() user: RequestUser, @Param('courseId') courseId: string) {
    return this.adminService.publishCourse(user.id, courseId);
  }

  @Get('contributor-applications')
  listContributorApplications(@CurrentUser() user: RequestUser, @Query('status') status?: ContributorApplicationStatus) {
    return this.adminService.listContributorApplications(user.id, status);
  }

  @Patch('contributor-applications/:applicationId')
  reviewContributorApplication(
    @CurrentUser() user: RequestUser,
    @Param('applicationId') applicationId: string,
    @Body() dto: ContributorApplicationReviewDto,
  ) {
    return this.adminService.reviewContributorApplication(user.id, applicationId, dto);
  }

  @Post('contributor-applications/:applicationId/demo-reward')
  createDemoContributionReward(@Param('applicationId') applicationId: string) {
    return this.contributorsService.seedDemoContribution(applicationId);
  }
}
