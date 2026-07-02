import type { ReactNode } from "react";

// Shared visual primitives so every page has the same elevated look.

export const field =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50";

export const ghostBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50";

export const card = "rounded-xl border border-gray-200 bg-white shadow-sm";

export function PageHeader({
  title,
  subtitle,
  count,
  action,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-500">
              {count}
            </span>
          )}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
      {icon && <div className="text-gray-300">{icon}</div>}
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

export function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
}
