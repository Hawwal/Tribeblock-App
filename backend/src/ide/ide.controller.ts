import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsObject } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/request-user';
import { IdeService } from './ide.service';

class FilesDto {
  @IsObject()
  files: Record<string, string>;
}

@Controller('ide')
export class IdeController {
  constructor(private readonly ideService: IdeService) {}

  @Get('exercises/:exerciseId/draft')
  draft(@CurrentUser() user: RequestUser, @Param('exerciseId') exerciseId: string) {
    return this.ideService.getDraft(user.id, exerciseId);
  }

  @Patch('exercises/:exerciseId/draft')
  saveDraft(@CurrentUser() user: RequestUser, @Param('exerciseId') exerciseId: string, @Body() dto: FilesDto) {
    return this.ideService.saveDraft(user.id, exerciseId, dto.files);
  }

  @Post('exercises/:exerciseId/attempts')
  submit(@CurrentUser() user: RequestUser, @Param('exerciseId') exerciseId: string, @Body() dto: FilesDto) {
    return this.ideService.recordAttempt(user.id, exerciseId, dto.files);
  }
}
