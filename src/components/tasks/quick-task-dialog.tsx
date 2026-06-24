import { useEffect, useMemo, useRef, useState } from 'react'

import { format } from 'date-fns'
import {
  AtSign,
  BriefcaseBusiness,
  CalendarIcon,
  CheckCheck,
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2,
  PlusIcon,
  XIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useCompanies } from '@/hooks/use-companies'
import { useDeals } from '@/hooks/use-deals'
import { useCreateTask } from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'
import { cn } from '@/lib/utils'

const OPEN_STATUS_ID = '832d6cd0-aa19-11ed-aac7-ef062d6cf1c1'
const BACKLOG_STATUS_ID = '0bb8a460-aa02-11ed-84a0-059996ec9e38'

type TriggerField = 'subject' | 'description'

type TriggerState = {
  type: '@' | '#';
  field: TriggerField;
  startIndex: number;
  search: string;
  highlightIndex: number;
}

type MentionItem = {
  id: string;
  kind: 'user' | 'organization' | 'deal';
  label: string;
}

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function detectTrigger(
  text: string,
  cursorPos: number
): { type: '@' | '#'; startIndex: number; search: string } | null {
  const before = text.slice(0, cursorPos)

  for (const char of ['@', '#'] as const) {
    const idx = before.lastIndexOf(char)

    if (idx === -1) continue
    if (idx > 0 && before[idx - 1] !== ' ') continue
    const search = before.slice(idx + 1)

    if (search.includes(' ')) continue

    return { type: char, startIndex: idx, search }
  }

  return null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getOrganizationId(deal: any) {
  return typeof deal.organization === 'object'
    ? deal.organization.id
    : deal.organization
}

function getDealLabel(deal: any) {
  const stage = typeof deal.stage === 'object' ? deal.stage?.name : deal.stage

  if (stage) {
    return `Deal #${deal.id.slice(0, 8)} · ${stage}`
  }

  return `Deal #${deal.id.slice(0, 8)}`
}

function MentionList({
  items,
  emptyLabel,
  highlightIndex,
  onSelect,
  onHighlight
}: {
  items: Array<MentionItem>;
  emptyLabel: string;
  highlightIndex: number;
  onSelect: (item: MentionItem) => void;
  onHighlight: (index: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current

    if (!list) return

    const highlighted = list.children[highlightIndex] as HTMLElement | undefined

    highlighted?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  if (items.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div ref={listRef} role="listbox" className="max-h-60 overflow-y-auto">
      {items.map((item, index) => (
        <button
          key={`${item.kind}-${item.id}`}
          type="button"
          role="option"
          aria-selected={index === highlightIndex}
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none',
            index === highlightIndex
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50'
          )}
          onMouseDown={event => event.preventDefault()}
          onMouseEnter={() => onHighlight(index)}
          onClick={() => onSelect(item)}>
          {item.kind === 'organization' ? (
            <BriefcaseBusiness className="size-3.5 text-muted-foreground" />
          ) : item.kind === 'deal' ? (
            <CheckCheck className="size-3.5 text-muted-foreground" />
          ) : (
            <AtSign className="size-3.5 text-muted-foreground" />
          )}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export function QuickTaskDialog({ open, onOpenChange }: QuickTaskDialogProps) {
  const { t } = useTranslation()
  const createTask = useCreateTask()
  const { data: users = [] } = useUsers()
  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name'],
    orderBy: 'name ASC'
  })
  const { data: deals = [] } = useDeals({
    columns: [
      'id',
      'stage',
      'deal_value',
      'expected_revenue',
      'organization(id,name)',
      'created_on'
    ],
    orderBy: 'created_on DESC'
  })

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [dealId, setDealId] = useState('')
  const [recordOwnerId, setRecordOwnerId] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [showDescription, setShowDescription] = useState(false)
  const [createMore, setCreateMore] = useState(false)
  const [isBacklog, setIsBacklog] = useState(false)

  const [organizationPopoverOpen, setOrganizationPopoverOpen] = useState(false)
  const [dealPopoverOpen, setDealPopoverOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const [trigger, setTrigger] = useState<TriggerState | null>(null)

  const subjectRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return

    setSubject('')
    setDescription('')
    setOrganizationId('')
    setDealId('')
    setRecordOwnerId('')
    setDueDate(undefined)
    setShowDescription(false)
    setCreateMore(false)
    setIsBacklog(false)
    setOrganizationPopoverOpen(false)
    setDealPopoverOpen(false)
    setDatePopoverOpen(false)
    setUserPopoverOpen(false)
    setTrigger(null)

    requestAnimationFrame(() => subjectRef.current?.focus())
  }, [open])

  const organizationName = useMemo(() => {
    if (!organizationId) return ''
    const organization = companies.find(
      (company: any) => company.id === organizationId
    )

    return organization?.name ?? ''
  }, [companies, organizationId])

  const organizationDeals = useMemo(() => {
    if (!organizationId) return []

    return deals.filter(
      (deal: any) => getOrganizationId(deal) === organizationId
    )
  }, [deals, organizationId])

  const dealName = useMemo(() => {
    if (!dealId) return ''
    const deal = organizationDeals.find((item: any) => item.id === dealId)

    return deal ? getDealLabel(deal) : ''
  }, [dealId, organizationDeals])

  const assigneeName = useMemo(() => {
    if (!recordOwnerId) return ''
    const user = users.find(item => item.id === recordOwnerId)

    return user ? `${user.firstname} ${user.lastname}`.trim() || user.email : ''
  }, [recordOwnerId, users])

  const mentionItems = useMemo<Array<MentionItem>>(() => {
    if (!trigger) return []

    const search = trigger.search.toLowerCase()

    if (trigger.type === '@') {
      return users
        .filter((user) => {
          const label =
            `${user.firstname} ${user.lastname}`.trim() || user.email

          return label.toLowerCase().includes(search)
        })
        .slice(0, 8)
        .map(user => ({
          id: user.id!,
          kind: 'user',
          label: `${user.firstname} ${user.lastname}`.trim() || user.email
        }))
    }

    if (!organizationId) {
      return companies
        .filter((company: any) => String(company.name ?? '')
            .toLowerCase()
            .includes(search))
        .slice(0, 8)
        .map((company: any) => ({
          id: company.id,
          kind: 'organization',
          label: company.name
        }))
    }

    return organizationDeals
      .filter((deal: any) => getDealLabel(deal).toLowerCase().includes(search))
      .slice(0, 8)
      .map((deal: any) => ({
        id: deal.id,
        kind: 'deal',
        label: getDealLabel(deal)
      }))
  }, [
companies,
organizationDeals,
organizationId,
trigger,
users
])

  function updateTrigger(
    value: string,
    cursorPos: number,
    field: TriggerField
  ) {
    if (field === 'subject') setSubject(value)
    else setDescription(value)

    const detected = detectTrigger(value, cursorPos)

    if (!detected) {
      setTrigger(null)

      return
    }

    setTrigger({
      ...detected,
      field,
      highlightIndex: 0
    })
  }

  function selectMentionItem(item: MentionItem) {
    if (!trigger) return

    const { field, search, startIndex } = trigger

    const stripTrigger = (value: string) => {
      const before = value.slice(0, startIndex)
      const after = value.slice(startIndex + search.length + 1)

      return before + after
    }

    if (field === 'subject') {
      setSubject(previous => stripTrigger(previous))
    } else {
      setDescription(previous => stripTrigger(previous))
    }

    if (item.kind === 'user') {
      setRecordOwnerId(item.id)
    } else if (item.kind === 'organization') {
      setOrganizationId(item.id)
      setDealId('')
    } else {
      setDealId(item.id)
    }

    setTrigger(null)
    requestAnimationFrame(() => {
      if (field === 'subject') subjectRef.current?.focus()
      else descriptionRef.current?.focus()
    })
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: TriggerField
  ) {
    if (trigger && trigger.field === field) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (mentionItems.length === 0) return
        setTrigger(previous => previous
            ? {
                ...previous,
                highlightIndex: Math.min(
                  previous.highlightIndex + 1,
                  mentionItems.length - 1
                )
              }
            : null)

        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (mentionItems.length === 0) return
        setTrigger(previous => previous
            ? {
                ...previous,
                highlightIndex: Math.max(previous.highlightIndex - 1, 0)
              }
            : null)

        return
      }

      if (event.key === 'Enter' && mentionItems.length > 0) {
        event.preventDefault()
        selectMentionItem(mentionItems[trigger.highlightIndex])

        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setTrigger(null)

        return
      }
    }

    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleSave()
    }
  }

  function handleSave() {
    if (!subject.trim()) {
      toast.error(t('quickTask.nameRequired'))
      subjectRef.current?.focus()

      return
    }

    const payload: Record<string, unknown> = {
      subject: subject.trim(),
      status: isBacklog ? BACKLOG_STATUS_ID : OPEN_STATUS_ID
    }

    if (description.trim()) payload.description = description.trim()
    if (organizationId) payload.organization = organizationId
    if (dealId) payload.deal = dealId
    if (recordOwnerId) payload.record_owner = recordOwnerId
    if (dueDate) payload.end_date = format(dueDate, "yyyy-MM-dd'T'00:00:00xxx")

    createTask.mutate(payload, {
      onSuccess: () => {
        if (createMore) {
          setSubject('')
          setDescription('')
          setShowDescription(false)
          setTrigger(null)
          requestAnimationFrame(() => subjectRef.current?.focus())

          return
        }

        onOpenChange(false)
      }
    })
  }

  const mentionEmptyLabel =
    trigger?.type === '@'
      ? t('quickTask.noUsers')
      : organizationId
        ? t('quickTask.noDeals')
        : t('quickTask.noOrganizations')
  const isSubjectMentionOpen = trigger ? trigger.field === 'subject' : false
  const isDescriptionMentionOpen = trigger
    ? trigger.field === 'description'
    : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(80rem,calc(100vw-3rem))] max-w-none gap-0 overflow-hidden p-0 sm:max-w-[min(80rem,calc(100vw-3rem))]"
        onEscapeKeyDown={(event) => {
          if (!trigger) return
          event.preventDefault()
          setTrigger(null)
        }}
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement

          if (target.closest('[data-slot="popover-content"]')) {
            event.preventDefault()
          }
        }}>
        <DialogTitle className="sr-only">{t('tasks.newTask')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('quickTask.dialogDescription')}
        </DialogDescription>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3">
          <CheckCheck className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('quickTask.createOn')}
          </span>

          <Popover
            open={organizationPopoverOpen}
            onOpenChange={setOrganizationPopoverOpen}>
            <PopoverTrigger asChild>
              {organizationName ? (
                <button
                  type="button"
                  className="inline-flex max-w-52 items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100">
                  <BriefcaseBusiness className="size-3.5 shrink-0" />
                  <span className="truncate">{organizationName}</span>
                  <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
                </button>
              ) : (
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground">
                  {t('quickTask.selectOrganization')}
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={t('quickTask.searchOrganizations')} />
                <CommandList>
                  <CommandEmpty>{t('quickTask.noOrganizations')}</CommandEmpty>
                  <CommandGroup>
                    {companies.map((company: any) => (
                      <CommandItem
                        key={company.id}
                        value={company.name}
                        onSelect={() => {
                          setOrganizationId(company.id)
                          setDealId('')
                          setOrganizationPopoverOpen(false)
                        }}>
                        <CheckIcon
                          className={cn(
                            'mr-2 size-4',
                            organizationId === company.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )} />
                        {company.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {organizationId && (
            <>
              <span className="text-sm text-muted-foreground">/</span>
              <Popover open={dealPopoverOpen} onOpenChange={setDealPopoverOpen}>
                <PopoverTrigger asChild>
                  {dealName ? (
                    <button
                      type="button"
                      className="inline-flex max-w-60 items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-100">
                      <CheckCheck className="size-3.5 shrink-0" />
                      <span className="truncate">{dealName}</span>
                      <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground">
                      {t('quickTask.selectDeal')}
                    </button>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('quickTask.searchDeals')} />
                    <CommandList>
                      <CommandEmpty>{t('quickTask.noDeals')}</CommandEmpty>
                      <CommandGroup>
                        {organizationDeals.map((deal: any) => (
                          <CommandItem
                            key={deal.id}
                            value={getDealLabel(deal)}
                            onSelect={() => {
                              setDealId(deal.id)
                              setDealPopoverOpen(false)
                            }}>
                            <CheckIcon
                              className={cn(
                                'mr-2 size-4',
                                dealId === deal.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )} />
                            {getDealLabel(deal)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}

          <DialogClose className="ml-auto rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <XIcon className="size-4" />
            <span className="sr-only">{t('common.close')}</span>
          </DialogClose>
        </div>

        <div className="border-t" />

        <div className="min-h-[220px] px-4 py-4">
          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <Popover open={isSubjectMentionOpen}>
                <PopoverAnchor asChild>
                  <input
                    ref={subjectRef}
                    type="text"
                    value={subject}
                    className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
                    placeholder={t('quickTask.namePlaceholder')}
                    onChange={event => updateTrigger(
                        event.target.value,
                        event.target.selectionStart ?? 0,
                        'subject'
                      )}
                    onKeyDown={event => handleKeyDown(event, 'subject')} />
                </PopoverAnchor>
                {isSubjectMentionOpen ? (
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="w-64 p-1"
                    onOpenAutoFocus={event => event.preventDefault()}
                    onCloseAutoFocus={event => event.preventDefault()}>
                    <MentionList
                      items={mentionItems}
                      emptyLabel={mentionEmptyLabel}
                      highlightIndex={trigger.highlightIndex}
                      onHighlight={highlightIndex => setTrigger(previous => previous ? { ...previous, highlightIndex } : null)}
                      onSelect={selectMentionItem} />
                  </PopoverContent>
                ) : null}
              </Popover>
            </div>
          </div>

          <div className="mt-3">
            {showDescription ? (
              <div className="border-t pt-3">
                <Popover open={isDescriptionMentionOpen}>
                  <PopoverAnchor asChild>
                    <textarea
                      ref={descriptionRef}
                      value={description}
                      className="min-h-[110px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder={t('quickTask.descriptionPlaceholder')}
                      onChange={event => updateTrigger(
                          event.target.value,
                          event.target.selectionStart,
                          'description'
                        )}
                      onKeyDown={event => handleKeyDown(event, 'description')} />
                  </PopoverAnchor>
                  {isDescriptionMentionOpen ? (
                    <PopoverContent
                      align="start"
                      sideOffset={8}
                      className="w-64 p-1"
                      onOpenAutoFocus={event => event.preventDefault()}
                      onCloseAutoFocus={event => event.preventDefault()}>
                      <MentionList
                        items={mentionItems}
                        emptyLabel={mentionEmptyLabel}
                        highlightIndex={trigger.highlightIndex}
                        onHighlight={highlightIndex => setTrigger(previous => previous ? { ...previous, highlightIndex } : null)}
                        onSelect={selectMentionItem} />
                    </PopoverContent>
                  ) : null}
                </Popover>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                onClick={() => {
                  setShowDescription(true)
                  requestAnimationFrame(() => descriptionRef.current?.focus())
                }}>
                <PlusIcon className="size-3.5" />
                {t('quickTask.addDetails')}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-2.5 sm:flex-row sm:items-center sm:gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1.5 text-muted-foreground',
                    dueDate && 'text-blue-600'
                  )}>
                  <CalendarIcon className="size-3.5" />
                  <span className="truncate">
                    {dueDate ? format(dueDate, 'PPP') : t('quickTask.dueDate')}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(value) => {
                    setDueDate(value)
                    setDatePopoverOpen(false)
                  }}
                  initialFocus />
              </PopoverContent>
            </Popover>

            <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1.5 text-muted-foreground',
                    recordOwnerId && 'text-blue-600'
                  )}>
                  <AtSign className="size-3.5" />
                  <span className="truncate">
                    {assigneeName || t('quickTask.assignee')}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder={t('quickTask.searchUsers')} />
                  <CommandList>
                    <CommandEmpty>{t('quickTask.noUsers')}</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => {
                        const label =
                          `${user.firstname} ${user.lastname}`.trim() ||
                          user.email

                        return (
                          <CommandItem
                            key={user.id}
                            value={label}
                            onSelect={() => {
                              setRecordOwnerId(
                                user.id === recordOwnerId ? '' : user.id!
                              )
                              setUserPopoverOpen(false)
                            }}>
                            <CheckIcon
                              className={cn(
                                'mr-2 size-4',
                                user.id === recordOwnerId
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )} />
                            <Avatar className="mr-2 size-6">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(label)}
                              </AvatarFallback>
                            </Avatar>
                            {label}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                checked={isBacklog}
                onCheckedChange={setIsBacklog}
                className="scale-75" />
              {t('quickTask.backlog')}
            </label>
          </div>

          <Separator className="sm:hidden" />

          <div className="flex items-center gap-3 sm:ml-auto">
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              <Switch
                checked={createMore}
                onCheckedChange={setCreateMore}
                className="scale-75" />
              {t('quickTask.createMore')}
            </label>

            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={createTask.isPending}
                className="bg-blue-600 hover:bg-blue-700">
                {createTask.isPending && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                {t('tasks.form.createButton')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
