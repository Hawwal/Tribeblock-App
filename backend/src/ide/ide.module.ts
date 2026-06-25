import { Module } from '@nestjs/common';
import { IdeController } from './ide.controller';
import { IdeService } from './ide.service';

@Module({
  controllers: [IdeController],
  providers: [IdeService],
})
export class IdeModule {}
