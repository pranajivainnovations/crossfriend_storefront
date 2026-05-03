const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full rounded-xl bg-ui-bg-subtle" />
      <div className="mt-3 px-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-ui-bg-subtle" />
        <div className="h-3 w-1/3 rounded bg-ui-bg-subtle" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
