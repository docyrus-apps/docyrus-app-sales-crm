import { useDateFnsLocale } from '@/hooks/use-date-fns-locale'
import { useFormErrorReset } from '@/hooks/use-form-store'
import { resolveFieldErrorMessage } from '@/lib/form-field-error'
import { useEffect, useMemo, useState } from 'react'

import type { TaskFormData } from '@/schemas/task-schema'

import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { FormSubmitAlert } from '@/components/crm/form-submit-alert'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Combobox as MultiCombobox
} from '@/components/ui/combobox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { taskFormSchema } from '@/schemas/task-schema'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useCompanies } from '@/hooks/use-companies'
import { useDeals } from '@/hooks/use-deals'
import { useUsers } from '@/hooks/use-users'
import { useEnumOptions } from '@/hooks/use-enums'
import { cn } from '@/lib/utils'
import {
  getSubmitFailureMessage,
  validateSubmitValues
} from '@/lib/form-submit-feedback'

interface TaskFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  mode: 'create' | 'edit';
  onSubmitSuccess?: () => void | Promise<void>;
  /**
   * When creating from a record detail page, the parent relation column on
   * `base.task` (e.g. `lead`, `contact`, `organization`, `deal`) and the parent
   * record id. The new task is auto-associated with this parent on submit.
   */
  parentField?: string;
  parentId?: string;
}

function getRelationValue(value: unknown): string {
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id?: string | null }).id ?? '')
  }

  return typeof value === 'string' ? value : ''
}

function getMultiRelationValues(value: unknown): Array<string> {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    const id = getRelationValue(item)

    return id ? [id] : []
  })
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  if (!value) return undefined

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}

function getUserLabel(user: any): string {
  const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(' ')

  return fullName || user?.name || user?.email || user?.id || ''
}

const EMPTY_FOLLOWERS: Array<string> = []

function normalizeMultiComboboxValue(value: unknown): Array<string> {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (typeof value === 'string' && value) return [value]

  return []
}

/*
 * `parentField`/`parentId` used to be injected into the submit payload only, so
 * a task opened from a company/deal/contact saved against the right parent but
 * rendered that relation field *empty* — the user could not tell what the task
 * would be linked to, and often re-picked it by hand. Seed the default value so
 * the field shows the parent it is already bound to.
 */
function buildTaskFormDefaults(
  task: any,
  parentField?: string,
  parentId?: string
): TaskFormData {
  const seeded = (slug: string, value: string) => value || (parentField === slug && parentId ? parentId : '')

  return {
    subject: task?.subject || '',
    description: task?.description || '',
    start_date: task?.start_date || undefined,
    end_date: task?.end_date || undefined,
    status: getRelationValue(task?.status),
    priority: getRelationValue(task?.priority),
    organization: seeded('organization', getRelationValue(task?.organization)),
    deal: seeded('deal', getRelationValue(task?.deal)),
    record_owner: getRelationValue(task?.record_owner),
    parent: getRelationValue(task?.parent),
    section: getRelationValue(task?.section),
    project: getRelationValue(task?.project),
    followers: getMultiRelationValues(task?.followers)
  }
}

