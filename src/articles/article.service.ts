
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

    
    thumbUrl?: string;
    thumbSource?: string; 
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
        
        thumbUrl: p.thumbUrl,
        thumbSource: p.thumbSource,
      },
      create: {
        externalId,
        title: p.title,
        url: p.url,
        outlet: p.outlet,
        region: p.region,
        publishedAt: p.publishedAt,
        sourceId: p.sourceId,
        
        thumbUrl: p.thumbUrl,
        thumbSource: p.thumbSource,
      },
    });
  }

  latest(limit = 25) {
    return this.prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        emotion: true,
        source: true,
      },
    });
  }

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
