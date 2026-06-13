import webpush from "web-push";
import { getPushSubscriptions, removePushSubscription, type PushSubscriptionRecord } from "./kv";

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_CONTACT_EMAIL ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(contact, publicKey, privateKey);
  return true;
}

/**
 * Sends a push notification to every subscribed device. Subscriptions that
 * are no longer valid (410/404 responses) are pruned from storage.
 */
export async function sendPushToAll(payload: { title: string; body: string; url?: string }): Promise<void> {
  if (!configureWebPush()) {
    console.warn("VAPID keys not configured; skipping push notifications.");
    return;
  }

  const subscriptions = await getPushSubscriptions();
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub: PushSubscriptionRecord) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscription(sub.endpoint);
        } else {
          console.error(`Failed to send push to ${sub.endpoint}:`, err);
        }
      }
    })
  );
}
