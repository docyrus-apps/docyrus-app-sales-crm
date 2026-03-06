// @ts-nocheck
import type { TEquationElement } from 'platejs'
import type { SlateElementProps } from 'platejs/static'

import { SlateElement } from 'platejs/static'

import { cn } from '@/lib/utils'

export function EquationElementStatic(
  props: SlateElementProps<TEquationElement>,
) {
  const { element } = props

  return (
    <SlateElement className="my-1" {...props}>
      <div
        className={cn(
          'flex items-center justify-center rounded-sm',
          element.texExpression.length === 0
            ? 'bg-muted p-3 pr-9'
            : 'px-2 py-1',
        )}
        contentEditable={false}
      >
        {element.texExpression.length > 0 ? (
          <span>{element.texExpression}</span>
        ) : (
          <div className="flex h-7 w-full items-center gap-2 whitespace-nowrap text-muted-foreground text-sm">
            <div>Add a Tex equation</div>
          </div>
        )}
      </div>
      {props.children}
    </SlateElement>
  )
}

export function InlineEquationElementStatic(
  props: SlateElementProps<TEquationElement>,
) {
  const { element } = props

  return (
    <SlateElement
      {...props}
      className="mx-1 inline-block select-none rounded-sm"
    >
      <div contentEditable={false}>
        {element.texExpression.length > 0 ? (
          <span className="font-mono leading-none">
            {element.texExpression}
          </span>
        ) : (
          <span className="text-muted-foreground">New equation</span>
        )}
      </div>
      {props.children}
    </SlateElement>
  )
}
