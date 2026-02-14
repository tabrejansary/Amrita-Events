'use client';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const totalNumbers = siblingCount * 2 + 5;
        const totalBlocks = totalNumbers + 2;

        if (totalPages > totalBlocks) {
            const startPage = Math.max(2, currentPage - siblingCount);
            const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

            let pages: (number | string)[] = [1];

            if (startPage > 2) {
                pages.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            pages.push(totalPages);
            return pages;
        }

        return Array.from({ length: totalPages }, (_, i) => i + 1);
    };

    return (
        <div className="flex items-center justify-center space-x-2 mt-8 mb-4">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Previous Page"
            >
                <FaChevronLeft className="text-amrita-maroon" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-2">
                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                        disabled={typeof page !== 'number'}
                        className={`min-w-[40px] h-10 px-3 rounded-lg border transition-all duration-200 font-medium ${page === currentPage
                            ? 'bg-amrita-maroon text-white border-amrita-maroon shadow-md hover:bg-amrita-maroon/90'
                            : typeof page === 'number'
                                ? 'border-gray-200 text-gray-700 hover:border-amrita-maroon hover:text-amrita-maroon'
                                : 'border-transparent text-gray-400 cursor-default'
                            }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Next Page"
            >
                <FaChevronRight className="text-amrita-maroon" />
            </button>
        </div>
    );
}
