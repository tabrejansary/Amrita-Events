'use client';

import { useState, useEffect } from 'react';
import { FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface GalleryItem {
    url: string;
    resourceType: 'image' | 'video';
}

interface GalleryGridProps {
    items: GalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Close on Escape key and navigate with Arrow keys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;

            if (e.key === 'Escape') {
                setSelectedIndex(null);
            } else if (e.key === 'ArrowLeft') {
                setSelectedIndex((prev) => (prev! - 1 + items.length) % items.length);
            } else if (e.key === 'ArrowRight') {
                setSelectedIndex((prev) => (prev! + 1) % items.length);
            }
        };

        if (selectedIndex !== null) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, items.length]);

    if (!items || items.length === 0) return null;

    // Use up to 5 items for the grid display
    const displayItems = items.slice(0, 5);
    const remainingCount = items.length - 5;

    // Helper to render individual item with custom classes
    const renderItem = (item: GalleryItem, index: number, isLast: boolean, className: string = '') => {
        const isVideo = item.resourceType === 'video';

        return (
            <div
                key={index}
                className={`relative cursor-pointer group overflow-hidden bg-gray-100 ${className}`}
                onClick={() => setSelectedIndex(index)}
            >
                {isVideo ? (
                    <video
                        src={item.url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <img
                        src={item.url}
                        alt={`Gallery item ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                )}

                {/* Video Play Overlay */}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-amrita-maroon/80 flex items-center justify-center text-white shadow-lg backdrop-blur-sm">
                            <FaPlay className="ml-1 text-lg" />
                        </div>
                    </div>
                )}

                {/* Remaining Count Overlay (only on the last visible item if there are more) */}
                {isLast && remainingCount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-3xl font-bold backdrop-blur-[2px]">
                        +{remainingCount}
                    </div>
                )}

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
        );
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIndex((prev) => (prev! - 1 + items.length) % items.length);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIndex((prev) => (prev! + 1) % items.length);
    };

    const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

    return (
        <div className="my-8">
            <h3 className="text-xl font-bold text-amrita-textDark mb-4">Event Gallery</h3>

            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">

                {/* 1 Item: Full Width */}
                {displayItems.length === 1 && (
                    <div className="w-full h-[400px] md:h-[500px]">
                        {renderItem(displayItems[0], 0, false, "h-full")}
                    </div>
                )}

                {/* 2 Items: Side by Side Split */}
                {displayItems.length === 2 && (
                    <div className="grid grid-cols-2 gap-1 h-[300px] md:h-[400px]">
                        {renderItem(displayItems[0], 0, false, "h-full")}
                        {renderItem(displayItems[1], 1, false, "h-full")}
                    </div>
                )}

                {/* 3 Items: Left Large, Right Stacked */}
                {displayItems.length === 3 && (
                    <div className="grid grid-cols-12 gap-1 h-[300px] md:h-[500px]">
                        <div className="col-span-8 h-full">
                            {renderItem(displayItems[0], 0, false, "h-full")}
                        </div>
                        <div className="col-span-4 grid grid-rows-2 gap-1 h-full">
                            {renderItem(displayItems[1], 1, false, "h-full")}
                            {renderItem(displayItems[2], 2, false, "h-full")}
                        </div>
                    </div>
                )}

                {/* 4 Items: One Large Top, Three Small Bottom */}
                {displayItems.length === 4 && (
                    <div className="grid grid-cols-3 grid-rows-5 gap-1 h-[400px] md:h-[600px]">
                        {/* Top Large Item (60% height approx) */}
                        <div className="col-span-3 row-span-3 h-full">
                            {renderItem(displayItems[0], 0, false, "h-full")}
                        </div>
                        {/* Bottom Row Items */}
                        <div className="col-span-1 row-span-2 h-full">
                            {renderItem(displayItems[1], 1, false, "h-full")}
                        </div>
                        <div className="col-span-1 row-span-2 h-full">
                            {renderItem(displayItems[2], 2, false, "h-full")}
                        </div>
                        <div className="col-span-1 row-span-2 h-full">
                            {renderItem(displayItems[3], 3, false, "h-full")}
                        </div>
                    </div>
                )}

                {/* 5+ Items: Split Horizontal (2 Top, 3 Bottom) - Facebook Style Collage */}
                {displayItems.length >= 5 && (
                    <div className="grid grid-cols-6 grid-rows-2 gap-1 h-[400px] md:h-[500px]">

                        {/* Top Row: 2 Items (50-50 split) */}
                        <div className="col-span-3 h-full">
                            {renderItem(displayItems[0], 0, false, "h-full")}
                        </div>
                        <div className="col-span-3 h-full">
                            {renderItem(displayItems[1], 1, false, "h-full")}
                        </div>

                        {/* Bottom Row: 3 Items (33-33-33 split) */}
                        <div className="col-span-2 h-full">
                            {renderItem(displayItems[2], 2, false, "h-full")}
                        </div>
                        <div className="col-span-2 h-full">
                            {renderItem(displayItems[3], 3, false, "h-full")}
                        </div>
                        <div className="col-span-2 h-full">
                            {renderItem(displayItems[4], 4, true, "h-full")}
                        </div>
                    </div>
                )}

            </div>

            {/* Full Screen Modal Viewer */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setSelectedIndex(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white text-5xl transition z-50 focus:outline-none"
                        onClick={() => setSelectedIndex(null)}
                    >
                        &times;
                    </button>

                    {/* Navigation Arrows */}
                    {items.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition z-50 focus:outline-none"
                                onClick={handlePrev}
                            >
                                <FaChevronLeft className="text-2xl" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition z-50 focus:outline-none"
                                onClick={handleNext}
                            >
                                <FaChevronRight className="text-2xl" />
                            </button>
                        </>
                    )}

                    <div
                        className="w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedItem.resourceType === 'video' ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                    src={selectedItem.url}
                                    className="max-w-full max-h-full rounded shadow-2xl"
                                    controls
                                    autoPlay
                                />
                            </div>
                        ) : (
                            <img
                                src={selectedItem.url}
                                alt="Gallery View"
                                className="max-w-full max-h-full object-contain rounded shadow-2xl"
                            />
                        )}
                    </div>

                    {/* Counter Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 bg-black/40 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {selectedIndex! + 1} / {items.length}
                    </div>
                </div>
            )}
        </div>
    );
}
