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
