import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/request-user';
import { AccessService } from './access.service';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('courses/:courseId')
  courseAccess(@CurrentUser() user: RequestUser, @Param('courseId') courseId: string) {
    return this.accessService.courseAccessReport(user.id, courseId);
  }
}
