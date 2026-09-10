import { useEffect, useMemo, useState } from 'react'

import { type Value, KEYS } from 'platejs'
import { NodeApi } from 'platejs'
import { Plate, usePlateEditor } from 'platejs/react'
import {
  BoldIcon,
  ItalicIcon,
  Pencil,
  Plus,
  Save,
  Search,
  StickyNote,
  Trash2,
  UnderlineIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AwesomeDialog,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { getPresetPlugins } from '@/components/docyrus/form-fields/doc-editor-form-field'
import { Editor, EditorContainer } from '@/components/editor/editor'
import { FixedToolbar } from '@/components/editor/ui/fixed-toolbar'
import { FloatingToolbar } from '@/components/editor/ui/floating-toolbar'
import {
  RedoToolbarButton,
  UndoToolbarButton
} from '@/components/editor/ui/history-toolbar-button'
import { LinkToolbarButton } from '@/components/editor/ui/link-toolbar-button'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton
} from '@/components/editor/ui/list-toolbar-button'
import { MarkToolbarButton } from '@/components/editor/ui/mark-toolbar-button'
import { ToolbarGroup } from '@/components/editor/ui/toolbar'
import { TurnIntoToolbarButton } from '@/components/editor/ui/turn-into-toolbar-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  type RecordNote,
  type RecordNotesScope,
  useArchiveRecordNote,
  useCreateRecordNote,
  useRecordNotes,
  useUpdateRecordNote
} from '@/hooks/use-record-notes'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface RecordNotesPanelProps {
  appSlug: string;
  dataSource: string;
  recordId?: string;
  recordLabel?: string;
  className?: string;
}

type EditorMode = 'create' | 'edit'

const EMPTY_NOTE_VALUE = [{ type: KEYS.p, children: [{ text: '' }] }] as Value

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isPlateValue(value: unknown): value is Value {
  return Array.isArray(value)
}

function normalizeNoteContent(value: unknown): Value {
  return isPlateValue(value) ? value : EMPTY_NOTE_VALUE
}

function getNoteContent(note: RecordNote | null): Value {
  return normalizeNoteContent(note?.data?.content)
}

function getNodeText(value: unknown): string {
  if (Array.isArray(value)) return value.map(getNodeText).join('\n')
  if (!isRecord(value)) return ''
  if (typeof value.text === 'string') return value.text
  if (Array.isArray(value.children))
    return value.children.map(getNodeText).join('')

  return ''
}

