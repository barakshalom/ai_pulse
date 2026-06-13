"use client";

import { useMemo, useState } from "react";
import type { Company, NewsCard as NewsCardType } from "@/lib/types";
import { NewsCard } from "./NewsCard";

const FILTERS: { label: string; value: Company | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Anthropic", value: "anthropic" },
  { label: "OpenAI", value: "openai" },
  { label: "Google", value: "google" },
  { label: "xAI", value: "xai" },
  { label: "🆕 Emerging", value: "other" },
];

export function Feed({ cards }: { cards: NewsCardType[] }) {
  const [filter, setFilter] = useState<Company | "all">("all");

  const visibleCards = useMemo(
    () => (filter === "all" ? cards : cards.filter((card) => card.company === filter)),
    [cards, filter]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-4">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleCards.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No stories for this filter yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleCards.map((card) => (
            <NewsCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
