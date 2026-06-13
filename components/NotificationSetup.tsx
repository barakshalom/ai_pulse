"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "unsupported" | "subscribed" | "denied" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function NotificationSetup() {
  const [status, setStatus] = useState<Status>(() => (isPushSupported() ? "idle" : "unsupported"));

  useEffect(() => {
    if (!isPushSupported()) return;

    navigator.serviceWorker.register("/sw.js").catch(() => setStatus("error"));

    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (existing) setStatus("subscribed");
    });
  }, []);

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("error");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    setStatus("subscribed");
  }

  if (status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <p className="text-xs text-green-700 dark:text-green-400">
        🔔 Daily notifications enabled
      </p>
    );
  }

  return (
    <button
      onClick={subscribe}
      className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
    >
      {status === "denied" ? "Notifications blocked - check Settings" : "Enable daily notifications"}
    </button>
  );
}
