import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdeService {
  constructor(private readonly prisma: PrismaService) {}

  getDraft(userId: string, exerciseId: string) {
    return this.prisma.codeDraft.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
    });
  }

  saveDraft(userId: string, exerciseId: string, files: Record<string, string>) {
    return this.prisma.codeDraft.upsert({
      where: { userId_exerciseId: { userId, exerciseId } },
      create: { userId, exerciseId, files },
      update: { files },
    });
  }

  recordAttempt(userId: string, exerciseId: string, files: Record<string, string>) {
    return this.prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId,
        submittedFiles: files,
        passed: false,
        testResults: {
          status: 'queued',
          note: 'Sandbox execution worker will grade this attempt in the next phase.',
        },
      },
    });
  }
}
