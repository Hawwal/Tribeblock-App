import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssetType,
  ContentVisibility,
  CourseLevel,
  CourseStatus,
  ExerciseRuntime,
  Prisma,
  QuestionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SyncRepositoryInput = {
  fullName: string;
  ref?: string;
  repositoryUrl?: string;
};

type GithubContentItem = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
};

type CourseFile = {
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  category: string;
  level?: string;
  visibility?: string;
  isFreeBasic?: boolean;
  hasProProject?: boolean;
  estimatedHours?: number;
  languageTags?: string[];
  skillTags?: string[];
  status?: string;
};

type ModuleFile = {
  title: string;
  summary?: string;
  sortOrder?: number;
  visibility?: string;
};

type LessonMeta = {
  title?: string;
  summary?: string;
  visibility?: string;
  estimatedMinutes?: number;
  assets?: Array<{ type?: string; title: string; url: string; license?: string }>;
};

type QuizFile = {
  title?: string;
  lessonSlug?: string;
  passingScore?: number;
  questions?: Array<{
    type?: string;
    prompt: string;
    options?: unknown;
    correctAnswer?: unknown;
    explanation?: string;
  }>;
};

type ExerciseFile = {
  title: string;
  lessonSlug?: string;
  instructions?: string;
  runtime?: string;
  visibility?: string;
  starterFiles?: Record<string, string>;
  solutionFiles?: Record<string, string>;
  tests?: Array<{ name?: string; command?: string; assertion: string; isHidden?: boolean }>;
};

type ProjectFile = {
  title: string;
  slug?: string;
  briefMarkdown?: string;
  runtime?: string;
  visibility?: string;
  starterFiles?: Record<string, string>;
  rubric?: Record<string, number>;
};

type ParsedMarkdown = {
  meta: Record<string, any>;
  body: string;
};

@Injectable()
export class CourseSyncService {
  private readonly githubApiBase = 'https://api.github.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async syncRepository(input: SyncRepositoryInput) {
    const courseRoots = await this.findCourseRoots(input.fullName, input.ref);
    const syncedCourses = [];

    for (const rootPath of courseRoots) {
      syncedCourses.push(await this.syncCourseRoot(input, rootPath));
    }

