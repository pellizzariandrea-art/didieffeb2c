'use client';

// components/ImageGallery.tsx - Mobile-First Optimized
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/ui-labels';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const { currentLang } = useLanguage();
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return null;
  }

  // Prepare slides for lightbox
  const slides = images.map((image) => ({
    src: image,
    alt: productName,
  }));

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
    if (isRightSwipe && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Navigation handlers
  const goToPrevious = () => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex(prev => Math.min(images.length - 1, prev + 1));
  };

  // Scroll thumbnail into view when selected
  useEffect(() => {
    if (thumbnailsRef.current) {
      const selectedThumb = thumbnailsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedThumb) {
        selectedThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="space-y-3">
      {/* Immagine principale - Mobile: h-[240px], Desktop: aspect-square */}
      <div className="relative">
        <div
          className="relative h-[240px] md:h-auto md:aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in group"
          onClick={() => setIsLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={images[selectedIndex]}
            alt={`${productName} - Immagine ${selectedIndex + 1}`}
            fill
            className="object-contain p-4 md:p-6 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Overlay hint per zoom - solo desktop */}
          <div className="hidden md:flex absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-800 shadow-lg">
              🔍 {getLabel('product.click_to_zoom', currentLang)}
            </div>
          </div>

          {/* Navigation arrows - solo se più di 1 immagine */}
          {images.length > 1 && (
            <>
              {/* Previous */}
              {selectedIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Immagine precedente"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
                </button>
              )}

              {/* Next */}
              {selectedIndex < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Immagine successiva"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
                </button>
              )}
            </>
          )}

          {/* Counter badge - mobile only */}
          {images.length > 1 && (
            <div className="md:hidden absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {selectedIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Dots indicator - mobile only, solo se più immagini */}
        {images.length > 1 && (
          <div className="md:hidden flex justify-center gap-1.5 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`transition-all rounded-full ${
                  idx === selectedIndex
                    ? 'w-6 h-2 bg-green-600'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Vai all'immagine ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails horizontal scroll - Desktop only */}
      {images.length > 1 && (
        <div
          ref={thumbnailsRef}
          className="hidden md:flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2"
        >
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIndex
                  ? 'border-green-600 ring-2 ring-green-200'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Thumbnail ${idx + 1}`}
                fill
                className="object-contain p-2"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox per zoom */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={slides}
        index={selectedIndex}
        on={{
          view: ({ index }) => setSelectedIndex(index),
        }}
      />
    </div>
  );
}
