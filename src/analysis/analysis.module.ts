import { Module } from '@nestjs/common';
import { EmotionService } from './emotion.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmotionService],
  exports: [EmotionService],
})
export class AnalysisModule {}