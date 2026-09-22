interface Props {
  className?: string;
}

export function LoadingSkeleton({ className = "" }: Props) {
  return <div className={`skeleton bg-base-300/70 ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-56" />
        <LoadingSkeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="stat-card space-y-3">
            <LoadingSkeleton className="h-10 w-10 rounded-xl" />
            <LoadingSkeleton className="h-8 w-20" />
            <LoadingSkeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <LoadingSkeleton className="h-6 w-36" />
        <LoadingSkeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

type DashboardTabSkeletonVariant = "list" | "table" | "form" | "map";

export function DashboardTabSkeleton({
  variant = "list",
}: {
  variant?: DashboardTabSkeletonVariant;
}) {
  return (
    <div className="space-y-6" aria-label="Loading dashboard tab">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-4 w-72 max-w-full" />
      </div>

      {variant === "form" && (
        <>
          <div className="rounded-2xl border border-base-300 bg-base-100 p-6 space-y-4">
            <LoadingSkeleton className="h-6 w-48" />
            <LoadingSkeleton className="h-12 w-full rounded-lg" />
            <div className="grid gap-4 sm:grid-cols-2">
              <LoadingSkeleton className="h-12 w-full rounded-lg" />
              <LoadingSkeleton className="h-12 w-full rounded-lg" />
            </div>
            <LoadingSkeleton className="h-12 w-36 rounded-lg" />
          </div>
          <div className="rounded-2xl border border-base-300 bg-base-100 p-6 space-y-4">
            <LoadingSkeleton className="h-6 w-40" />
            <LoadingSkeleton className="h-28 w-full rounded-lg" />
          </div>
        </>
      )}

      {variant === "map" && (
        <LoadingSkeleton className="h-96 w-full rounded-2xl" />
      )}

      {variant === "table" && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <LoadingSkeleton key={index} className="h-5 w-full" />
            ))}
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, cellIndex) => (
                <LoadingSkeleton key={cellIndex} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <LoadingSkeleton className="h-6 w-48" />
                <LoadingSkeleton className="h-6 w-20 rounded-full" />
              </div>
              <LoadingSkeleton className="h-4 w-3/4 max-w-md" />
              <LoadingSkeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardProfileSkeleton() {
  return (
    <div className="max-w-3xl space-y-6" aria-label="Loading profile">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-2xl border border-base-300 bg-base-100 p-8 space-y-8">
        <div className="flex items-center gap-5">
          <LoadingSkeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-5 w-36" />
            <LoadingSkeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <LoadingSkeleton className="h-56 w-full rounded-xl" />
        <LoadingSkeleton className="h-12 w-36 rounded-lg" />
      </div>
    </div>
  );
}
