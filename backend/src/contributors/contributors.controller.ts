import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ContributorExperienceLevel } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContributorsService } from './contributors.service';

class ConfirmRewardClaimDto {
  @IsString()
  transactionHash: string;
}

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

  @Post('github/webhook')
  githubWebhook(
    @Body() payload: Record<string, any>,
    @Headers('x-github-event') event?: string,
    @Headers('x-hub-signature-256') signature?: string,
    @Req() request?: { rawBody?: Buffer },
  ) {
    return this.contributorsService.syncGithubPullRequestWebhook({
      event,
      signature,
      rawBody: request?.rawBody,
      payload,
    });
  }

  @Get('rewards')
  rewardsDashboard(@Query('githubUsername') githubUsername?: string, @Query('walletAddress') walletAddress?: string) {
    return this.contributorsService.getRewardsDashboard({ githubUsername, walletAddress });
  }

  @Patch('rewards/:rewardId/claim-confirmation')
  confirmRewardClaim(@Param('rewardId') rewardId: string, @Body() dto: ConfirmRewardClaimDto) {
    return this.contributorsService.confirmRewardClaim(rewardId, dto.transactionHash);
  }
}