    return {
      repository: input.fullName,
      ref: input.ref ?? 'default',
      coursesFound: courseRoots.length,
      coursesSynced: syncedCourses.length,
      syncedCourses,
    };
  }

  async syncRepositoryFromWebhook(payload: Record<string, any>) {
    const fullName = payload.repository?.full_name as string | undefined;

    if (!fullName) {
      throw new BadRequestException('GitHub repository full_name is required for course sync.');
    }

    return this.syncRepository({
      fullName,
      ref: payload.pull_request?.base?.ref ?? payload.repository?.default_branch,
      repositoryUrl: payload.repository?.html_url,
    });
  }

  private async findCourseRoots(fullName: string, ref?: string) {
    const rootCourseFile = await this.readFirstExistingText(fullName, ['', 'course.yml', 'course.yaml'], ref);

    if (rootCourseFile) {
      return [''];
    }

    const rootItems = await this.listDirectory(fullName, '', ref);
    const roots: string[] = [];

    for (const item of rootItems.filter((entry) => entry.type === 'dir')) {
      const hasCourseFile = await this.readFirstExistingText(fullName, [item.path, 'course.yml', 'course.yaml'], ref);

      if (hasCourseFile) {
        roots.push(item.path);
      }
    }

    return roots;
  }

  private async syncCourseRoot(input: SyncRepositoryInput, rootPath: string) {
    const courseText = await this.readFirstExistingText(input.fullName, [rootPath, 'course.yml', 'course.yaml'], input.ref);
    const courseFile = this.requireObject<CourseFile>(this.parseYaml(courseText ?? ''), `${this.joinPath(rootPath, 'course.yml')}`);
    const slug = this.slugify(courseFile.slug || courseFile.title);
    const status = this.enumValue(CourseStatus, courseFile.status, CourseStatus.PUBLISHED);
    const level = this.enumValue(CourseLevel, courseFile.level, CourseLevel.BEGINNER);
    const visibility = this.enumValue(ContentVisibility, courseFile.visibility, ContentVisibility.FREE);

    const existingCourse = await this.prisma.course.findUnique({ where: { slug }, select: { id: true, status: true } });
    const course = existingCourse
      ? await this.prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            title: courseFile.title,
            subtitle: courseFile.subtitle ?? courseFile.description ?? courseFile.title,
            description: courseFile.description ?? courseFile.subtitle ?? courseFile.title,
            category: courseFile.category,
            level,
            visibility,
            isFreeBasic: courseFile.isFreeBasic ?? visibility === ContentVisibility.FREE,
            hasProProject: courseFile.hasProProject ?? true,
            estimatedHours: Number(courseFile.estimatedHours ?? 1),
            languageTags: this.stringArray(courseFile.languageTags),
            skillTags: this.stringArray(courseFile.skillTags),
            sourceRepositoryUrl: input.repositoryUrl ?? `https://github.com/${input.fullName}`,
            sourcePath: this.joinPath(rootPath, 'course.yml'),
            sourceProvider: 'github',
            sourceSyncEnabled: true,
            status,
            publishedAt: status === CourseStatus.PUBLISHED ? new Date() : undefined,
          },
        })
      : await this.prisma.course.create({
          data: {
            title: courseFile.title,
            slug,
            subtitle: courseFile.subtitle ?? courseFile.description ?? courseFile.title,
            description: courseFile.description ?? courseFile.subtitle ?? courseFile.title,
            category: courseFile.category,
            level,
            visibility,
            isFreeBasic: courseFile.isFreeBasic ?? visibility === ContentVisibility.FREE,
            hasProProject: courseFile.hasProProject ?? true,
            estimatedHours: Number(courseFile.estimatedHours ?? 1),
            languageTags: this.stringArray(courseFile.languageTags),
            skillTags: this.stringArray(courseFile.skillTags),
            sourceRepositoryUrl: input.repositoryUrl ?? `https://github.com/${input.fullName}`,
            sourcePath: this.joinPath(rootPath, 'course.yml'),
            sourceProvider: 'github',
            sourceSyncEnabled: true,
            status,
            publishedAt: status === CourseStatus.PUBLISHED ? new Date() : undefined,
          },
        });

    const modulesSynced = await this.syncModules(input.fullName, input.ref, rootPath, course.id, visibility);

    return {
      slug,
      title: course.title,
      status: course.status,
      modulesSynced,
      sourcePath: this.joinPath(rootPath, 'course.yml'),
    };
  }

  private async syncModules(
    fullName: string,
    ref: string | undefined,
    rootPath: string,
    courseId: string,
    courseVisibility: ContentVisibility,
  ) {
    const modulesRoot = this.joinPath(rootPath, 'modules');
    const moduleFolders = (await this.listDirectory(fullName, modulesRoot, ref)).filter((item) => item.type === 'dir');
    let modulesSynced = 0;

    for (const [index, moduleFolder] of moduleFolders.entries()) {
      const moduleText = await this.readFirstExistingText(fullName, [moduleFolder.path, 'module.yml', 'module.yaml'], ref);
      const moduleFile = this.requireObject<ModuleFile>(this.parseYaml(moduleText ?? ''), `${moduleFolder.path}/module.yml`);
      const sortOrder = Number(moduleFile.sortOrder ?? index + 1);
      const module = await this.prisma.courseModule.upsert({
        where: { courseId_sortOrder: { courseId, sortOrder } },
        update: {
          title: moduleFile.title,
          summary: moduleFile.summary ?? moduleFile.title,
        },
        create: {
          courseId,
          title: moduleFile.title,
          summary: moduleFile.summary ?? moduleFile.title,
          sortOrder,
        },
      });

      await this.syncModuleLessons(fullName, ref, moduleFolder.path, module.id, moduleFile, courseVisibility);
      await this.syncModuleQuizzes(fullName, ref, moduleFolder.path, module.id);
      await this.syncModuleExercises(fullName, ref, moduleFolder.path, module.id, courseVisibility);
      await this.syncModulePracticals(fullName, ref, moduleFolder.path, module.id, courseVisibility);
      modulesSynced += 1;
    }

    const finalProject = await this.readFirstExistingText(fullName, [rootPath, 'final-project.yml', 'final-project.yaml'], ref);

    if (finalProject && modulesSynced > 0) {
      const lastModule = await this.prisma.courseModule.findFirst({
        where: { courseId },
        orderBy: { sortOrder: 'desc' },
      });

      if (lastModule) {
        await this.upsertProject(lastModule.id, this.requireObject<ProjectFile>(this.parseYaml(finalProject), 'final-project.yml'), courseVisibility, 999);
      }
    }

    const finalExam = await this.readFirstExistingText(fullName, [rootPath, 'final-exam.md'], ref);

    if (finalExam && modulesSynced > 0) {
      const lastModule = await this.prisma.courseModule.findFirst({
        where: { courseId },
        orderBy: { sortOrder: 'desc' },
      });

      if (lastModule) {
        await this.upsertLessonFromMarkdown(lastModule.id, 'final-exam', finalExam, {
          title: 'Final Exam',
          visibility: ContentVisibility.PRO,
          sortOrder: 998,
        });
      }
    }

    return modulesSynced;
  }

  private async syncModuleLessons(
    fullName: string,
    ref: string | undefined,
    modulePath: string,
    moduleId: string,
    moduleFile: ModuleFile,
    courseVisibility: ContentVisibility,
  ) {
    const lessonsPath = this.joinPath(modulePath, 'lessons');
    const lessonFiles = (await this.listDirectory(fullName, lessonsPath, ref))
      .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const [index, lessonFile] of lessonFiles.entries()) {
      const text = await this.readText(fullName, lessonFile.path, ref);
      await this.upsertLessonFromMarkdown(moduleId, this.slugFromFilename(lessonFile.name), text, {
        visibility: this.enumValue(ContentVisibility, moduleFile.visibility, courseVisibility),
        sortOrder: index + 1,
      });
    }

    const assignment = await this.readFirstExistingText(fullName, [modulePath, 'assignment.md'], ref);

    if (assignment) {
      await this.upsertLessonFromMarkdown(moduleId, 'assignment', assignment, {
        title: 'Assignment',
        visibility: ContentVisibility.PLUS,
        sortOrder: 900,
      });
    }

    const puzzle = await this.readFirstExistingText(fullName, [modulePath, 'puzzle.md'], ref);

    if (puzzle) {
      await this.upsertLessonFromMarkdown(moduleId, 'puzzle', puzzle, {
        title: 'Puzzle',
        visibility: ContentVisibility.FREE,
        sortOrder: 901,
      });
    }
  }

  private async syncModuleQuizzes(fullName: string, ref: string | undefined, modulePath: string, moduleId: string) {
    const quizzesPath = this.joinPath(modulePath, 'quizzes');
    const quizFiles = (await this.listDirectory(fullName, quizzesPath, ref))
      .filter((item) => item.type === 'file' && (item.name.endsWith('.yml') || item.name.endsWith('.yaml')))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const [index, quizFile] of quizFiles.entries()) {
      const quiz = this.requireObject<QuizFile>(this.parseYaml(await this.readText(fullName, quizFile.path, ref)), quizFile.path);
      const lesson = await this.findLessonForModuleItem(moduleId, quiz.lessonSlug);

      if (!lesson) {
        continue;
      }

      await this.prisma.quiz.deleteMany({ where: { lessonId: lesson.id, title: quiz.title ?? 'Checkpoint' } });
      await this.prisma.quiz.create({
        data: {
          lessonId: lesson.id,
          title: quiz.title ?? 'Checkpoint',
          passingScore: Number(quiz.passingScore ?? 70),
          sortOrder: index + 1,
          questions: {
            create: this.questionData(quiz.questions ?? []),
          },
        },
      });
    }
  }

  private async syncModuleExercises(
    fullName: string,
    ref: string | undefined,
    modulePath: string,
    moduleId: string,
    courseVisibility: ContentVisibility,
  ) {
    const exercisesPath = this.joinPath(modulePath, 'exercises');
    const exerciseFiles = (await this.listDirectory(fullName, exercisesPath, ref))
      .filter((item) => item.type === 'file' && (item.name.endsWith('.yml') || item.name.endsWith('.yaml')))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const [index, exerciseFile] of exerciseFiles.entries()) {
      const exercise = this.requireObject<ExerciseFile>(this.parseYaml(await this.readText(fullName, exerciseFile.path, ref)), exerciseFile.path);
      const lesson = await this.findLessonForModuleItem(moduleId, exercise.lessonSlug);

      if (!lesson) {
        continue;
      }

      const slug = this.slugFromFilename(exerciseFile.name);
      const existing = await this.prisma.codingExercise.findUnique({ where: { lessonId_slug: { lessonId: lesson.id, slug } } });
      const data = {
        title: exercise.title,
        instructions: exercise.instructions ?? exercise.title,
        runtime: this.enumValue(ExerciseRuntime, exercise.runtime, ExerciseRuntime.BROWSER_HTML_CSS_JS),
        starterFiles: (exercise.starterFiles ?? {}) as Prisma.InputJsonValue,
        solutionFiles: exercise.solutionFiles as Prisma.InputJsonValue | undefined,
        visibility: this.enumValue(ContentVisibility, exercise.visibility, courseVisibility),
        sortOrder: index + 1,
      };
      const savedExercise = existing
        ? await this.prisma.codingExercise.update({ where: { id: existing.id }, data })
        : await this.prisma.codingExercise.create({ data: { ...data, lessonId: lesson.id, slug } });

      await this.prisma.exerciseTest.deleteMany({ where: { exerciseId: savedExercise.id } });

      if (exercise.tests?.length) {
        await this.prisma.exerciseTest.createMany({
          data: exercise.tests.map((test, testIndex) => ({
            exerciseId: savedExercise.id,
            name: test.name ?? `Check ${testIndex + 1}`,
            command: test.command,
            assertion: test.assertion,
            isHidden: test.isHidden ?? false,
            sortOrder: testIndex + 1,
          })),
        });
      }
    }
  }

  private async syncModulePracticals(
    fullName: string,
    ref: string | undefined,
    modulePath: string,
    moduleId: string,
    courseVisibility: ContentVisibility,
  ) {
    const practicalsPath = this.joinPath(modulePath, 'practicals');
    const practicalFolders = (await this.listDirectory(fullName, practicalsPath, ref))
      .filter((item) => item.type === 'dir')
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const [index, practicalFolder] of practicalFolders.entries()) {
      const text = await this.readFirstExistingText(fullName, [practicalFolder.path, 'practical.yml', 'practical.yaml'], ref);

      if (!text) {
        continue;
      }

      await this.upsertProject(moduleId, this.requireObject<ProjectFile>(this.parseYaml(text), `${practicalFolder.path}/practical.yml`), courseVisibility, index + 1);
    }
  }

  private async upsertLessonFromMarkdown(
    moduleId: string,
    slug: string,
    text: string,
    options: { title?: string; visibility: ContentVisibility; sortOrder: number },
  ) {
    const markdown = this.parseMarkdown(text);
    const meta = markdown.meta as LessonMeta;
    const title = options.title ?? meta.title ?? this.titleFromMarkdown(markdown.body) ?? this.titleize(slug);
    const bodyMarkdown = markdown.body.trim();
    const existing = await this.prisma.lesson.findUnique({ where: { moduleId_slug: { moduleId, slug } } });
    const data = {
      title,
      summary: meta.summary ?? this.summaryFromMarkdown(bodyMarkdown) ?? title,
      bodyMarkdown,
      visibility: this.enumValue(ContentVisibility, meta.visibility, options.visibility),
      estimatedMinutes: Number(meta.estimatedMinutes ?? 25),
      sortOrder: options.sortOrder,
    };
    const lesson = existing
      ? await this.prisma.lesson.update({ where: { id: existing.id }, data })
      : await this.prisma.lesson.create({ data: { ...data, moduleId, slug } });

    await this.prisma.lessonAsset.deleteMany({ where: { lessonId: lesson.id } });

    if (meta.assets?.length) {
      await this.prisma.lessonAsset.createMany({
        data: meta.assets.map((asset, index) => ({
          lessonId: lesson.id,
          type: this.enumValue(AssetType, asset.type, AssetType.PDF),
          title: asset.title,
          url: asset.url,
          license: asset.license,
          sortOrder: index + 1,
        })),
      });
    }

    return lesson;
  }

  private async upsertProject(moduleId: string, project: ProjectFile, courseVisibility: ContentVisibility, sortOrder: number) {
    const slug = this.slugify(project.slug ?? project.title);
    const data = {
      title: project.title,
      briefMarkdown: project.briefMarkdown ?? project.title,
      runtime: this.enumValue(ExerciseRuntime, project.runtime, ExerciseRuntime.BROWSER_HTML_CSS_JS),
      starterFiles: (project.starterFiles ?? {}) as Prisma.InputJsonValue,
      rubric: (project.rubric ?? { correctness: 40, codeQuality: 30, userExperience: 20, reflection: 10 }) as Prisma.InputJsonValue,
      visibility: this.enumValue(ContentVisibility, project.visibility, courseVisibility === ContentVisibility.FREE ? ContentVisibility.PLUS : courseVisibility),
      sortOrder,
    };
    const existing = await this.prisma.project.findUnique({ where: { moduleId_slug: { moduleId, slug } } });

    return existing
      ? this.prisma.project.update({ where: { id: existing.id }, data })
      : this.prisma.project.create({ data: { ...data, moduleId, slug } });
  }

  private async findLessonForModuleItem(moduleId: string, lessonSlug?: string) {
    if (lessonSlug) {
      const lesson = await this.prisma.lesson.findUnique({ where: { moduleId_slug: { moduleId, slug: lessonSlug } } });

      if (lesson) {
        return lesson;
      }
    }

    return this.prisma.lesson.findFirst({ where: { moduleId }, orderBy: { sortOrder: 'asc' } });
  }

  private questionData(questions: QuizFile['questions']) {
    return (questions ?? []).map((question, index) => ({
      type: this.enumValue(QuestionType, question.type, QuestionType.MULTIPLE_CHOICE),
      prompt: question.prompt,
      options: (question.options ?? []) as Prisma.InputJsonValue,
      correctAnswer: (question.correctAnswer ?? []) as Prisma.InputJsonValue,
      explanation: question.explanation,
      sortOrder: index + 1,
    }));
  }

  private async listDirectory(fullName: string, path: string, ref?: string) {
    const contents = await this.githubContents(fullName, path, ref);

    return Array.isArray(contents) ? contents : [];
  }

  private async readFirstExistingText(fullName: string, parts: string[], ref?: string) {
    const basePath = parts[0] ?? '';
    const filenames = parts.slice(1);

    for (const filename of filenames) {
      const text = await this.readTextIfExists(fullName, this.joinPath(basePath, filename), ref);

      if (text !== null) {
        return text;
      }
    }

    return null;
  }

  private async readTextIfExists(fullName: string, path: string, ref?: string) {
    try {
      return await this.readText(fullName, path, ref);
    } catch (error) {
      if (error instanceof Error && error.message.includes('GitHub file not found')) {
        return null;
      }

      throw error;
    }
  }

  private async readText(fullName: string, path: string, ref?: string) {
    const contents = await this.githubContents(fullName, path, ref);

    if (Array.isArray(contents) || contents.type !== 'file' || !contents.content) {
      throw new BadRequestException(`GitHub file not found: ${path}`);
    }

    return Buffer.from(contents.content.replace(/\n/g, ''), contents.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
  }

  private async githubContents(fullName: string, path: string, ref?: string) {
    const encodedPath = path
      .split('/')
      .filter(Boolean)
      .map((part) => encodeURIComponent(part))
      .join('/');
    const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    const url = `${this.githubApiBase}/repos/${fullName}/contents/${encodedPath}${refParam}`;
    const response = await fetch(url, {
      headers: this.githubHeaders(),
    });

    if (response.status === 404) {
      throw new BadRequestException(`GitHub file not found: ${path}`);
    }

    if (!response.ok) {
      throw new BadRequestException(`GitHub course sync failed for ${path || '/'}: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GithubContentItem | GithubContentItem[];
  }

  private githubHeaders() {
    const token = this.config.get<string>('GITHUB_COURSE_SYNC_TOKEN') ?? this.config.get<string>('GITHUB_TOKEN');

    return {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'tribe-block-course-sync',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private parseMarkdown(text: string): ParsedMarkdown {
    if (!text.startsWith('---')) {
      return { meta: {}, body: text };
    }

    const end = text.indexOf('\n---', 3);

    if (end === -1) {
      return { meta: {}, body: text };
    }

    return {
      meta: this.parseYaml(text.slice(3, end)),
      body: text.slice(end + 4).trimStart(),
    };
  }

  private parseYaml(text: string): Record<string, any> {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let index = 0;

    const readBlockScalar = (indent: number) => {
      const values: string[] = [];

      while (index < lines.length) {
        const line = lines[index] ?? '';
        const currentIndent = this.indentOf(line);

        if (line.trim() && currentIndent < indent) {
          break;
        }

        values.push(line.slice(Math.min(indent, line.length)));
        index += 1;
      }

      return values.join('\n').replace(/\n+$/, '');
    };

    const parseScalar = (value: string): unknown => {
      const trimmed = value.trim();

      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (trimmed === 'null') return null;
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return trimmed
          .slice(1, -1)
          .split(',')
          .map((item) => String(parseScalar(item.trim())));
      }

      return trimmed.replace(/^['"]|['"]$/g, '');
    };

    const parseBlock = (indent: number): any => {
      const first = this.nextContentLine(lines, index);
      const isArray = first?.trim().startsWith('- ') ?? false;

      if (isArray) {
        const items: any[] = [];

        while (index < lines.length) {
          const line = lines[index] ?? '';

          if (!line.trim() || line.trim().startsWith('#')) {
            index += 1;
            continue;
          }

          const currentIndent = this.indentOf(line);

          if (currentIndent < indent || !line.trim().startsWith('- ')) {
            break;
          }

          const content = line.trim().slice(2).trim();
          index += 1;

          if (!content) {
            items.push(parseBlock(currentIndent + 2));
            continue;
          }

          const keyMatch = content.match(/^([^:]+):(.*)$/);

          if (keyMatch) {
            const item: Record<string, any> = {};
            const key = keyMatch[1].trim();
            const value = keyMatch[2].trim();
            item[key] = value ? parseScalar(value) : parseBlock(currentIndent + 2);

            while (index < lines.length) {
              const next = lines[index] ?? '';

              if (!next.trim() || next.trim().startsWith('#')) {
                index += 1;
                continue;
              }

              const nextIndent = this.indentOf(next);

              if (nextIndent <= currentIndent) {
                break;
              }

              const nextMatch = next.trim().match(/^([^:]+):(.*)$/);

              if (!nextMatch) {
                break;
              }

              index += 1;
              const nextKey = nextMatch[1].trim();
              const nextValue = nextMatch[2].trim();
              item[nextKey] = nextValue === '|'
                ? readBlockScalar(nextIndent + 2)
                : nextValue
                  ? parseScalar(nextValue)
                  : parseBlock(nextIndent + 2);
            }

            items.push(item);
          } else {
            items.push(parseScalar(content));
          }
        }

        return items;
      }

      const object: Record<string, any> = {};

      while (index < lines.length) {
        const line = lines[index] ?? '';

        if (!line.trim() || line.trim().startsWith('#')) {
          index += 1;
          continue;
        }

        const currentIndent = this.indentOf(line);

        if (currentIndent < indent) {
          break;
        }

        const match = line.trim().match(/^([^:]+):(.*)$/);

        if (!match) {
          index += 1;
          continue;
        }

        index += 1;
        const key = match[1].trim();
        const value = match[2].trim();
        object[key] = value === '|'
          ? readBlockScalar(currentIndent + 2)
          : value
            ? parseScalar(value)
            : parseBlock(currentIndent + 2);
      }

      return object;
    };

    return parseBlock(0);
  }

  private nextContentLine(lines: string[], from: number) {
    for (let i = from; i < lines.length; i += 1) {
      const line = lines[i] ?? '';

      if (line.trim() && !line.trim().startsWith('#')) {
        return line;
      }
    }

    return null;
  }

  private indentOf(line: string) {
    return line.length - line.trimStart().length;
  }

  private requireObject<T>(value: unknown, label: string): T {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new BadRequestException(`${label} must contain a valid object.`);
    }

    return value as T;
  }

  private enumValue<T extends Record<string, string>>(enumObject: T, value: unknown, fallback: T[keyof T]) {
    const candidate = String(value ?? '').toUpperCase();

    return Object.values(enumObject).includes(candidate) ? (candidate as T[keyof T]) : fallback;
  }

  private stringArray(value: unknown) {
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
  }

  private titleFromMarkdown(markdown: string) {
    return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  }

  private summaryFromMarkdown(markdown: string) {
    return markdown
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#') && !line.startsWith('```'));
  }

  private slugFromFilename(filename: string) {
    return this.slugify(filename.replace(/\.(md|ya?ml)$/i, '').replace(/^\d+[-_]/, ''));
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private titleize(value: string) {
    return value
      .split('-')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private joinPath(...parts: Array<string | undefined>) {
    return parts.filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
  }
}
