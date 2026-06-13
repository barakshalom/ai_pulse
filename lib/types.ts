export type Company = "anthropic" | "openai" | "google" | "xai" | "other";

export type Category = "industry" | "security";

export interface NewsSource {
  name: string;
  url: string;
}

export interface NewsCard {
  id: string;
  category: Category;
  company: Company;
  /** For 'security' cards: the affected product/platform, e.g. "Windows", "Chrome", "iOS". */
  product?: string;
  title: string;
  summary: string;
  sources: NewsSource[];
  verified: boolean;
  verificationNote?: string;
  publishedAt: string;
  /** True if this card was newly added in the most recent update. */
  isNew?: boolean;
}

export interface Digest {
  date: string;
  generatedAt: string;
  cards: NewsCard[];
}

export interface RawItem {
  title: string;
  link: string;
  sourceName: string;
  publishedAt: string;
  summary: string;
}
