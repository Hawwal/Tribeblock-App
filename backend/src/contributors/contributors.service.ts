import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { createPublicClient, decodeEventLog, http, parseUnits } from 'viem';
import {
  ContributorApplicationStatus,
  ContributorContributionStatus,
  ContributorExperienceLevel,
  ContributorRewardStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseSyncService } from '../courses/course-sync.service';

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

type GithubWebhookInput = {
  event?: string;
  signature?: string;
  rawBody?: Buffer;
  payload: Record<string, any>;
};

const goodDollarRewardsVaultAbi = [
  {
    name: 'RewardClaimed',
    type: 'event',
    inputs: [
      { name: 'rewardHash', type: 'bytes32', indexed: true },
      { name: 'rewardId', type: 'string', indexed: false },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

@Injectable()
export class ContributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly courseSync: CourseSyncService,
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

  async syncGithubPullRequestWebhook(input: GithubWebhookInput) {
    this.verifyGithubWebhook(input.signature, input.rawBody);

    if (input.event && input.event !== 'pull_request') {
      return { ignored: true, reason: 'Only pull_request events are synced.' };
    }

    const pullRequest = input.payload.pull_request;

    if (!pullRequest) {
      throw new BadRequestException('GitHub pull_request payload is required.');
    }

    const githubUsername = this.normalizeHandle(pullRequest.user?.login ?? '');
    const contributor = githubUsername
      ? await this.prisma.contributorApplication.findFirst({ where: { githubUsername }, orderBy: { createdAt: 'desc' } })
      : null;
    const merged = input.payload.action === 'closed' && pullRequest.merged === true;
    const status = merged ? ContributorContributionStatus.APPROVED : ContributorContributionStatus.PENDING_REVIEW;
    const pullRequestUrl = pullRequest.html_url as string | undefined;

    if (!githubUsername || !pullRequestUrl) {
      throw new BadRequestException('GitHub webhook is missing contributor username or pull request URL.');
    }

    const contributionType = this.githubContributionType(pullRequest.labels);
    const data = {
      contributorId: contributor?.id,
      githubUsername,
      repositoryUrl: input.payload.repository?.html_url ?? 'https://github.com/Tribe-Block-University',
      pullRequestUrl,
      commitSha: pullRequest.merge_commit_sha ?? pullRequest.head?.sha,
      title: pullRequest.title ?? 'GitHub pull request contribution',
      contributionType,
      status,
      approvedAt: merged ? new Date() : undefined,
    };

    const existing = await this.prisma.contributorContribution.findFirst({ where: { pullRequestUrl } });
    const contribution = existing
      ? await this.prisma.contributorContribution.update({ where: { id: existing.id }, data, include: { contributor: true, rewards: true } })
      : await this.prisma.contributorContribution.create({ data, include: { contributor: true, rewards: true } });

    const courseSyncEnabled = this.config.get<boolean>('GITHUB_COURSE_SYNC_ENABLED') ?? true;
    let courseSyncResult: unknown = null;
    let courseSyncError: string | null = null;

    if (merged && courseSyncEnabled) {
      try {
        courseSyncResult = await this.courseSync.syncRepositoryFromWebhook(input.payload);
      } catch (error) {
        courseSyncError = error instanceof Error ? error.message : 'GitHub course sync failed.';
      }
    }

    return {
      ignored: false,
      merged,
      matchedContributor: Boolean(contributor),
      contribution,
      courseSync: courseSyncResult,
      courseSyncError,
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

  async confirmRewardClaim(rewardId: string, transactionHash: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      throw new BadRequestException('A valid G$ claim transaction hash is required.');
    }

    const reward = await this.prisma.contributorReward.findUniqueOrThrow({
      where: { id: rewardId },
      include: { contribution: true },
    });

    if (reward.status === ContributorRewardStatus.PAID) {
      return reward;
    }

    if (reward.status !== ContributorRewardStatus.READY) {
      throw new BadRequestException('This reward is not ready to claim yet.');
    }

    const vaultAddress = this.config.get<string>('GOODDOLLAR_REWARDS_VAULT_ADDRESS');

    if (!vaultAddress) {
      throw new BadRequestException('G$ rewards vault is not configured yet.');
    }

    const rpcUrl = this.config.get<string>('CELO_RPC_URL') ?? 'https://forno.celo.org';
    const decimals = this.config.get<number>('GOODDOLLAR_DECIMALS') ?? 18;
    const expectedAmount = parseUnits(reward.amountGd.toString(), decimals);
    const client = createPublicClient({ transport: http(rpcUrl) });
    const hash = transactionHash as `0x${string}`;

    try {
      const [transaction, receipt] = await Promise.all([
        client.getTransaction({ hash }),
        client.getTransactionReceipt({ hash }),
      ]);

      if (receipt.status !== 'success') {
        throw new BadRequestException('G$ claim transaction was found but did not succeed on-chain.');
      }

      if (!transaction.to || transaction.to.toLowerCase() !== vaultAddress.toLowerCase()) {
        throw new BadRequestException('G$ claim transaction was not sent to the configured rewards vault.');
      }

      const claimEvent = receipt.logs
        .filter((log) => log.address.toLowerCase() === vaultAddress.toLowerCase())
        .map((log) => {
          try {
            return decodeEventLog({
              abi: goodDollarRewardsVaultAbi,
              data: log.data,
              topics: log.topics,
            });
          } catch {
            return null;
          }
        })
        .find((event) => {
          if (!event || event.eventName !== 'RewardClaimed') return false;
          return (
            event.args.rewardId === reward.id &&
            event.args.recipient.toLowerCase() === reward.walletAddress.toLowerCase() &&
            event.args.amount === expectedAmount
          );
        });

      if (!claimEvent || claimEvent.eventName !== 'RewardClaimed') {
        throw new BadRequestException('G$ claim event did not match this reward, wallet, and amount.');
      }

      const updatedReward = await this.prisma.contributorReward.update({
        where: { id: reward.id },
        data: {
          status: ContributorRewardStatus.PAID,
          transactionHash,
          notes: this.appendNote(reward.notes, 'G$ claim verified on Celo block ' + receipt.blockNumber.toString() + '.'),
        },
      });

      if (reward.contributionId) {
        await this.prisma.contributorContribution.update({
          where: { id: reward.contributionId },
          data: { status: ContributorContributionStatus.REWARDED },
        });
      }

      return updatedReward;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Unable to verify G$ claim on Celo yet. Try again after the transaction confirms.');
    }
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
        notes: 'Demo reward record. Prepare this reward in the G$ vault before contributor claim testing.',
      },
      include: { contribution: true, contributor: true },
    });
  }

  private verifyGithubWebhook(signature?: string, rawBody?: Buffer) {
    const secret = this.config.get<string>('GITHUB_WEBHOOK_SECRET');

    if (!secret) return;

    if (!signature || !rawBody) {
      throw new UnauthorizedException('GitHub webhook signature is required.');
    }

    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
      throw new UnauthorizedException('GitHub webhook signature is invalid.');
    }
  }

  private githubContributionType(labels?: Array<{ name?: string }>) {
    const rewardLabel = labels?.find((label) => label.name?.toLowerCase().startsWith('tribeblock:reward:'));
    const type = rewardLabel?.name?.split(':').slice(2).join(':').trim();
    return type || 'GitHub pull request';
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

  private appendNote(existing: string | null, note: string) {
    return existing ? existing + ' ' + note : note;
  }

  private goodDollarConfig() {
    return {
      tokenSymbol: 'G$',
      tokenAddress: this.config.get<string>('GOODDOLLAR_TOKEN_ADDRESS') ?? null,
      vaultAddress: this.config.get<string>('GOODDOLLAR_REWARDS_VAULT_ADDRESS') ?? null,
      chainId: this.config.get<number>('GOODDOLLAR_CHAIN_ID') ?? 42220,
      decimals: this.config.get<number>('GOODDOLLAR_DECIMALS') ?? 18,
      distributionMode: 'vault claim',
    };
  }
}
