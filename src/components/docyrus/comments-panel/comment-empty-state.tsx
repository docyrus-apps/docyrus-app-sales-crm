import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

export function CommentEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <DocyrusIcon
        icon="fal message-lines"
        className="size-8 text-muted-foreground/50"
      />
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          No comments yet
        </p>
        <p className="text-xs text-muted-foreground/70">
          Be the first to leave a comment
        </p>
      </div>
    </div>
  )
}
