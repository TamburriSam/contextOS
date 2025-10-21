import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ArticlesModule } from './articles/articles.module';
import { FeedsModule } from './feeds/feeds.module';
import { AnalysisModule } from './analysis/analysis.module';
import { NewsModule } from './news/news.module'; 

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    PrismaModule,
    ArticlesModule,
    AnalysisModule,
    FeedsModule,
    NewsModule, 
  ],
})
export class AppModule {}