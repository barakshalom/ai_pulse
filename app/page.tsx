import { Feed } from "@/components/Feed";
import { NotificationSetup } from "@/components/NotificationSetup";
import { getLatestDigest } from "@/lib/kv";
import { MOCK_DIGEST } from "@/lib/mockDigest";

export const dynamic = "force-dynamic";

export default async function Home() {
  const digest = (await getLatestDigest()) ?? MOCK_DIGEST;
  const isMock = digest === MOCK_DIGEST;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <header className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">AI Pulse</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Daily AI news from Anthropic, OpenAI, Google, xAI &amp; emerging players —
              plus AI-driven security vulnerability research
            </p>
          </div>
          <NotificationSetup />
        </div>
        {isMock && (
          <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Showing sample data. The real digest will appear here once the daily cron job runs.
          </p>
        )}
      </header>

      <Feed cards={digest.cards} />
    </div>
  );
}
