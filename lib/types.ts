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
  title: string;
  summary: string;
  sources: NewsSource[];
  verified: boolean;
  verificationNote?: string;
  publishedAt: string;
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
