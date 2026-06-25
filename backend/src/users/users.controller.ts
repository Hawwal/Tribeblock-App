import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { UsersService } from './users.service';

class CurrencyDto {
  @IsEnum(Currency)
  currency: Currency;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.usersService.findById(user.id);
  }

  @Get(':handle/public-profile')
  publicProfile(@Param('handle') handle: string) {
    return this.usersService.publicProfile(handle);
  }

  @Patch('me/currency')
  updateCurrency(@CurrentUser() user: RequestUser, @Body() dto: CurrencyDto) {
    return this.usersService.updateCurrency(user.id, dto.currency);
  }
}
