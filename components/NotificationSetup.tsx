"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "subscribing" | "subscribed" | "denied" | "unsupported" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function NotificationSetup() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => console.error("SW registration failed:", err));

    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (existing) setStatus("subscribed");
    });
  }, []);

  async function subscribe() {
    setErrorMessage(null);

    if (!pushSupported()) {
      setStatus("unsupported");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("error");
      setErrorMessage("Push notifications aren't configured yet (missing VAPID key).");
      return;
    }

    setStatus("subscribing");

    try {
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

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      setStatus("subscribed");
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "subscribed") {
    return (
      <p className="text-xs text-green-700 dark:text-green-400">🔔 Daily notifications enabled</p>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="max-w-[12rem] text-right text-xs text-zinc-500 dark:text-zinc-400">
        Notifications need this app added to your Home Screen first (Share → Add to Home Screen).
      </p>
    );
  }

  return (
    <div className="text-right">
      <button
        onClick={subscribe}
        disabled={status === "subscribing"}
        className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {status === "subscribing"
          ? "Enabling…"
          : status === "denied"
            ? "Blocked - check Settings"
            : status === "error"
              ? "Retry enabling notifications"
              : "Enable daily notifications"}
      </button>
      {errorMessage && (
        <p className="mt-1 max-w-[12rem] text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
