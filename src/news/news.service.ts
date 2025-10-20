// src/news/news.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArticlesService } from '../articles/article.service';
import { EmotionService } from '../analysis/emotion.service';
import { ClusterService } from '../analysis/cluster.service';

@Injectable()
export class NewsService {
  constructor(
    private prisma: PrismaService,
    private articles: ArticlesService,
    private emotion: EmotionService,
    private clusterer: ClusterService,
  ) {}

  // Build clusters from the most recent N articles
  async refreshClusters({ recentLimit = 200, topN = 10, pool = 60 } = {}) {
    const recent = await this.articles.latest(recentLimit);
    // enrich + dedupe
    const enriched = this.clusterer.enrich(
      recent.map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        source: a.outlet,
        published: a.publishedAt,
        summary: '', // <- no summary in DB
        score: 1, // <- simple constant; used only for sorting in-memory
      })),
    );
    const deduped = this.clusterer.dedupe(enriched);

    const top = [...deduped].slice(0, topN);
    const poolSet = deduped.slice(0, pool);
    const groups = this.clusterer.cluster(poolSet);

    // persist snapshot
    const snapshot = await this.prisma.clusterSnapshot.create({
      data: {
        label: 'snapshot', // not shown; clusters carry their own label
        keywords: '',
        size: 0,
      },
    });

    for (const g of groups) {
      const label = g.label || 'topic';
      const keywords = g.keywords.join(',');
      const size = g.size;

      const row = await this.prisma.clusterSnapshot.create({
        data: { label, keywords, size, createdAt: snapshot.createdAt },
      });

      for (const id of g.ids) {
        const art = poolSet[id];
        // recompute emotion from title to attach (or read from article.emotion)
        // You *already* saved emotion per article, so pull it if present:
        const existing = recent.find((r) => r.id === art.id)?.emotion;
        const e = existing ?? this.emotion.scoreHeadline(art.title);

        await this.prisma.clusterItem.create({
          data: {
            snapshotId: row.id,
            articleId: art.id,
            fear: e.fear,
            anger: e.anger,
            joy: e.joy,
            hope: e.hope,
            neutral: e.neutral,
          },
        });
      }
    }

    return this.getLatestClusters();
  }

  async getLatestTop(limit = 10) {
    // Top = newest with highest recency (you can change ordering rule)
    return this.prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { emotion: true, source: true },
    });
  }

  async getLatestClusters() {
    // get latest snapshot time
    const last = await this.prisma.clusterSnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!last) return [];

    // fetch all snapshots created at that same timestamp (one per cluster)
    const clusters = await this.prisma.clusterSnapshot.findMany({
      where: { createdAt: last.createdAt },
      orderBy: { size: 'desc' },
    });

    const items = await this.prisma.clusterItem.findMany({
      where: { snapshotId: { in: clusters.map((c) => c.id) } },
      include: { article: { include: { emotion: true, source: true } } },
    });

    // group
    const byId = new Map(
      clusters.map((c) => [c.id, { ...c, articles: [] as any[] }]),
    );
    for (const it of items) {
      const c = byId.get(it.snapshotId)!;
      c.articles.push({
        id: it.articleId,
        title: it.article.title,
        url: it.article.url,
        source: it.article.outlet,
        published: it.article.publishedAt,
        score: 1,
        keywords: (it.article as any).keywords?.split(',') ?? [],
        emotion: {
          fear: it.fear,
          anger: it.anger,
          joy: it.joy,
          hope: it.hope,
          neutral: it.neutral,
        },
      });
    }

    // sort articles within each cluster by recency/score
    const result = [...byId.values()].map((c) => ({
      id: c.id,
      label: c.label,
      size: c.size,
      keywords: c.keywords.split(',').filter(Boolean),
      articles: c.articles.sort(
        (a, b) =>
          new Date(b.published).getTime() - new Date(a.published).getTime(),
      ),
    }));
    return result;
  }
}
