export function SkeletonNotebookGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[140px] rounded-2xl bg-black/5 animate-pulse" />
      ))}
    </div>
  )
}

export function SkeletonTopicList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-black/5 animate-pulse" />
      ))}
    </div>
  )
}
