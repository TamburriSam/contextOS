import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { ArticlesModule } from '../articles/articles.module';
import { AnalysisModule } from '../analysis/analysis.module'; // ✅ import this

@Module({
  imports: [
    ArticlesModule,
    AnalysisModule, // ✅ now FeedsModule sees EmotionService
  ],
  providers: [FeedsService],
  controllers: [FeedsController],
})
export class FeedsModule {}
