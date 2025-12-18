import { useState, useMemo } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationState;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
}

export const usePagination = <T>(
  items: T[],
  initialPageSize: number = 10
): PaginationResult<T> => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Ensure current page is valid
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, currentPage, pageSize]);

  const goToPage = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page when changing page size
  };

  return {
    data: paginatedData,
    pagination: {
      page: currentPage,
      pageSize,
      totalCount,
    },
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  };
};
