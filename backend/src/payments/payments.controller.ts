import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { PaymentsService } from './payments.service';

class ConfirmCeloPaymentDto {
  @IsString()
  transactionHash: string;
}

class VerifyPaymentDto {
  @IsIn(['CONFIRMED', 'FAILED'])
  status: 'CONFIRMED' | 'FAILED';

  @IsString()
  @IsOptional()
  note?: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':reference')
  findByReference(@Param('reference') reference: string) {
    return this.paymentsService.findByReference(reference);
  }

  @Patch(':reference/celo-confirmation')
  confirmCeloPayment(@Param('reference') reference: string, @Body() dto: ConfirmCeloPaymentDto) {
    return this.paymentsService.attachCeloTransaction(reference, dto.transactionHash);
  }

  @Patch(':reference/verification')
  verifyPayment(@CurrentUser() user: RequestUser, @Param('reference') reference: string, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(user.id, reference, dto.status, dto.note);
  }
}
