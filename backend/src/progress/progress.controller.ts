import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProgressStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { ProgressService } from './progress.service';

class EnrollDto {
  @IsString()
  courseId: string;
}

class LessonProgressDto {
  @IsEnum(ProgressStatus)
  status: ProgressStatus;

  @IsOptional()
  score?: number;
}

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('me')
  mine(@CurrentUser() user: RequestUser) {
    return this.progressService.forUser(user.id);
  }

  @Post('enrollments')
  enroll(@CurrentUser() user: RequestUser, @Body() dto: EnrollDto) {
    return this.progressService.enroll(user.id, dto.courseId);
  }

  @Patch('lessons/:lessonId')
  updateLesson(
    @CurrentUser() user: RequestUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: LessonProgressDto,
  ) {
    return this.progressService.updateLesson(user.id, lessonId, dto);
  }
}
