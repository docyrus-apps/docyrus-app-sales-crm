/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { TaskFormData } from '@/schemas/task-schema'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { Calendar } from '@/components/ui/calendar'
import { TagsInput } from '@/components/ui/tags-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { taskFormSchema } from '@/schemas/task-schema'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useCompanies } from '@/hooks/use-companies'
import { useEnumOptions } from '@/hooks/use-enums'
import { cn } from '@/lib/utils'

interface TaskFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: any
  mode: 'create' | 'edit'
}

export function TaskFormSheet({
  open,
  onOpenChange,
  task,
  mode,
}: TaskFormSheetProps) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: companies = [] } = useCompanies()
  const { options: statusOptions = [] } = useEnumOptions('status')

  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.start_date ? new Date(task.start_date) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    task?.end_date ? new Date(task.end_date) : undefined,
  )

  const form = useForm<TaskFormData>({
    defaultValues: {
      subject: task?.subject || '',
      description: task?.description || '',
      start_date: task?.start_date || undefined,
      end_date: task?.end_date || undefined,
      status: task?.status || '',
      organization:
        typeof task?.organization === 'object'
          ? task.organization.id
          : task?.organization || '',
      record_owner: task?.record_owner || '',
      parent:
        typeof task?.parent === 'object' ? task.parent.id : task?.parent || '',
      section:
        typeof task?.section === 'object'
          ? task.section.id
          : task?.section || '',
      project:
        typeof task?.project === 'object'
          ? task.project.id
          : task?.project || '',
      followers: task?.followers || [],
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: taskFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (mode === 'create') {
        await createTask.mutateAsync(value)
      } else if (task?.id) {
        await updateTask.mutateAsync({ taskId: task.id, data: value })
      }
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (startDate) {
      form.setFieldValue('start_date', startDate.toISOString())
    }
  }, [startDate, form])

  useEffect(() => {
    if (endDate) {
      form.setFieldValue('end_date', endDate.toISOString())
    }
  }, [endDate, form])

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id,
  }))

  const isSubmitting = createTask.isPending || updateTask.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Enter the details for the new task'
              : 'Update the task information'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4 py-4"
        >
          {/* Subject Field */}
          <form.Field name="subject">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter task subject..."
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Description Field */}
          <form.Field name="description">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter task description..."
                  rows={4}
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Status Field */}
          <form.Field name="status">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Status</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Organization Field */}
          <form.Field name="organization">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Organization</Label>
                <Combobox
                  options={companyOptions}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  placeholder="Select organization..."
                  emptyText="No organization found"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Start Date Field */}
          <form.Field name="start_date">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* End Date Field */}
          <form.Field name="end_date">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Followers Field */}
          <form.Field name="followers">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Followers</Label>
                <TagsInput
                  value={field.state.value || []}
                  onValueChange={field.handleChange}
                  placeholder="Add follower emails..."
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'create' ? 'Create Task' : 'Update Task'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