function getPlainText(value: Value): string {
  return value
    .map(getNodeText)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getEditorPlainText(value: Value): string {
  try {
    return NodeApi.string({ children: value, type: KEYS.p }).trim()
  } catch {
    return getPlainText(value)
  }
}

function makeTitle(title: string, plainText: string): string {
  const explicit = title.trim()

  if (explicit) return explicit

  const firstLine = plainText.split('\n').find(line => line.trim())

  if (!firstLine) return 'Untitled note'

  return firstLine.trim().slice(0, 80)
}

function getNotePlainText(note: RecordNote): string {
  if (note.data?.plainText) return note.data.plainText
  if (note.description) return note.description

  return getPlainText(getNoteContent(note))
}

function getUserName(user: RecordNote['created_by']): string {
  if (!user || typeof user === 'string') return ''

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ')

  return user.name || fullName || user.email || ''
}

function noteDate(note: RecordNote): string | null {
  return note.last_modified_on ?? note.created_on ?? null
}

function serializeValue(value: Value): string {
  return JSON.stringify(value)
}

function NoteEditorToolbar() {
  return (
    <>
      <FixedToolbar>
        <div className="flex w-full min-w-max items-center">
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>
          <ToolbarGroup>
            <TurnIntoToolbarButton />
          </ToolbarGroup>
          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold">
              <BoldIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic">
              <ItalicIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline">
              <UnderlineIcon />
            </MarkToolbarButton>
          </ToolbarGroup>
          <ToolbarGroup>
            <BulletedListToolbarButton />
            <NumberedListToolbarButton />
            <LinkToolbarButton />
          </ToolbarGroup>
        </div>
      </FixedToolbar>
      <FloatingToolbar>
        <ToolbarGroup>
          <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold">
            <BoldIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic">
            <ItalicIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline">
            <UnderlineIcon />
          </MarkToolbarButton>
          <LinkToolbarButton />
        </ToolbarGroup>
      </FloatingToolbar>
    </>
  )
}

function RecordNoteEditor({
  note,
  mode,
  isSaving,
  onSave,
  onDelete,
  onCancel
}: {
  note: RecordNote | null;
  mode: EditorMode;
  isSaving: boolean;
  onSave: (payload: {
    title: string;
    content: Value;
    plainText: string;
  }) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(note?.name ?? '')
  const [value, setValue] = useState<Value>(() => getNoteContent(note))
  const [savedSignature, setSavedSignature] = useState(() => serializeValue(getNoteContent(note)))
  const plugins = useMemo(() => getPresetPlugins('rich'), [])
  const editor = usePlateEditor(
    {
      id: mode === 'create' ? 'record-note-new' : `record-note-${note?.id}`,
      plugins,
      value: getNoteContent(note)
    },
    [note?.id, mode]
  )

  useEffect(() => {
    const nextValue = getNoteContent(note)

    setTitle(note?.name ?? '')
    setValue(nextValue)
    setSavedSignature(serializeValue(nextValue))
  }, [note])

  const plainText = getEditorPlainText(value)
  const canSave = plainText.length > 0 || title.trim().length > 0
  const isDirty =
    mode === 'create' ||
    title.trim() !== (note?.name ?? '').trim() ||
    serializeValue(value) !== savedSignature

  const handleSave = async () => {
    if (!canSave || isSaving) return

    const payload = {
      title: makeTitle(title, plainText),
      content: value,
      plainText
    }

    await onSave(payload)
    setTitle(payload.title)
    setSavedSignature(serializeValue(value))
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[420px] max-h-[820px] min-w-0 flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder={t('notes.titlePlaceholder', {
              defaultValue: 'Note title'
            })}
            className="h-11 min-w-0 flex-1 border-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0" />
          {isDirty && (
            <Badge variant="secondary">
              {t('notes.unsaved', { defaultValue: 'Unsaved' })}
            </Badge>
          )}
        </div>

        <TooltipProvider>
          <Plate
            key={mode === 'create' ? 'new' : note?.id}
            editor={editor}
            onValueChange={({ value }) => setValue(value)}>
            <EditorContainer
              variant="select"
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
              <NoteEditorToolbar />
              <div className="min-h-0 flex-1 overflow-auto">
                <Editor
                  variant="select"
                  className="min-h-full px-4 py-4 text-sm leading-6 sm:px-7"
                  placeholder={t('notes.bodyPlaceholder', {
                    defaultValue: 'Write a note...'
                  })} />
              </div>
            </EditorContainer>
          </Plate>
        </TooltipProvider>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5">
        <div>
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={onDelete}>
              <Trash2 className="size-4" />
              {t('common.delete')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            className="gap-1.5"
            disabled={!canSave || !isDirty || isSaving}
            onClick={() => void handleSave()}>
            <Save className="size-4" />
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function RecordNoteCard({
  note,
  onEdit,
  onDelete
}: {
  note: RecordNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation()
  const authorName = getUserName(note.created_by)
  const plainText = getNotePlainText(note)
  const date = noteDate(note)

  return (
    <article className="group flex min-h-48 flex-col rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <StickyNote className="size-4" />
            </span>
            <h3 className="truncate text-sm font-semibold">
              {note.name || 'Untitled note'}
            </h3>
          </div>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onDelete}>
          <Trash2 className="size-4" />
          <span className="sr-only">{t('common.delete')}</span>
        </Button>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-3 min-h-0 flex-1 text-left">
        <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">
          {plainText ||
            note.description ||
            t('notes.noPreview', { defaultValue: 'No preview available.' })}
        </p>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          {date && <p className="truncate">{formatDate(date)}</p>}
          {authorName && <p className="truncate">{authorName}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onEdit}>
          <Pencil className="size-3.5" />
          {t('common.edit')}
        </Button>
      </div>
    </article>
  )
}

function NotesSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-full max-w-md" />
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

export function RecordNotesPanel({
  appSlug,
  dataSource,
  recordId,
  recordLabel,
  className
}: RecordNotesPanelProps) {
  const { t } = useTranslation()
  const scope = useMemo<RecordNotesScope>(
    () => ({
      appSlug,
      dataSourceSlug: dataSource,
      recordId
    }),
    [appSlug, dataSource, recordId]
  )
  const { notesQuery, dataSourceIdQuery } = useRecordNotes(scope)
  const createNote = useCreateRecordNote(scope)
  const updateNote = useUpdateRecordNote(scope)
  const archiveNote = useArchiveRecordNote(scope)
  const [query, setQuery] = useState('')
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null)
  const [editorNote, setEditorNote] = useState<RecordNote | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<RecordNote | null>(null)

  const notes = notesQuery.data ?? []

  const filteredNotes = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) return notes

    return notes.filter((note) => {
      const haystack = [
        note.name,
        note.description,
        getNotePlainText(note),
        getUserName(note.created_by)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(needle)
    })
  }, [notes, query])

  const isLoading = dataSourceIdQuery.isLoading || notesQuery.isLoading
  const error = dataSourceIdQuery.error ?? notesQuery.error
  const isEditorOpen = Boolean(editorMode)

  const openCreate = () => {
    setEditorNote(null)
    setEditorMode('create')
  }

  const openEdit = (note: RecordNote) => {
    setEditorNote(note)
    setEditorMode('edit')
  }

  const closeEditor = () => {
    setEditorMode(null)
    setEditorNote(null)
  }

  const handleCreate = async (payload: {
    title: string;
    content: Value;
    plainText: string;
  }) => {
    await createNote.mutateAsync(payload)
    closeEditor()
  }

  const handleUpdate = async (payload: {
    title: string;
    content: Value;
    plainText: string;
  }) => {
    if (!editorNote?.id) return

    await updateNote.mutateAsync({ noteId: editorNote.id, payload })
    closeEditor()
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    await archiveNote.mutateAsync(noteToDelete.id)
    if (editorNote?.id === noteToDelete.id) closeEditor()
    setNoteToDelete(null)
  }

  if (!recordId) {
    return (
      <div className={cn('h-full p-4', className)}>
        <Alert>
          <AlertDescription>
            {t('notes.missingRecord', {
              defaultValue: 'Save the record before adding notes.'
            })}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('h-full min-h-0', className)}>
        <NotesSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('h-full p-4', className)}>
        <Alert variant="destructive">
          <AlertDescription>
            {t('notes.loadError', {
              defaultValue: 'Notes could not be loaded.'
            })}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="flex shrink-0 flex-col gap-3 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('notes.searchPlaceholder', {
              defaultValue: 'Search notes'
            })}
            className="h-9 pl-8" />
        </div>
        <Button
          type="button"
          className="h-9 shrink-0 gap-1.5"
          onClick={openCreate}>
          <Plus className="size-4" />
          {t('notes.newNote', { defaultValue: 'New Note' })}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {filteredNotes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map(note => (
              <RecordNoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onDelete={() => setNoteToDelete(note)} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <StickyNote className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {notes.length === 0
                  ? t('notes.emptyTitle', { defaultValue: 'No notes yet' })
                  : t('notes.noResults', {
                      defaultValue: 'No notes match your search.'
                    })}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {notes.length === 0
                  ? t('notes.emptyDescription', {
                      defaultValue:
                        'Create a note to keep record-specific context here.'
                    })
                  : t('notes.searchPlaceholder', {
                      defaultValue: 'Search notes'
                    })}
              </p>
            </div>
            {notes.length === 0 && (
              <Button type="button" className="gap-1.5" onClick={openCreate}>
                <Plus className="size-4" />
                {t('notes.newNote', { defaultValue: 'New Note' })}
              </Button>
            )}
          </div>
        )}
      </div>

      <AwesomeDialog
        open={isEditorOpen}
        onOpenChange={open => !open && closeEditor()}
        container="modal"
        size="full"
        fullscreenable
        preventOutsideClose>
        <AwesomeDialogHeader
          title={
            editorMode === 'create'
              ? t('notes.newNote', { defaultValue: 'New Note' })
              : t('notes.editNote', { defaultValue: 'Edit Note' })
          }
          description={recordLabel} />
        {editorMode && (
          <RecordNoteEditor
            key={editorMode === 'create' ? 'create' : editorNote?.id}
            note={editorMode === 'edit' ? editorNote : null}
            mode={editorMode}
            isSaving={
              editorMode === 'create'
                ? createNote.isPending
                : updateNote.isPending
            }
            onSave={editorMode === 'create' ? handleCreate : handleUpdate}
            onDelete={
              editorMode === 'edit' && editorNote
                ? () => setNoteToDelete(editorNote)
                : undefined
            }
            onCancel={closeEditor} />
        )}
      </AwesomeDialog>

      <AlertDialog
        open={Boolean(noteToDelete)}
        onOpenChange={open => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('notes.deleteTitle', {
                defaultValue: 'Delete note?'
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('notes.deleteDescription', {
                defaultValue:
                  'This note will be removed from this record. It is archived in Docyrus instead of being permanently deleted.'
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveNote.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={archiveNote.isPending}
              onClick={() => void handleDeleteConfirm()}>
              {archiveNote.isPending ? t('common.saving') : t('common.delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
