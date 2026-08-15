/**
 * App-root loading skeleton.
 *
 * Shown by Next.js App Router while any route segment is loading its
 * server component. Mirrors the site's editorial style — a thin
 * charcoal rule above a centered spinner + caption.
 */
export default function Loading() {
  return (
    <div className="container-legal py-20 flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-[#d8d6d2] border-t-[#1f1f1f] rounded-full animate-spin" aria-hidden />
      <p className="text-[13px] text-[#6b6b6b]">در حال بارگذاری…</p>
    </div>
  );
}
