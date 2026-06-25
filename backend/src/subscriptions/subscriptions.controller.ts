import { Body, Controller, Get, Post } from '@nestjs/common';
import { BillingInterval, Currency } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { SubscriptionsService } from './subscriptions.service';

class CheckoutDto {
  @IsString()
  planId: string;

  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @IsEnum(Currency)
  currency: Currency;
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  plans() {
    return this.subscriptionsService.listPlans();
  }

  @Get('me')
  current(@CurrentUser() user: RequestUser) {
    return this.subscriptionsService.currentForUser(user.id);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: RequestUser, @Body() dto: CheckoutDto) {
    return this.subscriptionsService.startCheckout(user.id, dto);
  }
}
