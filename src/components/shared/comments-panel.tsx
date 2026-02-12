/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2, MessageSquare, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiClient } from '@/lib/api'
import { formatDate } from '@/lib/formatters'

interface CommentsPanelProps {
  dataSource: string
  recordId: string
}

interface Comment {
  id: string
  body: string
  created_on: string
  created_by: {
    id: string
    name: string
    email?: string
    avatar?: string
  }
}

export function CommentsPanel({ dataSource, recordId }: CommentsPanelProps) {
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')

  // Fetch comments
  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Array<Comment>>({
    queryKey: ['comments', dataSource, recordId],
    queryFn: async () => {
      const apiClient = getApiClient()
      if (!apiClient) throw new Error('API client not initialized')

      const response = await apiClient.get(
        `/v1/apps/default/data-sources/${dataSource}/items/${recordId}/comments`,
      )
      return response.data
    },
  })

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async (body: string) => {
      const apiClient = getApiClient()
      if (!apiClient) throw new Error('API client not initialized')

      const response = await apiClient.post(
        `/v1/apps/default/data-sources/${dataSource}/items/${recordId}/comments`,
        { body },
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', dataSource, recordId],
      })
      setNewComment('')
      toast.success('Comment added successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to add comment: ${err.message}`)
    },
  })

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      commentId,
      body,
    }: {
      commentId: string
      body: string
    }) => {
      const apiClient = getApiClient()
      if (!apiClient) throw new Error('API client not initialized')

      const response = await apiClient.patch(
        `/v1/apps/default/data-sources/${dataSource}/items/${recordId}/comments/${commentId}`,
        { body },
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', dataSource, recordId],
      })
      setEditingId(null)
      setEditingBody('')
      toast.success('Comment updated successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to update comment: ${err.message}`)
    },
  })

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const apiClient = getApiClient()
      if (!apiClient) throw new Error('API client not initialized')

      await apiClient.delete(
        `/v1/apps/default/data-sources/${dataSource}/items/${recordId}/comments/${commentId}`,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', dataSource, recordId],
      })
      toast.success('Comment deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete comment: ${err.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim())
    }
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditingBody(comment.body)
  }

  const handleUpdate = (commentId: string) => {
    if (editingBody.trim()) {
      updateMutation.mutate({ commentId, body: editingBody.trim() })
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingBody('')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-6">
          <p className="text-sm text-destructive">
            Failed to load comments: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment List */}
      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.created_by.avatar} />
                    <AvatarFallback>
                      {getInitials(comment.created_by.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {comment.created_by.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(comment.created_on, {
                            format: 'relative',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(comment)}
                          disabled={editingId === comment.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(comment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(comment.id)}
                            disabled={
                              updateMutation.isPending || !editingBody.trim()
                            }
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateMutation.isPending}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground">
              Be the first to add a comment
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Comment Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createMutation.isPending || !newComment.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
