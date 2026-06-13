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
                "'security' for stories about AI/LLM systems or agents being used to discover, triage, or exploit software vulnerabilities (e.g. AI-found zero-days, autonomous bug-hunting agents, AI in CTFs/bug bounties). 'industry' for general AI model/company news.",
            },
            company: {
              type: "string",
              enum: ["anthropic", "openai", "google", "xai", "other"],
              description:
                "Which company this story is primarily about (or whose model/tooling was used, for security stories). Use 'other' for emerging/new players or third-party tools not in the main four.",
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

const SYSTEM_PROMPT = `You are a news editor producing a daily briefing on developments in AI, focused on Anthropic, OpenAI, Google (Gemini/DeepMind), xAI (Grok), and any new/emerging players in the field. You also track a second beat: AI being used to find security vulnerabilities (autonomous bug-hunting agents, AI-found zero-days/CVEs, AI in CTFs or bug bounties, LLM-assisted vulnerability research).

You will be given a list of raw news items (title, link, source, published date, short snippet) gathered from official company blogs, general AI news outlets, and security news outlets over the last 24 hours.

Your job:
1. Cluster items that refer to the same underlying story/event together into a single card.
2. Write a clear, concise headline and 2-3 sentence summary for each story.
3. Classify each story's category:
   - 'security' if it's about AI/LLM systems or agents discovering, triaging, or exploiting software vulnerabilities.
   - 'industry' for general AI model/company news.
4. Classify each story by company (anthropic/openai/google/xai/other - use 'other' for emerging players like Mistral, Meta AI, DeepSeek, or third-party security tools/startups).
5. Fact-check each story:
   - Mark verified=true if the story appears in 2+ independent sources in the input, OR comes from the relevant company's own official blog.
   - Mark verified=false if it relies on a single secondary source, a rumor, speculation, or an opinion piece - and explain why in verificationNote.
6. Skip items that are not meaningfully about AI model/company developments or AI-driven security vulnerability research (ignore generic tech news, ads, unrelated security news with no AI angle).
7. If there is genuinely nothing newsworthy, return an empty cards array.

Be conservative with the "verified" flag - when in doubt, mark it unverified and explain the gap.`;

interface ClaudeCard {
  category: NewsCard["category"];
  company: NewsCard["company"];
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

export async function generateDigest(items: RawItem[]): Promise<Digest> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  if (items.length === 0) {
    return { date, generatedAt: now.toISOString(), cards: [] };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not configured; skipping digest generation.");
    return { date, generatedAt: now.toISOString(), cards: [] };
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [DIGEST_TOOL],
    tool_choice: { type: "tool", name: "submit_digest" },
    messages: [
      {
        role: "user",
        content: `Here are the raw news items from the last 24 hours:\n\n${JSON.stringify(
          items,
          null,
          2
        )}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { date, generatedAt: now.toISOString(), cards: [] };
  }

  const { cards = [] } = toolUse.input as { cards?: ClaudeCard[] };
  const sourceLookup = buildSourceLookup(items);

  const newsCards: NewsCard[] = cards.map((card, index) => ({
    id: `${date}-${index}`,
    category: card.category,
    company: card.company,
    title: card.title,
    summary: card.summary,
    sources: card.sourceLinks.map((link) => ({
      name: sourceLookup.get(link)?.sourceName ?? safeHostname(link),
      url: link,
    })),
    verified: card.verified,
    verificationNote: card.verified ? undefined : card.verificationNote,
    publishedAt: card.publishedAt,
  }));

  return { date, generatedAt: now.toISOString(), cards: newsCards };
}
