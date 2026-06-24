'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useId, useMemo, useState } from 'react'

import { CalendarDays, Check, RefreshCcw, Send, Undo2, X } from 'lucide-react'

import {
  type ApprovalUserSnapshot,
  type ApprovalValueObject,
  type ApprovalWorkflowStatus,
  APPROVAL_STATUS,
  formatApprovalTimestamp,
  getApprovalStatusBadgeClasses,
  getApprovalUserAvatarUrl,
  getApprovalUserId,
  getApprovalUserInitials,
  getApprovalUserName,
  normalizeApprovalUserSnapshot,
  normalizeApprovalValue,
} from '@/lib/docyrus/approval-status'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
import { useDateFormat } from '@/hooks/docyrus/use-date-format'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

const COMMENTABLE_STATUSES = new Set<string>([
  APPROVAL_STATUS.DRAFT,
  APPROVAL_STATUS.WAITING_FOR_APPROVAL,
  APPROVAL_STATUS.REVISION_REQUESTED,
])

const PRIMARY_ACTION_CLASS_BY_STATUS: Record<string, string> = {
  [APPROVAL_STATUS.DRAFT]:
    'bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400',
  [APPROVAL_STATUS.WAITING_FOR_APPROVAL]:
    'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400',
  [APPROVAL_STATUS.REVISION_REQUESTED]:
    'bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400',
}

interface ApprovalFieldOptions {
  placeholder?: string
  canRespond?: boolean
  currentUser?: ApprovalUserSnapshot | null
}

