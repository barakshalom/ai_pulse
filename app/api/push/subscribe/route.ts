import { NextResponse } from "next/server";
import { addPushSubscription, removePushSubscription, type PushSubscriptionRecord } from "@/lib/kv";

export async function POST(request: Request) {
  const body = (await request.json()) as PushSubscriptionRecord;

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await addPushSubscription(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { endpoint: string };

  if (!body?.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await removePushSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
