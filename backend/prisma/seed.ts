import {
  AssetType,
  BillingInterval,
  ContentVisibility,
  CourseLevel,
  CourseStatus,
  ExerciseRuntime,
  PrismaClient,
  QuestionType,
  SubscriptionTier,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

type SeedCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: CourseLevel;
  visibility: ContentVisibility;
  isFreeBasic: boolean;
  estimatedHours: number;
  languageTags: string[];
  skillTags: string[];
  runtime: ExerciseRuntime;
};

const foundationalCourses: SeedCourse[] = [
  course('learn-html', 'Learn HTML', 'Structure web pages with semantic markup.', 'Build the foundation of every website by learning elements, attributes, links, forms, and document structure.', 'frontend', 'HTML', ExerciseRuntime.BROWSER_HTML_CSS_JS),
  course('learn-css', 'Learn CSS', 'Style beautiful, responsive interfaces.', 'Learn selectors, the box model, typography, layout, responsive rules, and reusable visual systems.', 'frontend', 'CSS', ExerciseRuntime.BROWSER_HTML_CSS_JS),
  course('learn-javascript', 'Learn JavaScript', 'Add behavior and logic to the web.', 'Practice variables, functions, arrays, objects, DOM events, async logic, and problem solving.', 'frontend', 'JavaScript', ExerciseRuntime.NODE),
  course('learn-typescript', 'Learn TypeScript', 'Write safer JavaScript with types.', 'Use type annotations, interfaces, generics, narrowing, and project patterns for maintainable apps.', 'frontend', 'TypeScript', ExerciseRuntime.TYPESCRIPT),
  course('learn-react', 'Learn React', 'Build component-based user interfaces.', 'Create components, manage state, handle forms, fetch data, and compose modern React pages.', 'frontend', 'React', ExerciseRuntime.BROWSER_HTML_CSS_JS),
  course('learn-python', 'Learn Python', 'Solve problems with a readable general-purpose language.', 'Practice variables, control flow, functions, data structures, files, modules, and testing basics.', 'backend', 'Python', ExerciseRuntime.PYTHON),
  course('learn-java', 'Learn Java', 'Build strongly typed applications.', 'Understand classes, objects, methods, collections, exceptions, and core Java application structure.', 'backend', 'Java', ExerciseRuntime.JAVA),
  course('learn-cpp', 'Learn C++', 'Learn systems programming fundamentals.', 'Explore compiled programs, memory, functions, classes, standard library containers, and algorithms.', 'backend', 'C++', ExerciseRuntime.CPP),
  course('learn-bash', 'Learn Bash', 'Automate developer workflows from the command line.', 'Practice shell navigation, scripts, variables, pipes, permissions, and process basics.', 'devops', 'Bash', ExerciseRuntime.BASH),
  course('learn-sql', 'Learn SQL', 'Query and model relational data.', 'Write SELECT queries, filters, joins, aggregates, constraints, and practical reporting queries.', 'data', 'SQL', ExerciseRuntime.SQL),
];

const advancedCourses: SeedCourse[] = [
  {
    ...course('backend-apis-with-node', 'Backend APIs with Node.js', 'Design robust APIs for production web apps.', 'Build REST APIs, validation, database access, error handling, auth boundaries, and service architecture.', 'backend', 'Node.js', ExerciseRuntime.NODE),
    visibility: ContentVisibility.PLUS,
    isFreeBasic: false,
    estimatedHours: 14,
  },
  {
    ...course('data-science-with-python', 'Data Science with Python', 'Analyze data and communicate insights.', 'Learn notebooks, tabular data, cleaning, visualization, simple models, and responsible interpretation.', 'data', 'Python', ExerciseRuntime.PYTHON),
    visibility: ContentVisibility.PLUS,
    isFreeBasic: false,
    estimatedHours: 18,
  },
  {
    ...course('celo-usdt-payments', 'Celo USDT Payments', 'Build stablecoin checkout flows on Celo.', 'Create Celo payment intents, verify USDT transfers, and prepare smart-contract-backed subscriptions.', 'blockchain', 'Celo', ExerciseRuntime.TYPESCRIPT),
    visibility: ContentVisibility.PRO,
    isFreeBasic: false,
    estimatedHours: 10,
  },
];

async function main() {
  await seedUsers();
  await seedPlans();
  await seedCourses([...foundationalCourses, ...advancedCourses]);
  await seedCareerPaths();
  await seedBadges();
}

