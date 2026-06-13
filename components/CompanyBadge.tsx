import type { Company } from "@/lib/types";

const COMPANY_STYLES: Record<Company, { label: string; className: string }> = {
  anthropic: { label: "Anthropic", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  openai: { label: "OpenAI", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  google: { label: "Google", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  xai: { label: "xAI", className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" },
  other: { label: "Emerging", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
};

export function CompanyBadge({ company }: { company: Company }) {
  const { label, className } = COMPANY_STYLES[company];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {company === "other" ? "🆕 " : ""}
      {label}
    </span>
  );
}
