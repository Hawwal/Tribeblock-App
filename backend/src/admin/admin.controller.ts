import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContentVisibility, ContributorApplicationStatus, CourseLevel, CourseStatus, ExerciseRuntime, PaymentStatus, SubscriptionTier } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
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

class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @IsArray()
  @IsEnum(SubscriptionTier, { each: true })
  appliesToTiers: SubscriptionTier[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  startsAt?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxRedemptions?: number;
}

class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsEnum(CourseLevel)
  level: CourseLevel;

  @IsEnum(ContentVisibility)
  visibility: ContentVisibility;

  @IsBoolean()
  @IsOptional()
  isFreeBasic?: boolean;

  @IsInt()
  @Min(1)
  estimatedHours: number;

  @IsArray()
  @IsString({ each: true })
  languageTags: string[];

  @IsArray()
  @IsString({ each: true })
  skillTags: string[];
}

class CreateModuleDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  bodyMarkdown: string;

  @IsEnum(ContentVisibility)
  visibility: ContentVisibility;

  @IsInt()
  @Min(1)
  estimatedMinutes: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

class ExerciseTestDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  command?: string;

  @IsString()
  assertion: string;

  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;
}

class CreateExerciseDto {
  @IsString()
  title: string;

  @IsString()
  instructions: string;

  @IsEnum(ExerciseRuntime)
  runtime: ExerciseRuntime;

  @IsObject()
  starterFiles: Record<string, string>;

  @IsObject()
  @IsOptional()
  solutionFiles?: Record<string, string>;

  @IsEnum(ContentVisibility)
  visibility: ContentVisibility;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @IsOptional()
  tests?: ExerciseTestDto[];
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

  @Get('coupons')
  listCoupons(@CurrentUser() user: RequestUser) {
    return this.adminService.listCoupons(user.id);
  }

  @Post('coupons')
  createCoupon(@CurrentUser() user: RequestUser, @Body() dto: CreateCouponDto) {
    return this.adminService.createCoupon(user.id, dto);
  }

  @Get('courses/review-queue')
  listCoursesForReview(@CurrentUser() user: RequestUser, @Query('status') status?: CourseStatus) {
    return this.adminService.listCoursesForReview(user.id, status);
  }

  @Get('authoring/courses')
  listAuthoringCourses(@CurrentUser() user: RequestUser) {
    return this.adminService.listAuthoringCourses(user.id);
  }

  @Post('authoring/courses')
  createCourse(@CurrentUser() user: RequestUser, @Body() dto: CreateCourseDto) {
    return this.adminService.createCourse(user.id, dto);
  }

  @Post('authoring/courses/:courseId/modules')
  createModule(@CurrentUser() user: RequestUser, @Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.adminService.createModule(user.id, courseId, dto);
  }

  @Post('authoring/modules/:moduleId/lessons')
  createLesson(@CurrentUser() user: RequestUser, @Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.adminService.createLesson(user.id, moduleId, dto);
  }

  @Post('authoring/lessons/:lessonId/exercises')
  createExercise(@CurrentUser() user: RequestUser, @Param('lessonId') lessonId: string, @Body() dto: CreateExerciseDto) {
    return this.adminService.createExercise(user.id, lessonId, dto);
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
