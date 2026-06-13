export function ProductBadge({ product }: { product?: string }) {
  if (!product) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
      {product}
    </span>
  );
}
