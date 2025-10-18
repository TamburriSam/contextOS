import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  private hash(s: string) {
    return crypto.createHash('sha1').update(s).digest('hex');
  }

  ensureSource(name: string, rssUrl: string, region?: string) {
    return this.prisma.source.upsert({
      where: { rssUrl },
      update: { name, region },
      create: { name, region, rssUrl },
    });
  }

  upsertArticle(p: {
    sourceId: string;
    outlet: string;
    region?: string;
    title: string;
    url: string;
    publishedAt: Date;
    externalId?: string;
  }) {
    const externalId = p.externalId ?? this.hash(p.url);
    return this.prisma.article.upsert({
      where: { externalId_sourceId: { externalId, sourceId: p.sourceId } },
      update: {
        title: p.title,
        url: p.url,
        outlet: p.outlet,
        region: p.region,
        publishedAt: p.publishedAt,
        ingestedAt: new Date(),
      },
      create: {
        externalId,
        title: p.title,
        url: p.url,
        outlet: p.outlet,
        region: p.region,
        publishedAt: p.publishedAt,
        sourceId: p.sourceId,
      },
    });
  }

  latest(limit = 25) {
    return this.prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        emotion: true, // 👈 this joins the related ArticleEmotion row
        source: true,
      },
    });
  }

  // 👇 Add this at the bottom
  async upsertEmotion(
    articleId: string,
    scores: {
      fear: number;
      anger: number;
      joy: number;
      hope: number;
      neutral: number;
    },
  ) {
    return this.prisma.articleEmotion.upsert({
      where: { articleId },
      update: scores,
      create: { articleId, ...scores },
    });
  }
}
