// @ts-nocheck
import type { TCommentText } from 'platejs'
import type { SlateLeafProps } from 'platejs/static'

import { SlateLeaf } from 'platejs/static'

export function CommentLeafStatic(props: SlateLeafProps<TCommentText>) {
  return (
    <SlateLeaf
      {...props}
      className="border-b-2 border-b-highlight/[.36] bg-highlight/[.13]"
    >
      {props.children}
    </SlateLeaf>
  )
}
