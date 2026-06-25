import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContributorApplicationStatus,
  ContributorContributionStatus,
  ContributorExperienceLevel,
  ContributorRewardStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const contributorSkills = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'React Native',
  'Node.js',
  'Solidity',
  'Smart Contracts',
  'UI/UX Design',
  'Technical Writing',
  'Documentation',
  'Course Development',
  'Quality Assurance',
  'Other',
];

export const contributorInterests = [
  'Create New Courses',
  'Create New Lessons',
  'Update Existing Lessons',
  'Fix Errors',
  'Improve Documentation',
  'Review Community Contributions',
  'Translate Course Content',
];

type CreateContributorApplicationInput = {
  fullName: string;
  email: string;
  githubUsername: string;
  walletAddress: string;
  country: string;
  discordUsername?: string;
  twitterHandle?: string;
  skills: string[];
  interests: string[];
  experienceLevel: ContributorExperienceLevel;
  portfolioUrl?: string;
  agreementReviewed: boolean;
  agreementRewards: boolean;
};

type UpdateContributorApplicationInput = {
  status: ContributorApplicationStatus;
  adminNotes?: string;
};

type RewardsDashboardInput = {
  githubUsername?: string;
  walletAddress?: string;
};

@Injectable()
export class ContributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  createApplication(input: CreateContributorApplicationInput) {
    if (!input.agreementReviewed || !input.agreementRewards) {
      throw new BadRequestException('Both contributor agreements are required.');
    }

