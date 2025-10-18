import { Controller, Post, Get, Query } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { ArticlesService } from '../articles/article.service';

@Controller('feeds')
export class FeedsController {
  constructor(private feeds: FeedsService, private articles: ArticlesService) {}

  @Post('ingest-now')
  ingestNow() { return this.feeds.ingestNow(); }

  @Get('latest')
  latest(@Query('limit') limit = '25') {
    return this.articles.latest(Number(limit));
  }
}