async function seedUsers() {
  const users = [
    ['local-demo-user', 'student@tribeblock.local', 'Demo Student', 'demo-student', UserRole.STUDENT],
    ['local-instructor-user', 'instructor@tribeblock.local', 'Demo Instructor', 'demo-instructor', UserRole.INSTRUCTOR],
    ['local-reviewer-user', 'reviewer@tribeblock.local', 'Demo Reviewer', 'demo-reviewer', UserRole.MENTOR_REVIEWER],
    ['local-admin-user', 'admin@tribeblock.local', 'Demo Admin', 'demo-admin', UserRole.ADMIN],
  ] as const;

  for (const [id, email, displayName, handle, role] of users) {
    await prisma.user.upsert({
      where: { id },
      update: { email, displayName, handle, role },
      create: {
        id,
        email,
        displayName,
        handle,
        role,
        emailVerifiedAt: new Date(),
        passwordHash: 'local-dev:password123',
      },
    });
  }
}

async function seedPlans() {
  const plans = [
    {
      tier: SubscriptionTier.BASIC,
      name: 'Basic',
      description: 'Free foundational programming courses with IDE practice, quizzes, exams, and badges.',
      monthlyPriceUsd: '0',
      yearlyPriceUsd: '0',
      features: ['10 foundational courses', 'IDE practicals', 'Quizzes and exams', 'Fundamental course badges'],
    },
    {
      tier: SubscriptionTier.PLUS,
      name: 'Plus',
      description: 'Project-based learning for committed builders.',
      monthlyPriceUsd: '19',
      yearlyPriceUsd: '190',
      features: ['All courses', 'Guided build projects', 'Structured IDE checkpoints', 'Career path progress'],
    },
    {
      tier: SubscriptionTier.PRO,
      name: 'Pro',
      description: 'Career-path training with certificates, review workflow, and portfolio proof.',
      monthlyPriceUsd: '39',
      yearlyPriceUsd: '390',
      features: ['Everything in Plus', 'NFT certificates', 'Mentor review workflow', 'Advanced credential proof'],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }
}

async function seedCourses(courses: SeedCourse[]) {
  for (const item of courses) {
    const { runtime: _runtime, ...courseData } = item;

    await prisma.course.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        category: item.category,
        level: item.level,
        visibility: item.visibility,
        isFreeBasic: item.isFreeBasic,
        hasProProject: true,
        estimatedHours: item.estimatedHours,
        languageTags: item.languageTags,
        skillTags: item.skillTags,
        sourceRepositoryUrl: 'https://github.com/Tribe-Block-University',
        sourcePath: `${item.slug}/README.md`,
        sourceProvider: 'github',
        sourceSyncEnabled: true,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        modules: {
          deleteMany: {},
          create: moduleData(item),
        },
      },
      create: {
        ...courseData,
        hasProProject: true,
        sourceRepositoryUrl: 'https://github.com/Tribe-Block-University',
        sourcePath: `${item.slug}/README.md`,
        sourceProvider: 'github',
        sourceSyncEnabled: true,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        modules: {
          create: moduleData(item),
        },
      },
    });
  }
}

async function seedCareerPaths() {
  const paths = [
    {
      slug: 'frontend-developer',
      title: 'Frontend Developer',
      description: 'Build accessible, responsive interfaces and modern React applications.',
      courses: ['learn-html', 'learn-css', 'learn-javascript', 'learn-typescript', 'learn-react'],
    },
    {
      slug: 'backend-developer',
      title: 'Backend Developer',
      description: 'Design APIs, services, databases, and dependable server-side applications.',
      courses: ['learn-javascript', 'learn-python', 'learn-sql', 'backend-apis-with-node'],
    },
    {
      slug: 'full-stack-developer',
      title: 'Full Stack Developer',
      description: 'Connect frontend interfaces to backend services and databases.',
      courses: ['learn-html', 'learn-css', 'learn-javascript', 'learn-react', 'backend-apis-with-node', 'learn-sql'],
    },
    {
      slug: 'web3-developer',
      title: 'Web3 Developer',
      description: 'Build blockchain-aware applications, stablecoin payments, and on-chain credentials.',
      courses: ['learn-javascript', 'learn-typescript', 'backend-apis-with-node', 'celo-usdt-payments'],
    },
    {
      slug: 'data-scientist',
      title: 'Data Scientist',
      description: 'Use Python, SQL, and analysis workflows to turn data into useful insight.',
      courses: ['learn-python', 'learn-sql', 'data-science-with-python'],
    },
  ];

  for (const [sortOrder, path] of paths.entries()) {
    const careerPath = await prisma.careerPath.upsert({
      where: { slug: path.slug },
      update: {
        title: path.title,
        description: path.description,
        sortOrder,
      },
      create: {
        slug: path.slug,
        title: path.title,
        description: path.description,
        sortOrder,
      },
    });

    for (const [courseOrder, slug] of path.courses.entries()) {
      const linkedCourse = await prisma.course.findUniqueOrThrow({ where: { slug } });

      await prisma.pathCourse.upsert({
        where: { careerPathId_courseId: { careerPathId: careerPath.id, courseId: linkedCourse.id } },
        update: { sortOrder: courseOrder },
        create: {
          careerPathId: careerPath.id,
          courseId: linkedCourse.id,
          sortOrder: courseOrder,
        },
      });
    }
  }
}

