import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

export function PostEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <DocyrusIcon
        icon="fal messages"
        className="size-10 text-muted-foreground/50"
      />
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          No posts yet
        </p>
        <p className="text-xs text-muted-foreground/70">Start a conversation</p>
      </div>
    </div>
  )
}
