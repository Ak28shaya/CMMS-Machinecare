import { useState } from 'react';

export const PAGE_SIZE = 10;

export function usePagination(items) {
  const [pageState, setPageState] = useState(() => ({ items, page: 1 }));
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = pageState.items === items
    ? Math.min(pageState.page, totalPages)
    : 1;
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setCurrentPage = (page) => {
    setPageState({
      items,
      page: Math.max(1, Math.min(page, totalPages))
    });
  };

  return { pageItems, currentPage, totalPages, setCurrentPage };
}
