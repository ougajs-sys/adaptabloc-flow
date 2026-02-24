import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const next = () => goTo(safePage + 1);
  const prev = () => goTo(safePage - 1);

  // Reset to page 1 when items change significantly
  const resetPage = () => setPage(1);

  return { page: safePage, totalPages, paginated, goTo, next, prev, resetPage, total: items.length };
}
