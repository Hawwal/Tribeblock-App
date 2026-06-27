import { Module } from '@nestjs/common';
import { ContributorsModule } from '../contributors/contributors.module';
import { CoursesModule } from '../courses/courses.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GithubOrgService } from './github-org.service';

@Module({
  imports: [ContributorsModule, CoursesModule],
  controllers: [AdminController],
  providers: [AdminService, GithubOrgService],
})
export class AdminModule {}
