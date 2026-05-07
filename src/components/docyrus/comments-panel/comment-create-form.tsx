'use client'

import { type ChangeEvent, useCallback, useMemo, useRef, useState } from 'react'

import { type Value } from 'platejs'

import { ArrowUpIcon, PaperclipIcon, XIcon } from 'lucide-react'
import { KEYS, NodeApi } from 'platejs'
import { Plate, usePlateEditor } from 'platejs/react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Editor, EditorContainer } from '@/components/editor/editor'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import { type CommentUser } from './types'
import { CommentEditorKit } from './comment-editor-kit'
import { formatFileSize, getFileIcon, isImageFile } from './lib/file-utils'

interface CommentCreateFormProps {
  currentUser: CommentUser | undefined
  onSubmit: (content: Value, parentId?: string, files?: Array<File>) => void
  isPending: boolean
  parentId?: string
  placeholder?: string
}

export function CommentCreateForm({
  currentUser,
  onSubmit,
  isPending,
  parentId,
  placeholder = 'Write a comment...',
}: CommentCreateFormProps) {
  const [isEmpty, setIsEmpty] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<Array<File>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const commentEditor = usePlateEditor(
    {
      id: `comment-create-${parentId ?? 'root'}`,
      plugins: CommentEditorKit,
      value: [],
    },
    [parentId],
  )

  const handleSubmit = useCallback(() => {
    const text = NodeApi.string({
      children: commentEditor.children,
      type: KEYS.p,
    })

    if (text.trim().length === 0 && pendingFiles.length === 0) return
    if (isPending) return
    const value = commentEditor.children as Value

    onSubmit(
      value,
      parentId,
      pendingFiles.length > 0 ? pendingFiles : undefined,
    )
    commentEditor.tf.reset()
    setIsEmpty(true)
    setPendingFiles([])
  }, [isPending, commentEditor, onSubmit, parentId, pendingFiles])

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target

    if (!files) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const initials = currentUser
    ? `${currentUser.firstname?.[0] ?? ''}${currentUser.lastname?.[0] ?? ''}`
    : '?'

  const canSubmit = !isEmpty || pendingFiles.length > 0

  return (
    <div className="flex w-full gap-2">
      <div className="mt-1 shrink-0">
        <Avatar className="size-6">
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex grow flex-col">
        <div className="relative flex grow">
          <Plate
            editor={commentEditor}
            onChange={({ value }) => {
              const text = NodeApi.string({ children: value, type: KEYS.p })

              setIsEmpty(text.trim().length === 0)
            }}
          >
            <EditorContainer variant="comment">
              <Editor
                variant="comment"
                className="min-h-[25px] grow pt-0.5 pr-14"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder={placeholder}
                autoComplete="off"
              />

              <div className="absolute right-0.5 bottom-0.5 flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 shrink-0 text-muted-foreground"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className="size-3.5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 shrink-0"
                  disabled={!canSubmit || isPending}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSubmit()
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-full">
                    <ArrowUpIcon />
                  </div>
                </Button>
              </div>
            </EditorContainer>
          </Plate>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {pendingFiles.length > 0 && (
          <PendingFileList files={pendingFiles} onRemove={removePendingFile} />
        )}
      </div>
    </div>
  )
}

function PendingFileList({
  files,
  onRemove,
}: {
  files: Array<File>
  onRemove: (index: number) => void
}) {
  const previews = useMemo(
    () =>
      files.map((file) =>
        isImageFile(file.type) ? URL.createObjectURL(file) : null,
      ),
    [files],
  )

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {files.map((file, index) => {
        const previewUrl = previews[index]

        if (previewUrl) {
          return (
            <div
              key={`${file.name}-${file.size}`}
              className="group relative overflow-hidden rounded-md border"
            >
              <img
                src={previewUrl}
                alt={file.name}
                className="size-16 object-cover"
              />
              <button
                type="button"
                className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onRemove(index)}
              >
                <XIcon className="size-2.5" />
              </button>
            </div>
          )
        }

        const fileIcon = getFileIcon(file.type)

        return (
          <div
            key={`${file.name}-${file.size}`}
            className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
          >
            <DocyrusIcon
              icon={fileIcon.icon}
              className={`size-3.5 shrink-0 ${fileIcon.color}`}
            />
            <span className="max-w-30 truncate">{file.name}</span>
            <span className="text-muted-foreground">
              ({formatFileSize(file.size)})
            </span>
            <button
              type="button"
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(index)}
            >
              <XIcon className="size-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
