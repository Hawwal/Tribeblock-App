import { Injectable, NotFoundException } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        handle: true,
        role: true,
        preferredCurrency: true,
        avatarUrl: true,
        bio: true,
        isPublicProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async publicProfile(handle: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: {
        displayName: true,
        handle: true,
        avatarUrl: true,
        bio: true,
        badges: { include: { badge: true } },
        certificates: {
          where: { status: 'MINTED' },
          include: { course: { select: { title: true, slug: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found.');
    }

    return user;
  }

  updateCurrency(id: string, preferredCurrency: Currency) {
    return this.prisma.user.update({
      where: { id },
      data: { preferredCurrency },
      select: {
        id: true,
        preferredCurrency: true,
      },
    });
  }
}
