import { PAGE_SIZE } from '../hooks/usePagination';
import './pagination.css';

export default function Pagination({ totalItems, currentPage, totalPages, onPageChange }) {
  const firstRecord = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRecord = Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="pagination-bar">
      <span className="pagination-count">
        Showing {firstRecord}-{lastRecord} of {totalItems} records
      </span>
      <nav className="pagination-navigation" aria-label="Pagination">
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <div className="pagination-pages">
          {pageNumbers.map((page) => (
            <button
              type="button"
              key={page}
              className={`pagination-button pagination-page${page === currentPage ? ' active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>
        <span className="pagination-current">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
