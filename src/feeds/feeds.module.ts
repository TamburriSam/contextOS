import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { ArticlesModule } from '../articles/articles.module';
import { AnalysisModule } from '../analysis/analysis.module'; 

@Module({
  imports: [
    ArticlesModule,
    AnalysisModule, 
  ],
  providers: [FeedsService],
  controllers: [FeedsController],
})
export class FeedsModule {}
