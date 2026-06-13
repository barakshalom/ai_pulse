export function VerifiedBadge({ verified, note }: { verified: boolean; note?: string }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
        ✅ Verified
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      title={note}
    >
      ⚠️ Unverified
    </span>
  );
}
