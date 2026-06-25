import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ContributorExperienceLevel } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContributorsService } from './contributors.service';

class ContributorApplicationDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  githubUsername: string;

  @IsString()
  walletAddress: string;

  @IsString()
  country: string;

  @IsString()
  @IsOptional()
  discordUsername?: string;

  @IsString()
  @IsOptional()
  twitterHandle?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  interests: string[];

  @IsEnum(ContributorExperienceLevel)
  experienceLevel: ContributorExperienceLevel;

  @IsString()
  @IsOptional()
  portfolioUrl?: string;

  @IsBoolean()
  agreementReviewed: boolean;

  @IsBoolean()
  agreementRewards: boolean;
}

@Controller('contributors')
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Get('guide')
  contributionGuide() {
    return this.contributorsService.getContributionGuide();
  }

  @Post('applications')
  createApplication(@Body() dto: ContributorApplicationDto) {
    return this.contributorsService.createApplication(dto);
  }

  @Get('rewards')
  rewardsDashboard(@Query('githubUsername') githubUsername?: string, @Query('walletAddress') walletAddress?: string) {
    return this.contributorsService.getRewardsDashboard({ githubUsername, walletAddress });
  }
}
