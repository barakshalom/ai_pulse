import { NextResponse } from "next/server";
import { generateDigest } from "@/lib/digest";
import { fetchAllNews } from "@/lib/fetchNews";
import { saveDigest } from "@/lib/kv";
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

  const items = await fetchAllNews();
  const digest = await generateDigest(items);
  await saveDigest(digest);

  if (digest.cards.length > 0) {
    await sendPushToAll({
      title: "AI Pulse",
      body: `Your daily AI briefing is ready — ${digest.cards.length} update${digest.cards.length === 1 ? "" : "s"}.`,
      url: "/",
    });
  }

  return NextResponse.json({
    date: digest.date,
    itemsFetched: items.length,
    cardsGenerated: digest.cards.length,
  });
}
