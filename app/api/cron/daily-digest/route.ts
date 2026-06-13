import { NextResponse } from "next/server";
import { generateDigest } from "@/lib/digest";
import { fetchAllNews } from "@/lib/fetchNews";
import { getLatestDigest, getPreviousNewCards, saveDigest, savePreviousNewCards } from "@/lib/kv";
import { sendPushToAll } from "@/lib/push";

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let previousNewCards = await getPreviousNewCards();
  if (previousNewCards.length === 0) {
    // Bootstrap fallback: digest:previousNewCards isn't populated yet (e.g.
    // right after deploying this feature). Fall back to whatever is in the
    // latest digest so its cards aren't dropped on this run.
    const latest = await getLatestDigest();
    if (latest) previousNewCards = latest.cards;
  }

  const items = await fetchAllNews();
  const digest = await generateDigest(items, previousNewCards);
  await saveDigest(digest);

  const newCards = digest.cards.filter((card) => card.isNew);
  await savePreviousNewCards(newCards);

  if (newCards.length > 0) {
    await sendPushToAll({
      title: "AI Pulse",
      body: `Your AI briefing is ready — ${newCards.length} new update${newCards.length === 1 ? "" : "s"}.`,
      url: "/",
    });
  }

  return NextResponse.json({
    date: digest.date,
    itemsFetched: items.length,
    cardsGenerated: digest.cards.length,
    newCards: newCards.length,
  });
}
