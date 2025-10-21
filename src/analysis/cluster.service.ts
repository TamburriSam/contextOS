import { Injectable } from '@nestjs/common';
import stringSimilarity from 'string-similarity';


const KEYWORDS_PER_DOC = 12;
const CLUSTER_SIMILARITY_THRESHOLD = 0.28; 
const DUPLICATE_TITLE_SIMILARITY = 0.8; 


export type ArticleForClustering = {
  id: string;
  title: string;
  url: string;
  summary?: string;
  score?: number; 
  keywords?: string[]; 
};

export type ClusterGroup = {
  ids: number[]; 
  label: string; 
  keywords: string[]; 
  size: number; 
};


function normalizeWhitespace(text: string): string {
  return (text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeIntoKeywords(text: string): string[] {
  const clean = normalizeWhitespace(text).toLowerCase();
  const tokens = clean.match(/[a-z][a-z\-']+/g) || [];
  return tokens.filter((w) => w.length >= 3);
}

function extractTopKeywords(text: string, k = KEYWORDS_PER_DOC): string[] {
  const freq: Record<string, number> = {};
  for (const t of tokenizeIntoKeywords(text)) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([w]) => w);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size || 1;
  return intersection / union;
}

function areNearDuplicateTitles(
  a: { title: string; url: string },
  b: { title: string; url: string },
): boolean {
  try {
    const aPath = new URL(a.url).pathname.split('/').slice(0, 3).join('/');
    const bPath = new URL(b.url).pathname.split('/').slice(0, 3).join('/');
    if (aPath === bPath) return true;
  } catch {}
  return (
    stringSimilarity.compareTwoStrings(a.title, b.title) >=
    DUPLICATE_TITLE_SIMILARITY
  );
}

@Injectable()
export class ClusterService {
  enrich(items: ArticleForClustering[]): Required<ArticleForClustering>[] {
    return items.map((item) => ({
      ...item,
      summary: item.summary ?? '',
      keywords:
        item.keywords && item.keywords.length
          ? item.keywords
          : extractTopKeywords(`${item.title} ${item.summary ?? ''}`),
      score: item.score ?? 1,
    })) as Required<ArticleForClustering>[];
  }

  dedupe<T extends { title: string; url: string; score?: number }>(
    items: T[],
  ): T[] {
    const sorted = [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const unique: T[] = [];
    for (const candidate of sorted) {
      const isDup = unique.some((kept) =>
        areNearDuplicateTitles(kept, candidate),
      );
      if (!isDup) unique.push(candidate);
    }
    return unique;
  }

  cluster(
    items: { keywords?: string[] }[],
    threshold = CLUSTER_SIMILARITY_THRESHOLD,
  ): ClusterGroup[] {
    const keywordSets = items.map((it) => new Set(it.keywords || []));
    const groups: { ids: number[]; keywordUnion: Set<string> }[] = [];

    for (let i = 0; i < items.length; i++) {
      let placed = false;
      for (const g of groups) {
        const anyMemberIndex = g.ids[0];
        if (
          jaccardSimilarity(keywordSets[i], keywordSets[anyMemberIndex]) >=
          threshold
        ) {
          g.ids.push(i);
          keywordSets[i].forEach((w) => g.keywordUnion.add(w));
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups.push({ ids: [i], keywordUnion: new Set(keywordSets[i]) });
      }
    }

    return groups
      .map((g) => {
        const freq: Record<string, number> = {};
        for (const idx of g.ids) {
          for (const w of items[idx].keywords || [])
            freq[w] = (freq[w] || 0) + 1;
        }
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        const topWords = sorted.slice(0, 5).map(([w]) => w);
        return {
          ids: g.ids,
          label: topWords.slice(0, 3).join(' • '),
          keywords: topWords,
          size: g.ids.length,
        };
      })
      .sort((a, b) => b.size - a.size);
  }
}
