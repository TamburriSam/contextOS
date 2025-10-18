import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ArticlesModule } from './articles/articles.module';
import { FeedsModule } from './feeds/feeds.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ✅ do this once at root
    PrismaModule,
    ArticlesModule,
    AnalysisModule,
    FeedsModule,
  ],
})
export class AppModule {}