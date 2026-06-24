import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiClient } from '@/lib/api'

export const RECORD_NOTE_TYPE = 'crm-note'

export interface RecordNoteUser {
  id?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface RecordNote {
  id: string;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  data?: {
    content?: unknown;
    noteKind?: string;
    plainText?: string;
    appSlug?: string;
    dataSourceSlug?: string;
    schemaVersion?: number;
  } | null;
  tags?: Array<string> | null;
  archived?: boolean | null;
  created_on?: string | null;
  created_by?: RecordNoteUser | string | null;
  last_modified_on?: string | null;
  last_modified_by?: RecordNoteUser | string | null;
  parent_data_source_id?: { id?: string | null } | string | null;
  parent_record_id?: { id?: string | null } | string | null;
}

export interface RecordNotesScope {
  appSlug: string;
  dataSourceSlug: string;
  recordId?: string;
}

export interface SaveRecordNotePayload {
  title: string;
  content: unknown;
  plainText: string;
}

interface DataSourceMeta {
  id: string;
  slug?: string;
  app_slug?: string;
}

function relatedId(value: RecordNote['parent_data_source_id']): string | null {
  if (!value) return null
  if (typeof value === 'string') return value

  return value.id ?? null
}

function normalizeDocsResponse(value: unknown): Array<RecordNote> {
  if (Array.isArray(value)) return value as Array<RecordNote>

  if (value && typeof value === 'object') {
    const record = value as {
      data?: unknown;
      docs?: unknown;
      items?: unknown;
      results?: unknown;
    }

    for (const candidate of [
      record.data,
      record.docs,
      record.items,
      record.results
    ]) {
      if (Array.isArray(candidate)) return candidate as Array<RecordNote>
    }
  }

  return []
}

function noteTimestamp(note: RecordNote): number {
  const value = note.last_modified_on ?? note.created_on

  if (!value) return 0

  const timestamp = new Date(value).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

function recordNotesKey(scope: RecordNotesScope) {
  return [
    'record-notes',
    scope.appSlug,
    scope.dataSourceSlug,
    scope.recordId
  ] as const
}

export function useRecordDataSourceId({
  appSlug,
  dataSourceSlug
}: Pick<RecordNotesScope, 'appSlug' | 'dataSourceSlug'>) {
  return useQuery({
    queryKey: ['data-source-meta', appSlug, dataSourceSlug],
    queryFn: async () => {
      const client = getApiClient()
      const dataSource = await client.get<DataSourceMeta>(
        `/v1/apps/${appSlug}/data-sources/${dataSourceSlug}`
      )

      return dataSource.id
    },
    enabled: Boolean(appSlug && dataSourceSlug),
    staleTime: 1000 * 60 * 10
  })
}

export function useRecordNotes(scope: RecordNotesScope) {
  const dataSourceIdQuery = useRecordDataSourceId(scope)
  const dataSourceId = dataSourceIdQuery.data

  const notesQuery = useQuery({
    queryKey: [...recordNotesKey(scope), dataSourceId],
    queryFn: async () => {
      const client = getApiClient()
      const response = await client.get<unknown>('/v1/docs', {
        archived: false
      })

      return normalizeDocsResponse(response)
        .filter((note) => {
          const tags = Array.isArray(note.tags) ? note.tags : []
          const isRecordNote =
            note.type === RECORD_NOTE_TYPE ||
            note.data?.noteKind === RECORD_NOTE_TYPE ||
            tags.includes(RECORD_NOTE_TYPE)

          return (
            isRecordNote &&
            relatedId(note.parent_data_source_id) === dataSourceId &&
            relatedId(note.parent_record_id) === scope.recordId
          )
        })
        .sort((left, right) => noteTimestamp(right) - noteTimestamp(left))
    },
    enabled: Boolean(dataSourceId && scope.recordId)
  })

  return {
    dataSourceId,
    dataSourceIdQuery,
    notesQuery
  }
}

export function useCreateRecordNote(scope: RecordNotesScope) {
  const queryClient = useQueryClient()
  const { data: dataSourceId } = useRecordDataSourceId(scope)

  return useMutation({
    mutationFn: async (payload: SaveRecordNotePayload) => {
      if (!scope.recordId || !dataSourceId) {
        throw new Error('Record note scope is not ready')
      }

      const client = getApiClient()

      await client.post('/v1/docs', {
        name: payload.title,
        description: payload.plainText,
        parent_data_source_id: dataSourceId,
        parent_record_id: scope.recordId,
        data: {
          schemaVersion: 1,
          noteKind: RECORD_NOTE_TYPE,
          appSlug: scope.appSlug,
          dataSourceSlug: scope.dataSourceSlug,
          content: payload.content,
          plainText: payload.plainText
        },
        tags: [RECORD_NOTE_TYPE, scope.appSlug, scope.dataSourceSlug]
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recordNotesKey(scope) })
      toast.success('Note saved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save note')
    }
  })
}

export function useUpdateRecordNote(scope: RecordNotesScope) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      noteId,
      payload
    }: {
      noteId: string;
      payload: SaveRecordNotePayload;
    }) => {
      const client = getApiClient()

      await client.patch(`/v1/docs/${noteId}`, {
        name: payload.title,
        description: payload.plainText,
        data: {
          schemaVersion: 1,
          noteKind: RECORD_NOTE_TYPE,
          appSlug: scope.appSlug,
          dataSourceSlug: scope.dataSourceSlug,
          content: payload.content,
          plainText: payload.plainText
        }
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recordNotesKey(scope) })
      toast.success('Note updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update note')
    }
  })
}

export function useArchiveRecordNote(scope: RecordNotesScope) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      const client = getApiClient()

      await client.patch(`/v1/docs/${noteId}`, { archived: true })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recordNotesKey(scope) })
      toast.success('Note deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete note')
    }
  })
}
