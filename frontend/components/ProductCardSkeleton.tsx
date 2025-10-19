// components/ProductCardSkeleton.tsx

interface ProductCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export default function ProductCardSkeleton({ viewMode = 'grid' }: ProductCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="relative">
        <div className="group flex flex-col sm:flex-row bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
          {/* Image Skeleton */}
          <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto sm:aspect-square flex-shrink-0 bg-gray-200"></div>

          {/* Content Skeleton */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Code */}
              <div className="h-6 w-24 bg-gray-200 rounded"></div>

              {/* Title */}
              <div className="h-6 w-3/4 bg-gray-200 rounded"></div>

              {/* Description */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Price */}
            <div className="mt-4">
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div className="relative">
      <div className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        {/* Image Skeleton */}
        <div className="relative aspect-square bg-gray-200"></div>

        {/* Info Skeleton */}
        <div className="p-5 space-y-3">
          {/* Code */}
          <div className="h-6 w-20 bg-gray-200 rounded"></div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-5 w-full bg-gray-200 rounded"></div>
            <div className="h-5 w-4/5 bg-gray-200 rounded"></div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Badge Skeleton - top right */}
        <div className="absolute top-3 right-3 h-9 w-16 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}
