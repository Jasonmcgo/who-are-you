type Props = {
  currentIndex: number;
  totalCount: number;
};

export default function ProgressIndicator({ currentIndex, totalCount }: Props) {
  if (totalCount <= 0) return null;
  return (
    <div
      className="flex items-stretch gap-1 w-full"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalCount}
      aria-valuenow={Math.min(totalCount, Math.max(1, currentIndex + 1))}
      aria-label={`Question ${currentIndex + 1} of ${totalCount}`}
    >
      {Array.from({ length: totalCount }, (_, i) => {
        const color =
          i === currentIndex
            ? "var(--umber)"
            : i < currentIndex
            ? "var(--ink-mute)"
            : "var(--ink-faint)";
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              height: 2,
              background: color,
            }}
          />
        );
      })}
    </div>
  );
}
