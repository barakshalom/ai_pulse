import Parser from "rss-parser";
import { HN_ALGOLIA_URL, NEWS_FEEDS, OFFICIAL_FEEDS, SECURITY_FEEDS } from "./sources";
import type { RawItem } from "./types";

const parser = new Parser();

// The cron runs twice a day (08:00 and 18:00 UTC), 10h and 14h apart. Use the
// longer gap as the lookback window so nothing is missed between runs.
const LOOKBACK_MS = 14 * 60 * 60 * 1000;

async function fetchFeed(name: string, url: string): Promise<RawItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).map((item) => ({
      title: item.title ?? "",
      link: item.link ?? "",
      sourceName: name,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      summary: (item.contentSnippet ?? item.content ?? "").slice(0, 500),
    }));
  } catch (err) {
    console.error(`Failed to fetch feed ${name} (${url}):`, err);
    return [];
  }
}

interface HNHit {
  title: string;
  url: string | null;
  created_at: string;
  story_text: string | null;
  objectID: string;
}

async function fetchHackerNews(): Promise<RawItem[]> {
  try {
    const res = await fetch(HN_ALGOLIA_URL, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { hits: HNHit[] };
    return data.hits.map((hit) => ({
      title: hit.title,
      link: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
      sourceName: "Hacker News",
      publishedAt: hit.created_at,
      summary: hit.story_text?.slice(0, 500) ?? "",
    }));
  } catch (err) {
    console.error("Failed to fetch Hacker News:", err);
    return [];
  }
}

function isWithinLookback(publishedAt: string): boolean {
  const ts = new Date(publishedAt).getTime();
  if (Number.isNaN(ts)) return true; // keep items with unparseable dates rather than drop them
  return Date.now() - ts <= LOOKBACK_MS;
}

/**
 * Fetches all configured RSS feeds plus Hacker News, returning raw items
 * published since the previous cron run.
 */
export async function fetchAllNews(): Promise<RawItem[]> {
  const feeds = [...OFFICIAL_FEEDS, ...NEWS_FEEDS, ...SECURITY_FEEDS];

  const results = await Promise.all([
    ...feeds.map((feed) => fetchFeed(feed.name, feed.url)),
    fetchHackerNews(),
  ]);

  return results.flat().filter((item) => item.title && isWithinLookback(item.publishedAt));
}
