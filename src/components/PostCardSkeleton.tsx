/**
 * Loading skeleton for post cards
 */
export default function PostCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-x-gray-border bg-x-gray-dark/30 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Profile Picture Skeleton */}
        <div className="w-12 h-12 rounded-full bg-x-gray-light/30" />

        {/* User Details Skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-x-gray-light/30 rounded w-32" />
            <div className="h-4 bg-x-gray-light/30 rounded w-24" />
          </div>
          <div className="h-3 bg-x-gray-light/30 rounded w-48" />
        </div>

        {/* Sentiment Badge Skeleton */}
        <div className="px-2 py-1 rounded-full h-6 w-16 bg-x-gray-light/30" />
      </div>

      {/* Post Text Skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-x-gray-light/30 rounded w-full" />
        <div className="h-4 bg-x-gray-light/30 rounded w-5/6" />
        <div className="h-4 bg-x-gray-light/30 rounded w-4/6" />
      </div>

      {/* Hashtags Skeleton */}
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-x-gray-light/30 rounded-full w-20" />
        <div className="h-6 bg-x-gray-light/30 rounded-full w-24" />
        <div className="h-6 bg-x-gray-light/30 rounded-full w-16" />
      </div>

      {/* Engagement Metrics Skeleton */}
      <div className="flex items-center gap-6 pt-3 border-t border-x-gray-border">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-x-gray-light/30 rounded" />
          <div className="h-3 bg-x-gray-light/30 rounded w-8" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-x-gray-light/30 rounded" />
          <div className="h-3 bg-x-gray-light/30 rounded w-8" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-x-gray-light/30 rounded" />
          <div className="h-3 bg-x-gray-light/30 rounded w-8" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-x-gray-light/30 rounded" />
          <div className="h-3 bg-x-gray-light/30 rounded w-8" />
        </div>
      </div>

      {/* Additional Metadata Skeleton */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-x-gray-border/50">
        <div className="h-3 bg-x-gray-light/30 rounded w-24" />
        <div className="h-3 bg-x-gray-light/30 rounded w-32" />
        <div className="h-3 bg-x-gray-light/30 rounded w-20 ml-auto" />
      </div>
    </div>
  );
}