async function seedBadges() {
  const badges = [
    ['first-lesson', 'First Lesson', 'Completed your first Tribe Block lesson.'],
    ['practice-streak', 'Practice Streak', 'Practiced coding across multiple learning sessions.'],
    ['project-builder', 'Project Builder', 'Completed a guided Plus or Pro build-a-project challenge.'],
  ] as const;

  for (const [slug, title, description] of badges) {
    await prisma.badge.upsert({
      where: { slug },
      update: { title, description },
      create: { slug, title, description },
    });
  }
}

function course(
  slug: string,
  title: string,
  subtitle: string,
  description: string,
  category: string,
  tag: string,
  runtime: ExerciseRuntime,
): SeedCourse {
  return {
    slug,
    title,
    subtitle,
    description,
    category,
    level: CourseLevel.BEGINNER,
    visibility: ContentVisibility.FREE,
    isFreeBasic: true,
    estimatedHours: 8,
    languageTags: [tag],
    skillTags: ['Programming fundamentals', 'Practice exercises'],
    runtime,
  };
}

function moduleData(item: SeedCourse) {
  return [
    {
      title: `${item.languageTags[0]} Foundations`,
      summary: `Learn the core ideas behind ${item.title}.`,
      sortOrder: 1,
      lessons: {
        create: [
          lessonData(item, 'getting-started', `Getting Started with ${item.languageTags[0]}`, 1, ContentVisibility.FREE),
          lessonData(item, 'core-patterns', `Core ${item.languageTags[0]} Patterns`, 2, item.visibility),
        ],
      },
      projects: {
        create: [
          {
            slug: `${item.slug}-project`,
            title: `${item.title} Build Project`,
            briefMarkdown: `Create a small portfolio-ready project that uses the key ideas from ${item.title}.`,
            runtime: item.runtime,
            starterFiles: starterFiles(item),
            rubric: {
              correctness: 40,
              codeQuality: 30,
              userExperience: 20,
              reflection: 10,
            },
            visibility: ContentVisibility.PLUS,
            sortOrder: 1,
          },
        ],
      },
    },
  ];
}

function lessonData(
  item: SeedCourse,
  slug: string,
  title: string,
  sortOrder: number,
  visibility: ContentVisibility,
) {
  return {
    slug,
    title,
    summary: `A guided lesson for ${item.title}.`,
    bodyMarkdown: [
      `# ${title}`,
      '',
      `In this lesson, you will learn practical ${item.languageTags[0]} ideas through short explanations and guided practice.`,
      '',
      '## Learning goals',
      '',
      '- Understand the key vocabulary',
      '- Read working examples',
      '- Practice the concept in the IDE',
      '- Check your work with automated tests',
    ].join('\n'),
    visibility,
    sortOrder,
    estimatedMinutes: 25,
    assets: {
      create: [
        {
          type: AssetType.PDF,
          title: `${title} Cheatsheet`,
          url: `/assets/cheatsheets/${item.slug}-${slug}.pdf`,
          license: 'Original Tribe Block University material',
          sortOrder: 1,
        },
      ],
    },
    quizzes: {
      create: [
        {
          title: `${title} Checkpoint`,
          passingScore: 70,
          questions: {
            create: [
              {
                type: QuestionType.MULTIPLE_CHOICE,
                prompt: `What is the main goal of this ${item.languageTags[0]} lesson?`,
                options: ['Memorize syntax only', 'Practice concepts through examples', 'Skip exercises'],
                correctAnswer: ['Practice concepts through examples'],
                explanation: 'The platform is designed around learning by practicing.',
                sortOrder: 1,
              },
            ],
          },
        },
      ],
    },
    exercises: {
      create: [
        {
          slug: `${slug}-practice`,
          title: `${title} Practice`,
          instructions: `Use the starter files to complete a small ${item.languageTags[0]} exercise.`,
          runtime: item.runtime,
          starterFiles: starterFiles(item),
          visibility,
          sortOrder: 1,
          tests: {
            create: [
              {
                name: 'Required output exists',
                assertion: 'The submitted files include the requested solution.',
                isHidden: false,
                sortOrder: 1,
              },
            ],
          },
        },
      ],
    },
  };
}

function starterFiles(item: SeedCourse) {
  if (item.runtime === ExerciseRuntime.BROWSER_HTML_CSS_JS) {
    return {
      'index.html': '<main id="app">Build your solution here.</main>',
      'style.css': 'body { font-family: system-ui, sans-serif; }',
      'script.js': 'console.log("Tribe Block University");',
    };
  }

  if (item.runtime === ExerciseRuntime.PYTHON) {
    return { 'main.py': 'print("Tribe Block University")\n' };
  }

  if (item.runtime === ExerciseRuntime.SQL) {
    return { 'query.sql': 'SELECT 1 AS ready;\n' };
  }

  return { 'main.txt': 'Write your solution here.\n' };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
