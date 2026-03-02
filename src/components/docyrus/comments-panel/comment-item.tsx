import { useCallback, useMemo, useState } from 'react';

import { type Value } from 'platejs';

import {
  CheckIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XIcon
} from 'lucide-react';
import { Plate, usePlateEditor } from 'platejs/react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Editor, EditorContainer } from '@/components/editor/editor';
import { formatCommentDate } from '@/components/editor/ui/comment';
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

import { deserializeCommentMarkdown } from './lib/comment-markdown';
import { type CommentUser, type DocyrusComment } from './types';
import { CommentEditorKit } from './comment-editor-kit';
import { formatFileSize, getFileIcon, isImageFile } from './lib/file-utils';

interface CommentItemProps {
  comment: DocyrusComment;
  user: CommentUser | undefined;
  isOwn: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (content: Value) => void;
  onDelete: () => void;
}

export function CommentItem({
  comment,
  user,
  isOwn,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete
}: CommentItemProps) {
  const [hovering, setHovering] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isEdited = comment.last_modified_on !== comment.created_on;

  const initials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`
    : '?';
  const displayName = user
    ? `${user.firstname} ${user.lastname}`
    : 'Unknown User';

  const contentValue = useMemo(
    () => deserializeCommentMarkdown(comment.message),
    [comment.message]
  );

  const commentEditor = usePlateEditor(
    {
      id: `comment-${comment.id}`,
      plugins: CommentEditorKit,
      value: contentValue
    },
    [contentValue]
  );

  const handleSave = useCallback(() => {
    onSaveEdit(commentEditor.children);
  }, [commentEditor.children, onSaveEdit]);

  const handleCancel = useCallback(() => {
    commentEditor.tf.replaceNodes(contentValue, {
      at: [],
      children: true
    });
    onCancelEdit();
  }, [commentEditor, contentValue, onCancelEdit]);

  const attachments = comment.attachments ?? [];

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}>
      <div className="relative flex items-center">
        <Avatar className="size-6">
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <h4 className="mx-2 text-sm font-semibold leading-none">
          {displayName}
        </h4>
        <div className="text-xs leading-none text-muted-foreground/80">
          <span className="mr-1">
            {formatCommentDate(new Date(comment.created_on))}
          </span>
          {isEdited && <span>(edited)</span>}
        </div>

        {isOwn && !isEditing && (hovering || dropdownOpen) && (
          <div className="absolute right-0 top-0 flex space-x-1">
            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-6 p-1 text-muted-foreground">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={onStartEdit}>
                    <PencilIcon className="size-4" />
                    Edit comment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete}>
                    <TrashIcon className="size-4" />
                    Delete comment
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="my-1 pl-7">
        <Plate readOnly={!isEditing} editor={commentEditor}>
          <EditorContainer variant="comment">
            <Editor variant="comment" className="w-auto grow" />

            {isEditing && (
              <div className="ml-auto flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-[28px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}>
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-primary/40">
                    <XIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}>
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-brand">
                    <CheckIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>
              </div>
            )}
          </EditorContainer>
        </Plate>

        {attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {attachments.map((attachment) => {
              const signedUrl = attachment.signed_url;
              const isImage
                = isImageFile(attachment.file_type) && Boolean(signedUrl);
              const fileIcon = getFileIcon(attachment.file_type);

              if (isImage && signedUrl) {
                return (
                  <a
                    key={attachment.id}
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-md border">
                    <img
                      src={signedUrl}
                      alt={attachment.file_name}
                      className="size-20 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/50 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="truncate">{attachment.file_name}</span>
                      <DownloadIcon className="size-2.5 shrink-0" />
                    </div>
                  </a>
                );
              }

              return (
                <a
                  key={attachment.id}
                  href={attachment.signed_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs transition-colors hover:bg-muted/80">
                  <DocyrusIcon
                    icon={fileIcon.icon}
                    className={`size-4 shrink-0 ${fileIcon.color}`} />
                  <span className="max-w-[120px] truncate">
                    {attachment.file_name}
                  </span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(attachment.file_size)})
                  </span>
                  <DownloadIcon className="size-3 shrink-0 text-muted-foreground" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}