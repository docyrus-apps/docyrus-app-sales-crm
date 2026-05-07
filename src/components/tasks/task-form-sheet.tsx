/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { TaskFormData } from '@/schemas/task-schema'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader,
} from '@/components/docyrus/awesome-dialog'
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
import { Combobox } from '@/components/ui/combobox-simple'
import { Calendar } from '@/components/ui/calendar'
import {
  ComboboxAnchor,
  ComboboxBadgeItem,
  ComboboxBadgeList,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
  Combobox as MultiCombobox,
} from '@/components/ui/combobox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { taskFormSchema } from '@/schemas/task-schema'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useCompanies } from '@/hooks/use-companies'
import { useUsers } from '@/hooks/use-users'
import { useEnumOptions } from '@/hooks/use-enums'
import { cn } from '@/lib/utils'

interface TaskFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: any
  mode: 'create' | 'edit'
  onSubmitSuccess?: () => void | Promise<void>
}

export function TaskFormSheet({
  open,
  onOpenChange,
  task,
  mode,
  onSubmitSuccess,
}: TaskFormSheetProps) {
  const { t } = useTranslation()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: companies = [] } = useCompanies()
  const { data: users = [] } = useUsers()
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
      status:
        typeof task?.status === 'object' ? task.status.id : task?.status || '',
      organization:
        typeof task?.organization === 'object'
          ? task.organization.id
          : task?.organization || '',
      record_owner:
        typeof task?.record_owner === 'object'
          ? task.record_owner.id
          : task?.record_owner || '',
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
      followers: Array.isArray(task?.followers)
        ? task.followers.map((follower: any) =>
            typeof follower === 'object' ? follower.id : follower,
          )
        : [],
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: taskFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Clean up empty strings (convert to undefined for UUID fields)
      const cleanedData = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          val === '' ? undefined : val,
        ]),
      )

      if (mode === 'create') {
        await createTask.mutateAsync(cleanedData)
      } else if (task?.id) {
        await updateTask.mutateAsync({ taskId: task.id, data: cleanedData })
      }

      await onSubmitSuccess?.()
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

  const userOptions = users.map((user: any) => ({
    label: `${user.firstname} ${user.lastname}`,
    value: user.id,
  }))

  const isSubmitting = createTask.isPending || updateTask.isPending

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="sheet"
      side="right"
      size="default"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <AwesomeDialogHeader
          title={
            mode === 'create'
              ? t('tasks.form.createTitle')
              : t('tasks.form.editTitle')
          }
          description={
            mode === 'create'
              ? t('tasks.form.createDescription')
              : t('tasks.form.editDescription')
          }
        />

        <AwesomeDialogBody className="space-y-4">
          {/* Subject Field */}
          <form.Field name="subject">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.subjectLabel')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t('tasks.form.subjectPlaceholder')}
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Description Field */}
          <form.Field name="description">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.descriptionLabel')}
                </Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t('tasks.form.descriptionPlaceholder')}
                  rows={4}
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Status Field */}
          <form.Field name="status">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.statusLabel')}
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('tasks.form.statusPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Organization Field */}
          <form.Field name="organization">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.organizationLabel')}
                </Label>
                <Combobox
                  options={companyOptions}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  placeholder={t('tasks.form.organizationPlaceholder')}
                  emptyText={t('tasks.form.organizationEmpty')}
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Start Date Field */}
          <form.Field name="start_date">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.startDateLabel')}
                </Label>
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
                        <span>{t('common.pickADate')}</span>
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
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* End Date Field */}
          <form.Field name="end_date">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.dueDateLabel')}
                </Label>
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
                        <span>{t('common.pickADate')}</span>
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
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Record Owner Field */}
          <form.Field name="record_owner">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.recordOwnerLabel')}
                </Label>
                <Combobox
                  options={userOptions}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  placeholder={t('tasks.form.recordOwnerPlaceholder')}
                  emptyText={t('tasks.form.recordOwnerEmpty')}
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          {/* Followers Field */}
          <form.Field name="followers">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>
                  {t('tasks.form.followersLabel')}
                </Label>
                <MultiCombobox
                  value={field.state.value || []}
                  onValueChange={(value) => field.handleChange(value)}
                  multiple
                >
                  <ComboboxAnchor>
                    <ComboboxBadgeList>
                      {(field.state.value || []).map((followerId: string) => {
                        const user = users.find((u: any) => u.id === followerId)
                        return user ? (
                          <ComboboxBadgeItem
                            key={followerId}
                            value={followerId}
                          >
                            {user.firstname} {user.lastname}
                          </ComboboxBadgeItem>
                        ) : null
                      })}
                    </ComboboxBadgeList>
                    <ComboboxInput
                      placeholder={t('tasks.form.followersPlaceholder')}
                    />
                    <ComboboxTrigger />
                  </ComboboxAnchor>
                  <ComboboxContent>
                    <ComboboxEmpty>
                      {t('tasks.form.followersEmpty')}
                    </ComboboxEmpty>
                    {userOptions.map((option: any) => (
                      <ComboboxItem key={option.value} value={option.value}>
                        {option.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxContent>
                </MultiCombobox>
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string'
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message ||
                        t('common.validationError')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create'
              ? t('tasks.form.createButton')
              : t('tasks.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
