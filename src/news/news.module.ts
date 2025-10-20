import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ArticlesService } from '../articles/article.service';
import { EmotionService } from '../analysis/emotion.service';
import { ClusterService } from '../analysis/cluster.service';

@Module({
  controllers: [NewsController],
  providers: [
    NewsService,
    PrismaService,
    ArticlesService,
    EmotionService,
    ClusterService,
  ],
})
export class NewsModule {}