function createApprovalStepId(): string {
  if (
    typeof globalThis !== 'undefined' &&
    'crypto' in globalThis &&
    typeof globalThis.crypto?.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }

  return `approval-step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getApprovalFieldOptions(
  fieldConfig: DocyrusFormFieldProps['field'],
): ApprovalFieldOptions {
  const raw = fieldConfig.options

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const record = raw as Record<string, unknown>

  return {
    placeholder:
      typeof record.placeholder === 'string' ? record.placeholder : undefined,
    canRespond:
      typeof record.canRespond === 'boolean' ? record.canRespond : undefined,
    currentUser: normalizeApprovalUserSnapshot(record.currentUser),
  }
}

function ApprovalStatusSummary({
  approval,
}: {
  approval: ApprovalValueObject
}) {
  const { formatDateTime } = useDateFormat()
  const actorName = getApprovalUserName(
    approval.respondedByUser,
    approval.respondedBy ?? null,
  )
  const avatarUrl = getApprovalUserAvatarUrl(approval.respondedByUser)
  const hasMeta =
    !!approval.comments ||
    !!approval.respondedAt ||
    !!approval.respondedBy ||
    !!approval.respondedByUser

  if (!hasMeta) return null

  return (
    <div className="flex w-fit items-start gap-2 rounded-md bg-zinc-100 p-2 dark:bg-zinc-900/50">
      <Avatar size="lg">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={actorName} />}
        <AvatarFallback>{getApprovalUserInitials(actorName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className={cn(getApprovalStatusBadgeClasses(approval.status))}
          >
            {approval.status}
          </Badge>
          {approval.comments && (
            <span className="text-muted-foreground text-xs">
              {approval.comments}
            </span>
          )}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
          {approval.respondedAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {formatApprovalTimestamp(approval.respondedAt, formatDateTime)}
            </span>
          )}
          {(approval.respondedBy || approval.respondedByUser) && (
            <span>{actorName}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ApprovalStatusHistory({
  steps,
}: {
  steps: ApprovalValueObject['steps']
}) {
  const { formatDateTime } = useDateFormat()

  if (!steps.length) return null

  return (
    <div className="flex flex-col divide-y rounded-md border bg-muted/20">
      {steps.map((step, index) => {
        const actorName = getApprovalUserName(
          step.respondedByUser ?? null,
          step.respondedBy ?? null,
        )

        return (
          <div
            key={
              step.id ?? `${step.status ?? 'step'}-${step.respondedAt ?? index}`
            }
            className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 text-xs"
          >
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {formatApprovalTimestamp(step.respondedAt, formatDateTime)}
            </span>
            <Badge
              variant="secondary"
              className={cn(getApprovalStatusBadgeClasses(step.status))}
            >
              {step.status ?? APPROVAL_STATUS.DRAFT}
            </Badge>
            <span className="text-muted-foreground">by</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-900/50">
              {actorName}
            </span>
            {step.comments && (
              <span className="text-muted-foreground">{step.comments}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ApprovalStatusFormFieldInner({
  field,
  fieldConfig,
  disabled,
  required,
  className,
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  required?: boolean
  className?: string
}) {
  const { t } = useUiTranslation()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isFieldDisabled = disabled || fieldConfig.readOnly === true
  const options = useMemo(
    () => getApprovalFieldOptions(fieldConfig),
    [fieldConfig],
  )
  const approval = useMemo(
    () => normalizeApprovalValue(field.state.value),
    [field.state.value],
  )

  const [showCommentsInput, setShowCommentsInput] = useState<boolean>(
    !!approval.comments,
  )
  const [commentsDraft, setCommentsDraft] = useState<string>(
    approval.comments ?? '',
  )
  const commentsToggleId = useId()

  useEffect(() => {
    queueMicrotask(() => {
      setShowCommentsInput(!!approval.comments)
      setCommentsDraft(approval.comments ?? '')
    })
  }, [field.state.value, approval.comments])

  const canRespond = options.canRespond ?? true
  const { status } = approval
  const isCommentSectionVisible = COMMENTABLE_STATUSES.has(status)
  const showSummary =
    status !== APPROVAL_STATUS.DRAFT &&
    status !== APPROVAL_STATUS.WAITING_FOR_APPROVAL
  const hasSummaryMeta =
    !!approval.respondedAt ||
    !!approval.respondedBy ||
    !!approval.respondedByUser ||
    !!approval.comments

  const currentUser = options.currentUser ?? null
  const currentUserId = getApprovalUserId(currentUser)

  const commitStatus = (nextStatus: ApprovalWorkflowStatus) => {
    if (isFieldDisabled) return

    const nowIso = new Date().toISOString()
    const nextComment = showCommentsInput ? commentsDraft.trim() : ''
    const normalizedComment = nextComment.length > 0 ? nextComment : null

    const nextStep = {
      id: createApprovalStepId(),
      status: nextStatus,
      respondedAt: nowIso,
      respondedBy: currentUserId,
      respondedByUser: currentUser,
      comments: normalizedComment,
    }

    const nextValue: ApprovalValueObject = {
      ...approval,
      status: nextStatus,
      respondedAt: nowIso,
      respondedBy: currentUserId,
      respondedByUser: currentUser,
      comments: normalizedComment,
      steps: [nextStep, ...approval.steps],
    }

    field.handleChange(nextValue)
    field.handleBlur()
  }

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel htmlFor={field.name} required={required}>
        {fieldConfig.name}
      </FormFieldLabel>
      <div className="flex flex-col gap-3 rounded-md border bg-background p-3 shadow-sm">
        {showSummary && hasSummaryMeta && (
          <ApprovalStatusSummary approval={approval} />
        )}
        {showSummary && !hasSummaryMeta && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(getApprovalStatusBadgeClasses(approval.status))}
            >
              {approval.status}
            </Badge>
          </div>
        )}

        {isCommentSectionVisible && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor={commentsToggleId}
              className={cn(
                'flex w-fit items-center gap-2 text-sm',
                isFieldDisabled && 'opacity-60',
              )}
            >
              <Checkbox
                id={commentsToggleId}
                checked={showCommentsInput}
                onCheckedChange={(checked) =>
                  setShowCommentsInput(checked === true)
                }
                disabled={isFieldDisabled}
              />
              <span>
                {t('ui.formField.approvalAddComments', 'Add comments')}
              </span>
            </label>
            {showCommentsInput && (
              <Textarea
                value={commentsDraft}
                onChange={(e) => setCommentsDraft(e.target.value)}
                disabled={isFieldDisabled}
                placeholder={
                  options.placeholder ??
                  t(
                    'ui.formField.approvalCommentPlaceholder',
                    'Add approval comments...',
                  )
                }
                rows={3}
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {status === APPROVAL_STATUS.DRAFT && (
            <Button
              type="button"
              size="sm"
              disabled={isFieldDisabled}
              className={PRIMARY_ACTION_CLASS_BY_STATUS[APPROVAL_STATUS.DRAFT]}
              onClick={() => commitStatus(APPROVAL_STATUS.WAITING_FOR_APPROVAL)}
            >
              <Send className="size-3.5" />
              {t('ui.formField.approvalSendForApproval', 'Send for Approval')}
            </Button>
          )}

          {status === APPROVAL_STATUS.WAITING_FOR_APPROVAL && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={isFieldDisabled || !canRespond}
                className={
                  PRIMARY_ACTION_CLASS_BY_STATUS[
                    APPROVAL_STATUS.WAITING_FOR_APPROVAL
                  ]
                }
                onClick={() => commitStatus(APPROVAL_STATUS.APPROVED)}
              >
                <Check className="size-3.5" />
                {t('ui.formField.approvalApprove', 'Approve')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isFieldDisabled || !canRespond}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                onClick={() => commitStatus(APPROVAL_STATUS.REJECTED)}
              >
                <X className="size-3.5" />
                {t('ui.formField.approvalReject', 'Reject')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isFieldDisabled || !canRespond}
                className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
                onClick={() => commitStatus(APPROVAL_STATUS.REVISION_REQUESTED)}
              >
                <RefreshCcw className="size-3.5" />
                {t('ui.formField.approvalRequestRevision', 'Request Revision')}
              </Button>
            </>
          )}

          {status === APPROVAL_STATUS.REVISION_REQUESTED && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={isFieldDisabled}
                className={
                  PRIMARY_ACTION_CLASS_BY_STATUS[
                    APPROVAL_STATUS.REVISION_REQUESTED
                  ]
                }
                onClick={() =>
                  commitStatus(APPROVAL_STATUS.WAITING_FOR_APPROVAL)
                }
              >
                <Send className="size-3.5" />
                {t(
                  'ui.formField.approvalResendApprovalRequest',
                  'Resend Approval Request',
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isFieldDisabled}
                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                onClick={() => commitStatus(APPROVAL_STATUS.WITHDRAWN)}
              >
                <Undo2 className="size-3.5" />
                {t(
                  'ui.formField.approvalWithdrawApprovalRequest',
                  'Withdraw Approval Request',
                )}
              </Button>
            </>
          )}
        </div>

        <ApprovalStatusHistory steps={approval.steps} />
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function ApprovalStatusFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <ApprovalStatusFormFieldInner
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
        />
      )}
    </form.Field>
  )
}
