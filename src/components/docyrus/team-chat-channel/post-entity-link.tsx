import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import { type LinkedEntity } from './types'

interface PostEntityLinkProps {
  entities: Array<LinkedEntity>
}

export function PostEntityLink({ entities }: PostEntityLinkProps) {
  if (entities.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {entities.map((entity) => (
        <span
          key={entity.id}
          className="inline-flex items-center gap-1 rounded-full border bg-accent/50 px-2.5 py-0.5 text-xs font-medium"
        >
          {entity.icon && (
            <DocyrusIcon icon={entity.icon} className="size-3 shrink-0" />
          )}
          <span className="text-muted-foreground">
            {entity.data_source_name}:
          </span>
          <span className="max-w-40 truncate">{entity.display_value}</span>
        </span>
      ))}
    </div>
  )
}
