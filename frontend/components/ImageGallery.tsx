'use client';

// components/ImageGallery.tsx
import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/ui-labels';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { currentLang } = useLanguage();

  if (images.length === 0) {
    return null;
  }

  // Prepare slides for lightbox
  const slides = images.map((image) => ({
    src: image,
    alt: productName,
  }));

  return (
    <div className="space-y-4">
      {/* Immagine principale - Clickable per zoom */}
      <div
        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - Immagine ${selectedIndex + 1}`}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {/* Overlay hint per zoom */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-800 shadow-lg">
            🔍 {getLabel('product.click_to_zoom', currentLang)}
          </div>
        </div>
      </div>

      {/* Thumbnails - solo se ci sono più immagini */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIndex
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Thumbnail ${idx + 1}`}
                fill
                className="object-contain p-2"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Indicatore immagine corrente */}
      {images.length > 1 && (
        <p className="text-center text-sm text-gray-600">
          Immagine {selectedIndex + 1} di {images.length}
        </p>
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
