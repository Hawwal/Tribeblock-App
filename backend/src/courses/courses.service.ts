import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseLevel, CourseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ListCoursesInput = {
  category?: string;
  level?: CourseLevel;
};

type CreateCourseDraftInput = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
};

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  listCareerPaths() {
    return this.prisma.careerPath.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        courses: {
          orderBy: { sortOrder: 'asc' },
          include: {
            course: {
              select: {
                slug: true,
                title: true,
                subtitle: true,
                level: true,
                estimatedHours: true,
                visibility: true,
                isFreeBasic: true,
              },
            },
          },
        },
      },
    });
  }

  listCourses(input: ListCoursesInput) {
    return this.prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        ...(input.category ? { category: input.category } : {}),
        ...(input.level ? { level: input.level } : {}),
      },
      orderBy: [{ isFreeBasic: 'desc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        category: true,
        level: true,
        visibility: true,
        isFreeBasic: true,
        hasProProject: true,
        estimatedHours: true,
        languageTags: true,
        skillTags: true,
        sourceRepositoryUrl: true,
        sourcePath: true,
        sourceProvider: true,
        sourceSyncEnabled: true,
      },
    });
  }

  async getCourse(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              include: {
                assets: { orderBy: { sortOrder: 'asc' } },
                quizzes: { include: { questions: { orderBy: { sortOrder: 'asc' } } } },
                exercises: { orderBy: { sortOrder: 'asc' }, include: { tests: true } },
              },
            },
            projects: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Course not found.');
    }

    return course;
  }

  createInstructorDraft(authorId: string, input: CreateCourseDraftInput) {
    const slug = this.slugify(input.title);

    return this.prisma.course.create({
      data: {
        ...input,
        slug,
        authorId,
        status: CourseStatus.UNDER_REVIEW,
        estimatedHours: 1,
        languageTags: [],
        skillTags: [],
        sourceRepositoryUrl: 'https://github.com/Tribe-Block-University',
        sourcePath: `${slug}/README.md`,
        sourceProvider: 'github',
        sourceSyncEnabled: true,
      },
    });
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
