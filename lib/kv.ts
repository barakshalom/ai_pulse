import { Redis } from "@upstash/redis";
import type { Digest } from "./types";

const LATEST_DIGEST_KEY = "digest:latest";
const PUSH_SUBSCRIPTIONS_KEY = "push:subscriptions";

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

export async function getLatestDigest(): Promise<Digest | null> {
  const redis = getClient();
  if (!redis) return null;
  return (await redis.get<Digest>(LATEST_DIGEST_KEY)) ?? null;
}

export async function saveDigest(digest: Digest): Promise<void> {
  const redis = getClient();
  if (!redis) {
    console.warn("KV not configured; skipping digest save.");
    return;
  }
  await redis.set(LATEST_DIGEST_KEY, digest);
  await redis.set(`digest:history:${digest.generatedAt}`, digest);
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function addPushSubscription(sub: PushSubscriptionRecord): Promise<void> {
  const redis = getClient();
  if (!redis) {
    console.warn("KV not configured; skipping push subscription save.");
    return;
  }
  await redis.hset(PUSH_SUBSCRIPTIONS_KEY, { [sub.endpoint]: JSON.stringify(sub) });
}

export async function getPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const redis = getClient();
  if (!redis) return [];
  const all = await redis.hgetall<Record<string, string>>(PUSH_SUBSCRIPTIONS_KEY);
  if (!all) return [];
  return Object.values(all).map((value) =>
    typeof value === "string" ? JSON.parse(value) : (value as PushSubscriptionRecord)
  );
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  await redis.hdel(PUSH_SUBSCRIPTIONS_KEY, endpoint);
}