export function TaskFormSheet({
  open,
  onOpenChange,
  task,
  mode,
  onSubmitSuccess,
  parentField,
  parentId
}: TaskFormSheetProps) {
  const { t } = useTranslation()
  const dateLocale = useDateFnsLocale()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: companies = [] } = useCompanies()
  const { data: deals = [] } = useDeals({ columns: ['id', 'name'] })
  const { data: users = [] } = useUsers()
  const { options: statusOptions = [] } = useEnumOptions('status', {
    appSlug: 'base',
    dataSourceSlug: 'task'
  })
  const { options: priorityOptions = [] } = useEnumOptions('priority', {
    appSlug: 'base',
    dataSourceSlug: 'task'
  })

  const initialValues = useMemo(
    () => buildTaskFormDefaults(task, parentField, parentId),
    [task, parentField, parentId]
  )
  const [startDate, setStartDate] = useState<Date | undefined>(
    parseOptionalDate(initialValues.start_date)
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseOptionalDate(initialValues.end_date)
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<TaskFormData>({
    defaultValues: initialValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: taskFormSchema,
      onSubmit: taskFormSchema
    },
    onSubmit: async ({ value }) => {
      try {
        setSubmitError(null)
        // Clean up empty strings (convert to undefined for UUID fields)
        const cleanedData = Object.fromEntries(
          Object.entries(value).map(([key, val]) => [key, val === '' ? undefined : val])
        )

        if (mode === 'create') {
          const payload =
            parentField && parentId
              ? { ...cleanedData, [parentField]: parentId }
              : cleanedData

          await createTask.mutateAsync(payload)
        } else if (task?.id) {
          await updateTask.mutateAsync({ taskId: task.id, data: cleanedData })
        }

        await onSubmitSuccess?.()
        onOpenChange(false)
      } catch (error) {
        setSubmitError(getSubmitFailureMessage(error, t))
      }
    }
  })

  useEffect(() => {
    if (!open) return

    form.reset(initialValues)
    setStartDate(parseOptionalDate(initialValues.start_date))
    setEndDate(parseOptionalDate(initialValues.end_date))
    setSubmitError(null)
  }, [
form,
initialValues,
open,
mode
])

  useFormErrorReset(form.store, setSubmitError)

  useEffect(() => {
    form.setFieldValue(
      'start_date',
      startDate ? startDate.toISOString() : undefined
    )
  }, [startDate, form])

  useEffect(() => {
    form.setFieldValue('end_date', endDate ? endDate.toISOString() : undefined)
  }, [endDate, form])

  /*
   * A record whose name was never filled in arrives with `name: null`. Passing
   * that through as a label crashed the dropdown (cmdk trims every keyword), so
   * fall back to a placeholder that still identifies the row as selectable.
   */
  const companyOptions = companies
    .filter((company: any) => company?.id)
    .map((company: any) => ({
      label: company.name || t('common.unnamedRecord'),
      value: company.id
    }))
  const dealOptions = deals
    .filter((deal: any) => deal?.id)
    .map((deal: any) => ({
      label: deal.name || t('common.unnamedRecord'),
      value: deal.id
    }))

  const userOptions = users
    .map((user: any) => ({
      label: getUserLabel(user),
      value: user.id
    }))
    .filter(option => option.value && option.label)

  /*
   * `MultiCombobox` (DiceUI) scores each item against its `value`, and our
   * follower items carry the user *id* as their value. Without this the search
   * matches UUIDs, so typing a name returns "no users found" even though the
   * list holds every user. Resolve the id back to its label and match on that.
   */
  const filterFollowerOptions = (values: Array<string>, term: string) => {
    const needle = term.trim().toLocaleLowerCase()

    if (!needle) return values

    return values.filter((value) => {
      const label =
        userOptions.find((option: any) => option.value === value)?.label ?? value

      return label.toLocaleLowerCase().includes(needle)
    })
  }
  const priorityComboboxOptions = priorityOptions.map((option: any) => ({
    label: option.label,
    value: option.value,
    color: option.color,
    icon: option.icon
  }))
  const statusComboboxOptions = statusOptions.map((option: any) => ({
    label: option.label,
    value: option.value,
    color: option.color,
    icon: option.icon
  }))

  const isSubmitting = createTask.isPending || updateTask.isPending
  const fieldLabels = {
    subject: t('tasks.form.subjectLabel')
  }
  const handleFormSubmit = () => {
    const validationMessage = validateSubmitValues(
      taskFormSchema,
      form.state.values,
      fieldLabels,
      t
    )

    if (validationMessage) {
      setSubmitError(validationMessage)
      toast.error(validationMessage)

      return
    }

    setSubmitError(null)
    void form.handleSubmit()
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="sheet"
      side="right"
      size="xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleFormSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden">
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
          } />

        <AwesomeDialogBody className="space-y-4">
          <FormSubmitAlert
            title={t('common.validationError')}
            message={submitError} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Subject Field */}
            <form.Field name="subject">
              {field => (
                <Field className="sm:col-span-2">
                  <Label htmlFor={field.name}>
                    {t('tasks.form.subjectLabel')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('tasks.form.subjectPlaceholder')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Description Field */}
            <form.Field name="description">
              {field => (
                <Field className="sm:col-span-2">
                  <Label htmlFor={field.name}>
                    {t('tasks.form.descriptionLabel')}
                  </Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('tasks.form.descriptionPlaceholder')}
                    rows={4} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Status Field */}
            <form.Field name="status">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('tasks.form.statusLabel')}
                  </Label>
                  <Combobox
                    options={statusComboboxOptions}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    placeholder={t('tasks.form.statusPlaceholder')}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Priority Field */}
            <form.Field name="priority">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('tasks.form.priorityLabel', {
                      defaultValue: 'Priority'
                    })}
                  </Label>
                  <Combobox
                    options={priorityComboboxOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('tasks.form.priorityPlaceholder', {
                      defaultValue: 'Select priority'
                    })}
                    emptyText={t('common.noResults', {
                      defaultValue: 'No results'
                    })} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Organization Field */}
            <form.Field name="organization">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('tasks.form.organizationLabel')}
                  </Label>
                  <Combobox
                    options={companyOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('tasks.form.organizationPlaceholder')}
                    emptyText={t('tasks.form.organizationEmpty')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Deal Field */}
            <form.Field name="deal">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('tasks.form.dealLabel')}
                  </Label>
                  <Combobox
                    options={dealOptions}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    placeholder={t('tasks.form.dealPlaceholder')}
                    emptyText={t('tasks.form.dealEmpty')} />
                </Field>
              )}
            </form.Field>

            {/* Start Date Field */}
            <form.Field name="start_date">
              {field => (
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
                          !startDate && 'text-muted-foreground'
                        )}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, 'PPP', { locale: dateLocale })
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
                        initialFocus />
                    </PopoverContent>
                  </Popover>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* End Date Field */}
            <form.Field name="end_date">
              {field => (
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
                          !endDate && 'text-muted-foreground'
                        )}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, 'PPP', { locale: dateLocale })
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
                        initialFocus />
                    </PopoverContent>
                  </Popover>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Record Owner Field */}
            <form.Field name="record_owner">
              {field => (
                <Field>
                  <Label htmlFor={field.name}>
                    {t('tasks.form.recordOwnerLabel')}
                  </Label>
                  <Combobox
                    options={userOptions}
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    placeholder={t('tasks.form.recordOwnerPlaceholder')}
                    emptyText={t('tasks.form.recordOwnerEmpty')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Followers Field */}
            <form.Field name="followers">
              {field => (
                <Field className="sm:col-span-2">
                  <Label htmlFor={field.name}>
                    {t('tasks.form.followersLabel')}
                  </Label>
                  <MultiCombobox
                    value={field.state.value || EMPTY_FOLLOWERS}
                    onValueChange={value => field.handleChange(normalizeMultiComboboxValue(value))}
                    onFilter={filterFollowerOptions}
                    multiple>
                    <ComboboxAnchor>
                      <ComboboxBadgeList>
                        {(field.state.value || []).map((followerId: string) => {
                          const user = users.find(
                            (u: any) => u.id === followerId
                          )
                          const label = user ? getUserLabel(user) : followerId

                          return label ? (
                            <ComboboxBadgeItem
                              key={followerId}
                              value={followerId}>
                              {label}
                            </ComboboxBadgeItem>
                          ) : null
                        })}
                      </ComboboxBadgeList>
                      <ComboboxInput
                        placeholder={t('tasks.form.followersPlaceholder')} />
                      <ComboboxTrigger />
                    </ComboboxAnchor>
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {t('tasks.form.followersEmpty')}
                      </ComboboxEmpty>
                      {userOptions.map((option: any) => (
                        <ComboboxItem
                          key={option.value}
                          value={option.value}
                          label={option.label}>
                          {option.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxContent>
                  </MultiCombobox>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {resolveFieldErrorMessage(field.state.meta.errors[0], t)}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
          </div>
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}>
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
