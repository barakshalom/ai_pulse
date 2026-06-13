import Anthropic from "@anthropic-ai/sdk";
import type { Digest, NewsCard, RawItem } from "./types";

const MODEL = "claude-haiku-4-5";

const DIGEST_TOOL = {
  name: "submit_digest",
  description: "Submit the structured daily AI news digest.",
  input_schema: {
    type: "object" as const,
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["industry", "security"],
              description:
                "'security' for stories about newly disclosed security vulnerabilities, zero-days, CVEs, or exploits affecting widely-used products/platforms (Windows, macOS, iOS, Android, Chrome/browsers, Linux, major enterprise software, etc.), whether or not AI was involved in finding them. 'industry' for general AI model/company news.",
            },
            company: {
              type: "string",
              enum: ["anthropic", "openai", "google", "xai", "other"],
              description:
                "Which company this story is primarily about. For 'security' stories, use the AI company involved in finding the vulnerability if any (e.g. Google for a Big Sleep finding), otherwise 'other'. Use 'other' for emerging/new players or third-party tools not in the main four.",
            },
            product: {
              type: "string",
              description:
                "Required when category is 'security': the affected product/platform, e.g. 'Windows', 'Chrome', 'macOS', 'iOS', 'Android', 'Linux'. Omit for 'industry' stories.",
            },
            title: { type: "string", description: "Short headline, max ~12 words." },
            summary: {
              type: "string",
              description: "2-3 sentence plain-language summary of the development.",
            },
            sourceLinks: {
              type: "array",
              items: { type: "string" },
              description: "URLs of the source articles that support this story (from the input items).",
            },
            verified: {
              type: "boolean",
              description:
                "True if the claim is corroborated by 2+ independent sources, OR is reported directly by the relevant company's own blog. False if it relies on a single secondary source, rumor, or speculation.",
            },
            verificationNote: {
              type: "string",
              description:
                "Required when verified is false: a short note explaining why (e.g. 'Reported by a single outlet, not yet confirmed by Anthropic'). Omit or leave empty when verified is true.",
            },
            publishedAt: {
              type: "string",
              description: "ISO 8601 timestamp of the most recent source for this story.",
            },
          },
          required: ["category", "company", "title", "summary", "sourceLinks", "verified", "publishedAt"],
        },
      },
    },
    required: ["cards"],
  },
};

const SYSTEM_PROMPT = `You are a news editor producing a recurring briefing with two beats:

1. AI industry news: developments from Anthropic, OpenAI, Google (Gemini/DeepMind), xAI (Grok), and any new/emerging players in the field.
2. Security vulnerabilities: newly disclosed zero-days, CVEs, and exploits affecting widely-used products and platforms (Windows, macOS, iOS/iPhone, Android, Chrome/browsers, Linux, major enterprise software, etc.) - regardless of whether AI was involved in finding them.

You will be given:
- A list of stories already reported in the previous update (title and source links), so you can avoid duplicates.
- A list of raw news items (title, link, source, published date, short snippet) gathered from official company blogs, general AI news outlets, and security news outlets since the previous update.

Your job:
1. Cluster items that refer to the same underlying story/event together into a single card.
2. Skip any story that is substantially the same as one already reported in the previous update, unless there's a significant new development - in that case, create a new card describing just the update.
3. Write a clear, concise headline and 2-3 sentence summary for each story.
4. Classify each story's category:
   - 'security' for newly disclosed vulnerabilities/zero-days/exploits in widely-used products or platforms.
   - 'industry' for general AI model/company news.
5. For 'security' stories, set 'product' to the affected product/platform (e.g. 'Windows', 'Chrome', 'macOS', 'iOS', 'Android', 'Linux'). Omit 'product' for 'industry' stories.
6. Classify each story by company (anthropic/openai/google/xai/other - use 'other' for emerging players like Mistral, Meta AI, DeepSeek, third-party security tools/startups, or when no AI company is relevant).
7. Fact-check each story:
   - Mark verified=true if the story appears in 2+ independent sources in the input, OR comes from the relevant company's own official blog.
   - Mark verified=false if it relies on a single secondary source, a rumor, speculation, or an opinion piece - and explain why in verificationNote.
8. Skip items that are not meaningfully about AI model/company developments or notable security vulnerabilities in major products (ignore generic tech news, ads, unrelated content).
9. If there is genuinely nothing new to report, return an empty cards array.

Be conservative with the "verified" flag - when in doubt, mark it unverified and explain the gap.`;

interface ClaudeCard {
  category: NewsCard["category"];
  company: NewsCard["company"];
  product?: string;
  title: string;
  summary: string;
  sourceLinks: string[];
  verified: boolean;
  verificationNote?: string;
  publishedAt: string;
}

function safeHostname(link: string): string {
  try {
    return new URL(link).hostname;
  } catch {
    return "source";
  }
}

function buildSourceLookup(items: RawItem[]): Map<string, RawItem> {
  const map = new Map<string, RawItem>();
  for (const item of items) {
    if (item.link) map.set(item.link, item);
  }
  return map;
}

export async function generateDigest(items: RawItem[], previousCards: NewsCard[] = []): Promise<Digest> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const carryOver: NewsCard[] = previousCards.map((card) => ({ ...card, isNew: false }));

  if (items.length === 0) {
    return { date, generatedAt: now.toISOString(), cards: carryOver };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not configured; skipping digest generation.");
    return { date, generatedAt: now.toISOString(), cards: carryOver };
  }

  const client = new Anthropic();

  const previousStories = previousCards.map((card) => ({
    title: card.title,
    sourceLinks: card.sources.map((source) => source.url),
  }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [DIGEST_TOOL],
    tool_choice: { type: "tool", name: "submit_digest" },
    messages: [
      {
        role: "user",
        content: `Stories already reported in the previous update (avoid duplicating these unless there's a significant new development):\n\n${JSON.stringify(
          previousStories,
          null,
          2
        )}\n\nHere are the raw news items since the previous update:\n\n${JSON.stringify(
          items,
          null,
          2
        )}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { date, generatedAt: now.toISOString(), cards: carryOver };
  }

  const { cards = [] } = toolUse.input as { cards?: ClaudeCard[] };
  const sourceLookup = buildSourceLookup(items);

  const newsCards: NewsCard[] = cards.map((card, index) => ({
    id: `${date}-${now.getTime()}-${index}`,
    category: card.category,
    company: card.company,
    product: card.category === "security" ? card.product : undefined,
    title: card.title,
    summary: card.summary,
    sources: card.sourceLinks.map((link) => ({
      name: sourceLookup.get(link)?.sourceName ?? safeHostname(link),
      url: link,
    })),
    verified: card.verified,
    verificationNote: card.verified ? undefined : card.verificationNote,
    publishedAt: card.publishedAt,
    isNew: true,
  }));

  return { date, generatedAt: now.toISOString(), cards: [...newsCards, ...carryOver] };
}
