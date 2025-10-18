import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Parser from 'rss-parser';
import { ArticlesService } from '../articles/article.service'; // keep this path if your file is article.service.ts
import { EmotionService } from '../analysis/emotion.service';

type FeedDef = { name: string; rssUrl: string; region?: string };

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  private parser = new Parser();

  private feeds: FeedDef[] = [
    // General / World News
    {
      name: 'BBC News',
      rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
      region: 'US',
    },
    { name: 'CNN', rssUrl: 'http://rss.cnn.com/rss/edition.rss', region: 'US' },
    {
      name: 'Reuters',
      rssUrl: 'http://feeds.reuters.com/Reuters/worldNews',
      region: 'US',
    },
    {
      name: 'The Guardian',
      rssUrl: 'https://www.theguardian.com/world/rss',
      region: 'US',
    },
    {
      name: 'Al Jazeera',
      rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
      region: 'US',
    },
    {
      name: 'Associated Press',
      rssUrl: 'https://apnews.com/rss',
      region: 'US',
    },
    {
      name: 'NPR News',
      rssUrl: 'https://feeds.npr.org/1001/rss.xml',
      region: 'US',
    },
    {
      name: 'DW News',
      rssUrl: 'https://rss.dw.com/rdf/rss-en-all',
      region: 'US',
    },
    {
      name: 'Politico',
      rssUrl: 'https://www.politico.com/rss/politics08.xml',
      region: 'US',
    },
    {
      name: 'NY Times',
      rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      region: 'US',
    },

    // Technology & Startups
    {
      name: 'TechCrunch',
      rssUrl: 'http://feeds.feedburner.com/TechCrunch/',
      region: 'US',
    },
    { name: 'Wired', rssUrl: 'https://www.wired.com/feed/rss', region: 'US' },
    {
      name: 'The Verge',
      rssUrl: 'https://www.theverge.com/rss/index.xml',
      region: 'US',
    },
    {
      name: 'Ars Technica',
      rssUrl: 'http://feeds.arstechnica.com/arstechnica/index/',
      region: 'US',
    },
    {
      name: 'Mashable',
      rssUrl: 'http://feeds.mashable.com/Mashable',
      region: 'US',
    },
    {
      name: 'Hacker News',
      rssUrl: 'https://news.ycombinator.com/rss',
      region: 'US',
    },
    {
      name: 'Product Hunt',
      rssUrl: 'https://www.producthunt.com/feed',
      region: 'US',
    },
    {
      name: 'Engadget',
      rssUrl: 'https://www.engadget.com/rss.xml',
      region: 'US',
    },
    {
      name: 'VentureBeat',
      rssUrl: 'https://venturebeat.com/feed/',
      region: 'US',
    },
    { name: 'Gizmodo', rssUrl: 'https://gizmodo.com/rss', region: 'US' },

    // Business & Finance
    {
      name: 'Bloomberg',
      rssUrl: 'https://www.bloomberg.com/feed/podcast/etf-report.xml',
      region: 'US',
    },
    {
      name: 'Forbes',
      rssUrl: 'https://www.forbes.com/business/feed/',
      region: 'US',
    },
    {
      name: 'CNBC',
      rssUrl: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
      region: 'US',
    },
    {
      name: 'Financial Times',
      rssUrl: 'https://www.ft.com/?format=rss',
      region: 'US',
    },
    {
      name: 'The Economist',
      rssUrl: 'https://www.economist.com/latest/rss.xml',
      region: 'US',
    },
    {
      name: 'Harvard Business Review',
      rssUrl: 'https://hbr.org/feed',
      region: 'US',
    },
    {
      name: 'MarketWatch',
      rssUrl: 'https://www.marketwatch.com/rss/topstories',
      region: 'US',
    },
    {
      name: 'Wall Street Journal',
      rssUrl: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
      region: 'US',
    },
    {
      name: 'Business Insider',
      rssUrl: 'https://www.businessinsider.com/rss',
      region: 'US',
    },
    {
      name: 'Investopedia',
      rssUrl:
        'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_articles',
      region: 'US',
    },
  ];

  constructor(
    private articles: ArticlesService,
    private emotion: EmotionService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async ingestHourly() {
    this.logger.log('Hourly ingest start');
    let scanned = 0;

    for (const feed of this.feeds) {
      try {
        const source = await this.articles.ensureSource(
          feed.name,
          feed.rssUrl,
          feed.region,
        );
        const parsed = await this.parser.parseURL(feed.rssUrl);

        for (const item of parsed.items.slice(0, 10)) {
          scanned++;

          try {
            const title = (item.title ?? '').trim();
            const url = (item.link ?? '').trim();
            if (!title || !url) continue;

            const extId = (item.guid ?? url).trim();
            const pub = item.isoDate ? new Date(item.isoDate) : new Date();

            // upsert article
            const saved = await this.articles.upsertArticle({
              sourceId: source.id,
              outlet: feed.name,
              region: feed.region,
              title,
              url,
              publishedAt: pub,
              externalId: extId,
            });

            // analyze emotion with VADER and persist ONLY the five numeric fields
            const s = this.emotion.scoreHeadline(title);
            await this.articles.upsertEmotion(saved.id, {
              fear: s.fear,
              anger: s.anger,
              joy: s.joy,
              hope: s.hope,
              neutral: s.neutral,
            });
          } catch (itemErr: any) {
            this.logger.warn(
              `Item skipped in ${feed.name}: ${itemErr?.message ?? itemErr}`,
            );
            continue;
          }
        }
      } catch (e: any) {
        this.logger.error(`Feed ${feed.name} failed: ${e?.message ?? e}`);
      }
    }

    this.logger.log(`Hourly ingest done; scanned ${scanned}`);
    return { scanned };
  }

  ingestNow() {
    return this.ingestHourly();
  }
}
