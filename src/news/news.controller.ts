
import {
  Controller,
  Get,
  Post,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Post('refresh')
  async refresh(
    @Headers('x-api-key') key?: string,
    @Query('recentLimit') recentLimit?: string,
    @Query('top') top?: string,
    @Query('pool') pool?: string,
  ) {
    if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY)
      throw new UnauthorizedException();
    return this.news.refreshClusters({
      recentLimit: Number(recentLimit) || 200,
      topN: Number(top) || 10,
      pool: Number(pool) || 60,
    });
  }

  @Get('top')
  top(@Query('limit') limit = '10') {
    return this.news.getLatestTop(Number(limit));
  }

  @Get('clusters')
  clusters() {
    return this.news.getLatestClusters();
  }
}
