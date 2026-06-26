import { Body, Controller, Get, Post } from '@nestjs/common';
import { BillingInterval, Currency } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { SubscriptionsService } from './subscriptions.service';

class CheckoutDto {
  @IsString()
  planId: string;

  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @IsEnum(Currency)
  currency: Currency;

  @IsString()
  @IsOptional()
  couponCode?: string;
}

class CouponPreviewDto {
  @IsString()
  planId: string;

  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @IsString()
  couponCode: string;
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

  @Post('coupons/preview')
  previewCoupon(@Body() dto: CouponPreviewDto) {
    return this.subscriptionsService.previewCoupon(dto);
  }
}
