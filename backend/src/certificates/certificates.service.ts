import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CertificateStatus, ProgressStatus, SubscriptionTier } from '@prisma/client';
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  defineChain,
  http,
  isAddress,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AccessService } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';

const certificateContractAbi = [
  {
    name: 'mintCertificate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'student', type: 'address' },
      { name: 'certificateNumber', type: 'string' },
      { name: 'metadataUri', type: 'string' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'CertificateMinted',
    type: 'event',
    inputs: [
      { name: 'student', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'certificateNumber', type: 'string', indexed: false },
      { name: 'metadataUri', type: 'string', indexed: false },
    ],
  },
] as const;

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: AccessService,
    private readonly config: ConfigService,
  ) {}

  forUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { id: true, slug: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestCertificate(userId: string, courseId: string, walletAddress?: string) {
    const [tier, user, course] = await Promise.all([
      this.accessService.currentTier(userId),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, handle: true },
      }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          slug: true,
          title: true,
          modules: { select: { lessons: { select: { id: true } } } },
        },
      }),
    ]);

    if (!user || !course) {
      throw new NotFoundException('User or course not found.');
    }

    if (tier !== SubscriptionTier.PRO) {
      throw new ForbiddenException('NFT certificates require an active Pro subscription.');
    }

    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { userId, lessonId: { in: lessonIds }, status: ProgressStatus.COMPLETED },
    });

    if (lessonIds.length === 0 || completedLessons < lessonIds.length) {
      throw new ForbiddenException('Complete every course lesson before requesting a certificate.');
    }

    const issuedAt = new Date();
    const certificateNumber = `TBU-${course.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${Date.now()
      .toString(36)
      .toUpperCase()}`;
    const verificationUrl = this.publicUrl(`/certificates/${certificateNumber}`);
    const metadataUri = this.publicUrl(`/api/certificates/metadata/${certificateNumber}`);

    const certificate = await this.prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        certificateNumber,
        status: CertificateStatus.MINTING,
        metadataUri,
        nftChainId: this.config.get<number>('CELO_CHAIN_ID') ?? 42220,
        nftContract: this.config.get<string>('CELO_CERTIFICATE_CONTRACT_ADDRESS'),
        verificationUrl,
        issuedAt,
      },
      update: {
        metadataUri,
        verificationUrl,
        issuedAt,
        status: CertificateStatus.MINTING,
        nftContract: this.config.get<string>('CELO_CERTIFICATE_CONTRACT_ADDRESS'),
        nftChainId: this.config.get<number>('CELO_CHAIN_ID') ?? 42220,
      },
      include: { course: { select: { id: true, slug: true, title: true } } },
    });

    await this.awardBadge(userId, 'project-builder');

    const mintedCertificate = await this.mintIfConfigured(certificate.id, walletAddress).catch(() => null);

    return {
      ...(mintedCertificate ?? certificate),
      metadata: this.metadataFor(certificate.certificateNumber, user.displayName, course.title, certificate.verificationUrl),
    };
  }

  verify(certificateNumber: string) {
    return this.prisma.certificate.findUniqueOrThrow({
      where: { certificateNumber },
      include: {
        user: { select: { displayName: true, handle: true } },
        course: { select: { title: true, slug: true } },
      },
    });
  }

  async metadata(certificateNumber: string) {
    const certificate = await this.verify(certificateNumber);

    return this.metadataFor(
      certificate.certificateNumber,
      certificate.user.displayName,
      certificate.course.title,
      certificate.verificationUrl,
    );
  }

  private metadataFor(certificateNumber: string, studentName: string, courseTitle: string, verificationUrl: string | null) {
    return {
      name: `Tribe Block University Certificate - ${courseTitle}`,
      description: `${studentName} completed ${courseTitle} at Tribe Block University.`,
      external_url: verificationUrl,
      attributes: [
        { trait_type: 'Issuer', value: 'Tribe Block University' },
        { trait_type: 'Course', value: courseTitle },
        { trait_type: 'Certificate Number', value: certificateNumber },
        { trait_type: 'Credential Type', value: 'Course Completion' },
      ],
    };
  }

  private publicUrl(path: string) {
    const baseUrl =
      this.config.get<string>('CERTIFICATE_PUBLIC_BASE_URL') ??
      this.config.get<string>('FRONTEND_ORIGIN') ??
      'http://127.0.0.1:5173';

    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }

  private async mintIfConfigured(certificateId: string, studentWalletCandidate?: string | null) {
    const contractAddress = this.config.get<string>('CELO_CERTIFICATE_CONTRACT_ADDRESS');
    const minterPrivateKey = this.config.get<string>('CERTIFICATE_MINTER_PRIVATE_KEY');
    const rpcUrl = this.config.get<string>('CELO_RPC_URL') ?? 'https://forno.celo.org';

    if (!contractAddress || !minterPrivateKey || !studentWalletCandidate || !isAddress(studentWalletCandidate)) {
      return null;
    }

    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: { select: { displayName: true } },
        course: { select: { title: true } },
      },
    });

    if (!certificate || certificate.status === CertificateStatus.MINTED) {
      return certificate;
    }

    const privateKey = minterPrivateKey.startsWith('0x') ? minterPrivateKey : `0x${minterPrivateKey}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const chain = defineChain({
      id: this.config.get<number>('CELO_CHAIN_ID') ?? 42220,
      name: 'Celo',
      nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });
    const transport = http(rpcUrl);
    const publicClient = createPublicClient({ chain, transport });
    const walletClient = createWalletClient({ account, chain, transport });

    const hash = await walletClient.writeContract({
      address: contractAddress as Address,
      abi: certificateContractAbi,
      functionName: 'mintCertificate',
      args: [
        studentWalletCandidate as Address,
        certificate.certificateNumber,
        certificate.metadataUri ?? this.publicUrl(`/api/certificates/metadata/${certificate.certificateNumber}`),
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const mintLog = receipt.logs
      .map((log) => {
        try {
          return decodeEventLog({ abi: certificateContractAbi, data: log.data, topics: log.topics });
        } catch {
          return null;
        }
      })
      .find((log) => log?.eventName === 'CertificateMinted');
    const tokenId = mintLog?.args?.tokenId?.toString();

    return this.prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.MINTED,
        nftContract: contractAddress,
        nftChainId: this.config.get<number>('CELO_CHAIN_ID') ?? 42220,
        nftTokenId: tokenId,
        transactionHash: hash,
      },
      include: { course: { select: { id: true, slug: true, title: true } } },
    });
  }

  private async awardBadge(userId: string, slug: string) {
    const badge = await this.prisma.badge.findUnique({ where: { slug } });

    if (!badge) return;

    await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });
  }
}
