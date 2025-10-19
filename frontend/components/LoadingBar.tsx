'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Quando pathname o searchParams cambiano, significa che la navigazione è completata
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercetta i click sui link
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');

      if (link && link instanceof HTMLAnchorElement) {
        const href = link.getAttribute('href');
        // Solo per navigazioni interne (non link esterni o anchor)
        if (href && href.startsWith('/') && !href.startsWith('/#')) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-200">
      <div className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 animate-loading-bar shadow-lg"></div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            opacity: 1;
          }
          50% {
            width: 70%;
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 0.5;
          }
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