    return this.prisma.contributorApplication.create({
      data: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        githubUsername: this.normalizeHandle(input.githubUsername),
        walletAddress: this.normalizeWallet(input.walletAddress),
        country: input.country.trim(),
        discordUsername: this.optionalTrim(input.discordUsername),
        twitterHandle: this.optionalTrim(input.twitterHandle),
        skills: input.skills,
        interests: input.interests,
        experienceLevel: input.experienceLevel,
        portfolioUrl: this.optionalTrim(input.portfolioUrl),
        agreementReviewed: input.agreementReviewed,
        agreementRewards: input.agreementRewards,
      },
    });
  }

  listApplications(status?: ContributorApplicationStatus) {
    return this.prisma.contributorApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  updateApplication(id: string, input: UpdateContributorApplicationInput) {
    return this.prisma.contributorApplication.update({
      where: { id },
      data: {
        status: input.status,
        adminNotes: this.optionalTrim(input.adminNotes),
      },
    });
  }

  getContributionGuide() {
    return {
      repositoryUrl: 'https://github.com/Tribe-Block-University',
      foundationSourceUrl: 'https://developer.mozilla.org/en-US/',
      workflow: [
        'Course or lesson content is submitted through GitHub.',
        'Admin and mentor reviewers review the submission.',
        'Approved changes are merged into the course repository.',
        'Merged content is synced into the platform in lesson, quiz, IDE, and project format.',
        'Approved contributors are eligible for the Teaching Commission Program.',
      ],
      accessModel: {
        free: [
          'Foundational programming lessons',
          'Learning modules',
          'IDE practicals',
          'Quizzes and exams',
          'Fundamental course badges',
        ],
        plus: [
          'Guided project-based learning',
          'Structured IDE checkpoints',
          'Real-world application builds',
        ],
        pro: ['NFT certificates', 'Mentor review workflow', 'Advanced credential proof'],
      },
      skills: contributorSkills,
      interests: contributorInterests,
      courseTemplate: {
        folderStructure: [
          'Course Name/README.md',
          'Course Name/lesson-1/lesson.md',
          'Course Name/lesson-2/lesson.md',
          'Course Name/lesson-3/lesson.md',
        ],
        fields: [
          'Course Title',
          'Short Description',
          'Difficulty Level',
          'Prerequisites',
          'Learning Outcomes',
          'Estimated Completion Time',
        ],
      },
      lessonTemplate: [
        'Lesson Title',
        'Objective',
        'Detailed Explanation',
        'Multiple Code Examples',
        'Step-by-step IDE Practice Tasks',
        'Expected Outputs',
        'Hints',
        'Validation Checks',
        'Additional Resources',
      ],
      rewardCategories: [
        'New course',
        'New lesson',
        'Major course expansion',
        'Lesson improvement',
        'Documentation improvement',
        'Example enhancement',
        'Bug fix',
        'Platform improvement',
        'IDE improvement',
        'Content review',
        'Course validation',
        'Translation contribution',
      ],
    };
  }

  async getRewardsDashboard(input: RewardsDashboardInput) {
    const githubUsername = input.githubUsername ? this.normalizeHandle(input.githubUsername) : undefined;
    const walletAddress = input.walletAddress ? this.normalizeWallet(input.walletAddress) : undefined;

    const lookup = [
      ...(githubUsername ? [{ githubUsername }] : []),
      ...(walletAddress ? [{ walletAddress }] : []),
    ];

    const contributor = await this.prisma.contributorApplication.findFirst({
      where: lookup.length ? { OR: lookup } : undefined,
      include: {
        contributions: { orderBy: { createdAt: 'desc' } },
        rewards: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contributor) {
      return {
        contributor: null,
        contributions: [],
        rewards: [],
        totals: {
          approvedContributions: 0,
          pendingContributions: 0,
          totalRewardsGd: '0',
          paidRewardsGd: '0',
          pendingRewardsGd: '0',
        },
        goodDollar: this.goodDollarConfig(),
      };
    }

    const totalRewards = contributor.rewards.reduce((total, reward) => total + Number(reward.amountGd), 0);
    const paidRewards = contributor.rewards
      .filter((reward) => reward.status === ContributorRewardStatus.PAID)
      .reduce((total, reward) => total + Number(reward.amountGd), 0);

    return {
      contributor: {
        id: contributor.id,
        fullName: contributor.fullName,
        githubUsername: contributor.githubUsername,
        walletAddress: contributor.walletAddress,
        status: contributor.status,
      },
      contributions: contributor.contributions,
      rewards: contributor.rewards,
      totals: {
        approvedContributions: contributor.contributions.filter((item) =>
          item.status === ContributorContributionStatus.APPROVED || item.status === ContributorContributionStatus.REWARDED,
        ).length,
        pendingContributions: contributor.contributions.filter((item) => item.status === ContributorContributionStatus.PENDING_REVIEW).length,
        totalRewardsGd: totalRewards.toFixed(2),
        paidRewardsGd: paidRewards.toFixed(2),
        pendingRewardsGd: (totalRewards - paidRewards).toFixed(2),
      },
      goodDollar: this.goodDollarConfig(),
    };
  }

  async seedDemoContribution(applicationId: string) {
    const contributor = await this.prisma.contributorApplication.findUniqueOrThrow({ where: { id: applicationId } });

    const contribution = await this.prisma.contributorContribution.create({
      data: {
        contributorId: contributor.id,
        githubUsername: contributor.githubUsername,
        repositoryUrl: 'https://github.com/Tribe-Block-University',
        pullRequestUrl: 'https://github.com/Tribe-Block-University/course-content/pulls',
        title: 'Approved lesson contribution',
        contributionType: 'Lesson improvement',
        status: ContributorContributionStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    return this.prisma.contributorReward.create({
      data: {
        contributorId: contributor.id,
        contributionId: contribution.id,
        amountGd: '25',
        status: ContributorRewardStatus.READY,
        walletAddress: contributor.walletAddress,
        tokenAddress: this.config.get<string>('GOODDOLLAR_TOKEN_ADDRESS'),
        chainId: this.config.get<number>('GOODDOLLAR_CHAIN_ID'),
        notes: 'Demo reward record. Replace with GitHub webhook and payout automation in production.',
      },
      include: { contribution: true, contributor: true },
    });
  }

  private normalizeHandle(value: string) {
    return value.trim().replace(/^@/, '');
  }

  private normalizeWallet(value: string) {
    const wallet = value.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      throw new BadRequestException('A valid Celo wallet address is required for G$ rewards.');
    }

    return wallet;
  }

  private optionalTrim(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private goodDollarConfig() {
    return {
      tokenSymbol: 'G$',
      tokenAddress: this.config.get<string>('GOODDOLLAR_TOKEN_ADDRESS') ?? null,
      chainId: this.config.get<number>('GOODDOLLAR_CHAIN_ID') ?? 42220,
      distributionMode: 'admin-reviewed payout',
    };
  }
}
