export interface FeedConfig {
  name: string;
  url: string;
}

// Official company blogs - treated as authoritative single-source-is-enough.
// Anthropic and xAI don't publish a public RSS feed, so we fall back to a
// Google News search scoped to their site/brand (also free, no key needed).
export const OFFICIAL_FEEDS: FeedConfig[] = [
  { name: "Anthropic", url: googleNewsFeed("site:anthropic.com") },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { name: "xAI", url: googleNewsFeed("xAI OR Grok") },
];

// General AI news outlets - used for corroboration and catching emerging players.
export const NEWS_FEEDS: FeedConfig[] = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
];

// Security vulnerability news - newly disclosed zero-days, CVEs, and exploits
// in widely-used products/platforms (Windows, macOS, iOS, Android, browsers,
// etc.), whether or not AI was involved in finding them.
export const SECURITY_FEEDS: FeedConfig[] = [
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "Google Project Zero", url: "https://googleprojectzero.blogspot.com/feeds/posts/default" },
  {
    name: "Vulnerability News",
    url: googleNewsFeed(
      "zero-day OR vulnerability OR CVE Windows OR macOS OR iOS OR iPhone OR Android OR Chrome OR browser"
    ),
  },
];

function googleNewsFeed(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    `${query} when:2d`
  )}&hl=en-US&gl=US&ceid=US:en`;
}

// Hacker News Algolia search API - free, no key required.
export const HN_SEARCH_QUERY = "AI OR LLM OR Anthropic OR OpenAI OR Gemini OR Grok";
export const HN_ALGOLIA_URL = `https://hn.algolia.com/api/v1/search_by_date?tags=story&query=${encodeURIComponent(
  HN_SEARCH_QUERY
)}`;
