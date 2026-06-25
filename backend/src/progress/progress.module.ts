import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [AccessModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
