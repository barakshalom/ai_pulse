import type { Digest } from "./types";

// Sample digest used as a fallback when no real digest has been generated yet
// (e.g. first run before the cron job has executed).
export const MOCK_DIGEST: Digest = {
  date: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  cards: [
    {
      id: "mock-0",
      category: "industry",
      company: "anthropic",
      title: "Claude Opus 4.8 released with improved reasoning",
      summary:
        "Anthropic announced Claude Opus 4.8, citing gains on reasoning and coding benchmarks. The release is rolling out across the API and Claude apps.",
      sources: [{ name: "Anthropic", url: "https://www.anthropic.com/news" }],
      verified: true,
      publishedAt: new Date().toISOString(),
      isNew: true,
    },
    {
      id: "mock-1",
      category: "industry",
      company: "openai",
      title: "Rumors of a new large training run",
      summary:
        "A single report suggests OpenAI may have started a new large-scale training run. No official confirmation has been made yet.",
      sources: [{ name: "TechCrunch AI", url: "https://techcrunch.com" }],
      verified: false,
      verificationNote: "Reported by a single outlet, not yet confirmed by OpenAI.",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      category: "industry",
      company: "google",
      title: "Gemini update rolls out to Workspace",
      summary:
        "Google began rolling out an updated Gemini model integration across Workspace apps, with improved multimodal capabilities.",
      sources: [
        { name: "Google DeepMind", url: "https://deepmind.google/blog" },
        { name: "The Verge AI", url: "https://www.theverge.com" },
      ],
      verified: true,
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-3",
      category: "industry",
      company: "xai",
      title: "Grok adds real-time data integration",
      summary:
        "xAI announced new real-time data integration features for Grok, available to premium subscribers.",
      sources: [{ name: "xAI", url: "https://x.ai/blog" }],
      verified: true,
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-4",
      category: "industry",
      company: "other",
      title: "Mistral previews new open-weight model",
      summary:
        "Mistral previewed an upcoming open-weight model release, positioning it as a competitor to leading proprietary models.",
      sources: [
        { name: "VentureBeat AI", url: "https://venturebeat.com" },
        { name: "Hacker News", url: "https://news.ycombinator.com" },
      ],
      verified: true,
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-5",
      category: "security",
      company: "google",
      product: "Chrome",
      title: "Google's AI agent finds new Chrome zero-day",
      summary:
        "Google's autonomous vulnerability-research agent identified a previously unknown memory-safety bug in Chrome before it was exploited in the wild. A patch has been released in the latest stable update.",
      sources: [
        { name: "Google Project Zero", url: "https://googleprojectzero.blogspot.com" },
        { name: "The Hacker News", url: "https://thehackernews.com" },
      ],
      verified: true,
      publishedAt: new Date().toISOString(),
      isNew: true,
    },
    {
      id: "mock-6",
      category: "security",
      company: "other",
      product: "Windows",
      title: "Critical Windows zero-day actively exploited",
      summary:
        "Microsoft confirmed a critical privilege-escalation vulnerability in Windows is being actively exploited in the wild. An out-of-band patch is being rolled out via Windows Update.",
      sources: [{ name: "BleepingComputer", url: "https://www.bleepingcomputer.com" }],
      verified: true,
      publishedAt: new Date().toISOString(),
      isNew: true,
    },
    {
      id: "mock-7",
      category: "security",
      company: "other",
      product: "iPhone",
      title: "iOS update patches zero-click iMessage exploit",
      summary:
        "Apple released an iOS update patching a zero-click vulnerability in iMessage that researchers say was used in targeted spyware attacks. Users are urged to update immediately.",
      sources: [{ name: "The Hacker News", url: "https://thehackernews.com" }],
      verified: false,
      verificationNote: "Reported by a single outlet, not yet independently confirmed by Apple.",
      publishedAt: new Date().toISOString(),
    },
  ],
};
