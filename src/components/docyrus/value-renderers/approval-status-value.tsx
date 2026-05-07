'use client'

import { CalendarDays, User } from 'lucide-react'

import {
  type ApprovalStepValue,
  APPROVAL_STATUS,
  formatApprovalTimestamp,
  getApprovalStatusBadgeClasses,
  getApprovalUserAvatarUrl,
  getApprovalUserInitials,
  getApprovalUserName,
  hasApprovalWorkflowShape,
  normalizeApprovalValue,
  toApprovalStatusCode,
} from '@/lib/approval-status'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/use-date-format'

import { type DocyrusValueProps } from './types'

interface LegacyApprovalStep extends ApprovalStepValue {
  user_id?: string
  user_name?: string
}

function isApprovalArray(val: unknown): val is Array<LegacyApprovalStep> {
  return Array.isArray(val)
}

function ApprovalSummary({
  respondedAt,
  respondedBy,
  respondedByUser,
  comments,
}: {
  respondedAt?: string | Date | null
  respondedBy?: string | null
  respondedByUser?: ApprovalStepValue['respondedByUser']
  comments?: string | null
}) {
  const { formatDateTime } = useDateFormat()
  const actorName = getApprovalUserName(
    respondedByUser ?? null,
    respondedBy ?? null,
  )
  const avatarUrl = getApprovalUserAvatarUrl(respondedByUser ?? null)
  const hasMeta =
    !!respondedAt || !!respondedBy || !!respondedByUser || !!comments

  if (!hasMeta) return null

  return (
    <div className="flex w-fit max-w-full items-start gap-2 rounded-md bg-slate-100 px-2 py-2 dark:bg-slate-900/50">
      <Avatar size="sm">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={actorName} />}
        <AvatarFallback>{getApprovalUserInitials(actorName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        {comments && (
          <span className="text-muted-foreground truncate text-xs">
            {comments}
          </span>
        )}
        <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
          {respondedAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {formatApprovalTimestamp(respondedAt, formatDateTime)}
            </span>
          )}
          {(respondedBy || respondedByUser) && <span>{actorName}</span>}
        </div>
      </div>
    </div>
  )
}

function ApprovalHistory({ steps }: { steps: Array<ApprovalStepValue> }) {
  const { formatDateTime } = useDateFormat()

  if (!steps.length) return null

  return (
    <div className="flex flex-col divide-y rounded-md border bg-muted/20">
      {steps.map((step, idx) => {
        const actorName = getApprovalUserName(
          step.respondedByUser ?? null,
          step.respondedBy ?? null,
        )

        return (
          <div
            key={
              step.id ?? `${step.status ?? 'step'}-${step.respondedAt ?? idx}`
            }
            className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 text-xs"
          >
            {step.respondedAt ? (
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatApprovalTimestamp(step.respondedAt, formatDateTime)}
              </span>
            ) : null}
            <Badge
              variant="secondary"
              className={cn(getApprovalStatusBadgeClasses(step.status))}
            >
              {step.status ?? APPROVAL_STATUS.DRAFT}
            </Badge>
            {(step.respondedBy || step.respondedByUser) && (
              <>
                <span className="text-muted-foreground">by</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900/50">
                  {actorName}
                </span>
              </>
            )}
            {step.comments && (
              <span className="text-muted-foreground">{step.comments}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ApprovalStatusValue({ value, className }: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">—</span>
  }

  if (typeof value === 'string') {
    const status = toApprovalStatusCode(value)

    return (
      <Badge
        variant="secondary"
        className={cn(getApprovalStatusBadgeClasses(status), className)}
      >
        {status}
      </Badge>
    )
  }

  if (isApprovalArray(value)) {
    return (
      <span className={cn('inline-flex flex-wrap gap-1', className)}>
        {value.map((step, idx) => {
          const rawStatus =
            typeof step.status === 'string' ? step.status : 'pending'
          const status = toApprovalStatusCode(
            step.status ?? APPROVAL_STATUS.WAITING_FOR_APPROVAL,
          )
          const label = step.user_name ?? step.user_id ?? rawStatus

          return (
            <Badge
              key={step.id ?? idx}
              variant="secondary"
              className={cn(getApprovalStatusBadgeClasses(status))}
            >
              {label}
            </Badge>
          )
        })}
      </span>
    )
  }

  if (!hasApprovalWorkflowShape(value)) {
    return (
      <span className={cn('truncate text-sm', className)}>{String(value)}</span>
    )
  }

  const approval = normalizeApprovalValue(value)
  const hasSummary =
    !!approval.respondedAt ||
    !!approval.respondedBy ||
    !!approval.respondedByUser ||
    !!approval.comments

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="secondary"
          className={cn(getApprovalStatusBadgeClasses(approval.status))}
        >
          {approval.status}
        </Badge>
        {!hasSummary && approval.respondedBy == null && (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <User className="size-3" />
            No response yet
          </span>
        )}
      </div>

      <ApprovalSummary
        respondedAt={approval.respondedAt}
        respondedBy={approval.respondedBy}
        respondedByUser={approval.respondedByUser}
        comments={approval.comments}
      />

      <ApprovalHistory steps={approval.steps} />
    </div>
  )
}
