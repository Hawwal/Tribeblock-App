import { Module } from '@nestjs/common';
import { ContributorsModule } from '../contributors/contributors.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ContributorsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
