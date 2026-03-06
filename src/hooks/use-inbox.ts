import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DocyrusComment } from '@/components/docyrus/comments-panel'
import { getApiClient } from '@/lib/api'

type RawCommentUser =
  | string
  | {
      id?: string | null
      firstname?: string | null
      lastname?: string | null
      name?: string | null
    }
  | null
  | undefined

interface RawInboxComment {
  id: string
  message?: string | null
  attachments?: Array<{
    id?: string
    file_name?: string
    file_type?: string
    file_size?: number
    signed_url?: string | null
  }> | null
  created_on?: string | null
  last_modified_on?: string | null
  record_id?: string | null
  parent_id?: string | null
  created_by?: RawCommentUser
  created_by_id?: string | null
  created_by_name?: string | null
}

export interface InboxCommentUser {
  id: string
  firstname?: string | null
  lastname?: string | null
}

export interface InboxComment extends DocyrusComment {
  author: InboxCommentUser
}

function splitName(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return { firstname: 'Unknown', lastname: 'User' }
  }

  const [firstname, ...rest] = trimmed.split(/\s+/)

  return {
    firstname,
    lastname: rest.join(' ') || null,
  }
}

function normalizeAuthor(raw: RawInboxComment): InboxCommentUser {
  const createdBy = raw.created_by

  if (createdBy && typeof createdBy === 'object') {
    const id = createdBy.id ?? raw.created_by_id ?? raw.id
    const parts = splitName(createdBy.name)
    const firstname = createdBy.firstname ?? parts.firstname
    const lastname = createdBy.lastname ?? parts.lastname

    return {
      id,
      firstname,
      lastname,
    }
  }

  if (typeof createdBy === 'string') {
    const parts = splitName(raw.created_by_name || createdBy)

    return {
      id: raw.created_by_id ?? createdBy,
      firstname: parts.firstname,
      lastname: parts.lastname,
    }
  }

  const parts = splitName(raw.created_by_name)

  return {
    id: raw.created_by_id ?? raw.id,
    firstname: parts.firstname,
    lastname: parts.lastname,
  }
}

function normalizeComment(raw: RawInboxComment): InboxComment {
  const author = normalizeAuthor(raw)

  return {
    id: raw.id,
    message: raw.message || '',
    attachments:
      raw.attachments?.map((attachment, index) => ({
        id: attachment.id || `${raw.id}-attachment-${index}`,
        file_name: attachment.file_name || 'Attachment',
        file_type: attachment.file_type || 'application/octet-stream',
        file_size: attachment.file_size || 0,
        signed_url: attachment.signed_url ?? null,
      })) || null,
    created_on: raw.created_on || new Date().toISOString(),
    created_by: author.id,
    last_modified_on:
      raw.last_modified_on || raw.created_on || new Date().toISOString(),
    record_id: raw.record_id ?? null,
    parent_id: raw.parent_id ?? null,
    author,
  }
}

export function useInboxComments(limit = 200, offset = 0) {
  return useQuery({
    queryKey: ['inbox', 'comments', limit, offset],
    queryFn: async () => {
      const apiClient = getApiClient()
      const response = await apiClient.get<Array<RawInboxComment>>(
        '/v1/users/me/comments',
        {
          limit,
          offset,
        },
      )

      return response.map(normalizeComment)
    },
  })
}

export function useReplyInboxComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      message,
    }: {
      commentId: string
      message: string
    }) => {
      const apiClient = getApiClient()

      return apiClient.put(`/v1/users/me/comments/${commentId}/reply`, {
        message,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'comments'] })
    },
  })
}

export function useUpdateInboxComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      message,
    }: {
      commentId: string
      message: string
    }) => {
      const apiClient = getApiClient()

      return apiClient.patch(`/v1/users/me/comments/${commentId}`, {
        message,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'comments'] })
    },
  })
}

export function useDeleteInboxComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const apiClient = getApiClient()

      return apiClient.delete(`/v1/users/me/comments/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'comments'] })
    },
  })
}
