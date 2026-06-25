import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CourseLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { CoursesService } from './courses.service';

class CourseQueryDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;
}

class CreateCourseDraftDto {
  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsString()
  description: string;

  @IsString()
  category: string;
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('career-paths')
  careerPaths() {
    return this.coursesService.listCareerPaths();
  }

  @Get()
  list(@Query() query: CourseQueryDto) {
    return this.coursesService.listCourses(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.coursesService.getCourse(slug);
  }

  @Post('instructor-drafts')
  createDraft(@CurrentUser() user: RequestUser, @Body() dto: CreateCourseDraftDto) {
    return this.coursesService.createInstructorDraft(user.id, dto);
  }
}
