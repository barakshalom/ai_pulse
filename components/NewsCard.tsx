import type { NewsCard as NewsCardType } from "@/lib/types";
import { CompanyBadge } from "./CompanyBadge";
import { VerifiedBadge } from "./VerifiedBadge";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsCard({ card }: { card: NewsCardType }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CompanyBadge company={card.company} />
          <VerifiedBadge verified={card.verified} note={card.verificationNote} />
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{timeAgo(card.publishedAt)}</span>
      </div>

      <h2 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">{card.title}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{card.summary}</p>

      {!card.verified && card.verificationNote && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{card.verificationNote}</p>
      )}

      {card.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {card.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {source.name}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
