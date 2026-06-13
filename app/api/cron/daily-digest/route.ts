import { NextResponse } from "next/server";
import { generateDigest } from "@/lib/digest";
import { fetchAllNews } from "@/lib/fetchNews";
import { getPreviousNewCards, saveDigest, savePreviousNewCards } from "@/lib/kv";
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

  const previousNewCards = await getPreviousNewCards();
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
