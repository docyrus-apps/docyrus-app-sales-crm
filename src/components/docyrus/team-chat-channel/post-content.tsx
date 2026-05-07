'use client'

import { useMemo } from 'react'

import { Plate, usePlateEditor } from 'platejs/react'

import { Editor, EditorContainer } from '@/components/editor/editor'

import { PostEditorKit } from './post-editor-kit'
import { deserializePostMarkdown } from './lib/post-serializer'

interface PostContentProps {
  content: string
  postId: string
}

export function PostContent({ content, postId }: PostContentProps) {
  const contentValue = useMemo(
    () => deserializePostMarkdown(content),
    [content],
  )

  const editor = usePlateEditor(
    {
      id: `post-content-${postId}`,
      plugins: PostEditorKit,
      value: contentValue,
    },
    [contentValue],
  )

  return (
    <Plate readOnly editor={editor}>
      <EditorContainer variant="comment">
        <Editor variant="comment" className="w-auto grow" />
      </EditorContainer>
    </Plate>
  )
}
