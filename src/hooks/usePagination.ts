// src/hooks/usePagination.ts
/**
 * Shared pagination state hook.
 * Manages page, limit, and provides navigation handlers.
 */

import { useState, useCallback } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 20,
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const goToNextPage = useCallback((totalPages: number) => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, []);

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page on limit change
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  return { page, limit, goToPage, goToNextPage, goToPrevPage, changeLimit, reset };
}
