// @ts-nocheck
import type { TListElement } from 'platejs'
import type { SlateElementProps } from 'platejs/static'

import { isOrderedList } from '@platejs/list'

import { cn } from '@/lib/utils'

const config: Record<
  string,
  {
    Li: React.FC<SlateElementProps>
    Marker: React.FC<SlateElementProps>
  }
> = {
  todo: {
    Li: TodoLi,
    Marker: TodoMarker,
  },
}

export const BlockListStatic = (props: any) => {
  if (!props.element.listStyleType) return

  return (props: any) => <List {...props} />
}

function List(props: SlateElementProps) {
  const { listStart, listStyleType } = props.element as TListElement
  const { Li, Marker } = config[listStyleType] ?? {}
  const ListTag = isOrderedList(props.element) ? 'ol' : 'ul'

  return (
    <ListTag
      className="relative m-0 p-0"
      style={{ listStyleType }}
      start={listStart}
    >
      {Marker && <Marker {...props} />}
      {Li ? <Li {...props} /> : <li>{props.children}</li>}
    </ListTag>
  )
}

function TodoMarker(props: SlateElementProps) {
  return (
    <div contentEditable={false}>
      <input
        type="checkbox"
        className={cn('-left-6 absolute top-1 pointer-events-none')}
        checked={props.element.checked as boolean}
        readOnly
      />
    </div>
  )
}

function TodoLi(props: SlateElementProps) {
  return (
    <li
      className={cn(
        'list-none',
        (props.element.checked as boolean) &&
          'text-muted-foreground line-through',
      )}
    >
      {props.children}
    </li>
  )
}
