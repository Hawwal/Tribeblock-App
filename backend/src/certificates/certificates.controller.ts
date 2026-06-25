import { Controller, Get, Param, Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { CertificatesService } from './certificates.service';

class CertificateRequestDto {
  @IsString()
  @IsOptional()
  walletAddress?: string;
}

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('me')
  mine(@CurrentUser() user: RequestUser) {
    return this.certificatesService.forUser(user.id);
  }

  @Post('courses/:courseId/request')
  request(@CurrentUser() user: RequestUser, @Param('courseId') courseId: string, @Body() dto: CertificateRequestDto) {
    return this.certificatesService.requestCertificate(user.id, courseId, dto.walletAddress);
  }

  @Get('verify/:certificateNumber')
  verify(@Param('certificateNumber') certificateNumber: string) {
    return this.certificatesService.verify(certificateNumber);
  }

  @Get('metadata/:certificateNumber')
  metadata(@Param('certificateNumber') certificateNumber: string) {
    return this.certificatesService.metadata(certificateNumber);
  }
}
