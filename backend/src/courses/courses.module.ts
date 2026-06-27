import { Module } from '@nestjs/common';
import { CourseSyncService } from './course-sync.service';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CourseSyncService],
  exports: [CoursesService, CourseSyncService],
})
export class CoursesModule {}
