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
  const limit = initialLimit;

  const goToNextPage = useCallback((totalPages: number) => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, []);

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return { page, limit, goToNextPage, goToPrevPage };
}
