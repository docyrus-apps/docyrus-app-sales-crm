'use client'

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'

import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import {
  type LogActivityPayload,
  type SectionHandle,
  type StatusOption,
} from '../types'

function StatusOptionLabel({ option }: { option: StatusOption }) {
  return (
    <span className="flex items-center gap-2">
      {option.color && (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: option.color }}
        />
      )}
      {option.name}
    </span>
  )
}

interface StatusSectionProps {
  statusOptions?: Array<StatusOption>
  disabled: boolean
}

interface StatusDraft {
  statusId: string
  secondaryStatusId: string
  description: string
  followupDate: Date | null
}

export const StatusSection = forwardRef<SectionHandle, StatusSectionProps>(
  ({ statusOptions = [], disabled }, ref) => {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [datePickerOpen, setDatePickerOpen] = useState(false)

    const [committed, setCommitted] = useState<StatusDraft>({
      statusId: '',
      secondaryStatusId: '',
      description: '',
      followupDate: null,
    })

    const [draft, setDraft] = useState<StatusDraft>({
      statusId: '',
      secondaryStatusId: '',
      description: '',
      followupDate: null,
    })

    const parentOptions = useMemo(
      () => statusOptions.filter((o) => !o.parent),
      [statusOptions],
    )

    const childOptionsForDraft = useMemo(
      () => statusOptions.filter((o) => o.parent === draft.statusId),
      [statusOptions, draft.statusId],
    )

    const selectedOption = useMemo(
      () => statusOptions.find((o) => o.id === committed.statusId) ?? null,
      [statusOptions, committed.statusId],
    )

    const secondaryOption = useMemo(
      () =>
        statusOptions.find((o) => o.id === committed.secondaryStatusId) ?? null,
      [statusOptions, committed.secondaryStatusId],
    )

    const handleOpenChange = useCallback(
      (isOpen: boolean) => {
        if (isOpen) {
          setDraft({ ...committed })
          setDatePickerOpen(false)
        }

        setPopoverOpen(isOpen)
      },
      [committed],
    )

    const handleSelectStatus = useCallback((statusId: string) => {
      setDraft((prev) => ({
        ...prev,
        statusId,
        secondaryStatusId:
          statusId === prev.statusId ? prev.secondaryStatusId : '',
      }))
    }, [])

    const handleConfirm = useCallback(() => {
      setCommitted({ ...draft })
      setPopoverOpen(false)
    }, [draft])

    useImperativeHandle(ref, () => ({
      getData: (): Partial<LogActivityPayload> => ({
        statusId: committed.statusId || undefined,
        secondaryStatusId: committed.secondaryStatusId || undefined,
        statusDescription: committed.description || undefined,
        followupDate: committed.followupDate,
      }),
      reset: () => {
        const empty: StatusDraft = {
          statusId: '',
          secondaryStatusId: '',
          description: '',
          followupDate: null,
        }

        setCommitted(empty)
        setDraft(empty)
      },
      isEmpty: () => !committed.statusId,
    }))

    return (
      <div className="flex flex-col gap-1">
        <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              disabled={disabled}
              className={cn(
                'w-full justify-between text-sm',
                selectedOption && 'h-auto py-1.5',
              )}
            >
              {selectedOption ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 text-xs font-medium"
                      >
                        <StatusOptionLabel option={selectedOption} />
                      </Badge>
                      {secondaryOption && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            /
                          </span>
                          <Badge
                            variant="outline"
                            className="gap-1 px-1.5 py-0 text-xs font-normal"
                          >
                            <StatusOptionLabel option={secondaryOption} />
                          </Badge>
                        </>
                      )}
                    </span>
                    {committed.description && (
                      <span className="truncate text-left text-xs text-muted-foreground">
                        {committed.description}
                      </span>
                    )}
                  </div>
                  {committed.followupDate && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(committed.followupDate, 'MMM d')}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Select status...</span>
              )}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0"
            align="start"
          >
            <div className="flex flex-col">
              {/* Status list */}
              <div className="max-h-48 overflow-y-auto p-1">
                {parentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      draft.statusId === option.id && 'bg-accent',
                    )}
                    onClick={() => handleSelectStatus(option.id)}
                  >
                    <Check
                      className={cn(
                        'size-4 shrink-0',
                        draft.statusId === option.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    <StatusOptionLabel option={option} />
                  </button>
                ))}
              </div>

              {/* Inline form */}
              {draft.statusId && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3 p-3">
                    {/* Sub-status */}
                    {childOptionsForDraft.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Sub-status</Label>
                        <Select
                          value={draft.secondaryStatusId}
                          onValueChange={(v) =>
                            setDraft((prev) => ({
                              ...prev,
                              secondaryStatusId: v,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Select reason..." />
                          </SelectTrigger>
                          <SelectContent>
                            {childOptionsForDraft.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <StatusOptionLabel option={option} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={draft.description}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Add notes..."
                        className="min-h-16 resize-none text-xs"
                      />
                    </div>

                    {/* Follow-up date */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Follow-up date</Label>
                      <Popover
                        open={datePickerOpen}
                        onOpenChange={setDatePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              'w-full justify-start text-left text-xs font-normal',
                              !draft.followupDate && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 size-3.5" />
                            {draft.followupDate
                              ? format(draft.followupDate, 'PPP')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={draft.followupDate ?? undefined}
                            onSelect={(date) => {
                              setDraft((prev) => ({
                                ...prev,
                                followupDate: date ?? null,
                              }))
                              setDatePickerOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Confirm */}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleConfirm}
                    >
                      Confirm
                    </Button>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)

StatusSection.displayName = 'StatusSection'
