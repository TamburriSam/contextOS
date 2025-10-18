import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('articles')
export class ArticlesController {
  constructor(private prisma: PrismaService) {}

  // GET /articles/latest?limit=25
  @Get('latest')
  async latest(@Query('limit') limit = '25') {
    const take = Math.max(1, Math.min(200, Number(limit)));
    return this.prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take,
      include: {
        emotion: true,
        source: true,
      },
    });
  }

  // GET /articles/search?q=Zelensky&limit=50
  // src/articles/articles.controller.ts
  @Get('search')
  async search(@Query('q') q = '', @Query('limit') limit = '50') {
    const take = Math.max(1, Math.min(200, Number(limit)));
    const query = (q ?? '').trim();

    return this.prisma.article.findMany({
      where: query ? { title: { contains: query } } : {},
      orderBy: { publishedAt: 'desc' },
      take,
      include: { emotion: true, source: true },
    });
  }

  // GET /articles/:id
  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        emotion: true,
        source: true,
      },
    });
  }
}
