/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { DealFormData } from '@/schemas/deal-schema'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
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
import { Combobox } from '@/components/ui/combobox'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { dealFormSchema } from '@/schemas/deal-schema'
import { useCreateDeal, useUpdateDeal } from '@/hooks/use-deals'
import { useCompanies } from '@/hooks/use-companies'
import { useEnumOptions } from '@/hooks/use-enums'
import { cn } from '@/lib/utils'

interface DealFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal?: any
  mode: 'create' | 'edit'
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  mode,
}: DealFormDialogProps) {
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const { data: companies = [] } = useCompanies()
  const { options: stageOptions = [] } = useEnumOptions('stage')
  const { options: leadSourceOptions = [] } = useEnumOptions('lead_source')
  const { options: customerTypeOptions = [] } = useEnumOptions('customer_type')
  const { options: countryOptions = [] } = useEnumOptions('country')

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    deal?.expected_closing_date
      ? new Date(deal.expected_closing_date)
      : undefined,
  )

  const form = useForm<DealFormData>({
    defaultValues: {
      organizations:
        typeof deal?.organizations === 'object'
          ? deal.organizations.id
          : deal?.organizations || '',
      contact_person:
        typeof deal?.contact_person === 'object'
          ? deal.contact_person.id
          : deal?.contact_person || '',
      stage: deal?.stage || '',
      deal_value: deal?.deal_value || undefined,
      expected_revenue: deal?.expected_revenue || undefined,
      close_probability: deal?.close_probability || undefined,
      expected_closing_date: deal?.expected_closing_date || undefined,
      lead_source: deal?.lead_source || '',
      customer_type: deal?.customer_type || '',
      country: deal?.country || '',
      hot_prospect: deal?.hot_prospect || false,
      record_owner: deal?.record_owner || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: dealFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (mode === 'create') {
        await createDeal.mutateAsync(value)
      } else if (deal?.id) {
        await updateDeal.mutateAsync({ dealId: deal.id, data: value })
      }
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (selectedDate) {
      form.setFieldValue('expected_closing_date', selectedDate.toISOString())
    }
  }, [selectedDate, form])

  const companyOptions = companies.map((company: any) => ({
    label: company.name,
    value: company.id,
  }))

  const isSubmitting = createDeal.isPending || updateDeal.isPending

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === 'create' ? 'Create New Deal' : 'Edit Deal'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'create'
              ? 'Enter the details for the new deal'
              : 'Update the deal information'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Organization Field */}
              <form.Field name="organizations">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>
                      Organization <span className="text-destructive">*</span>
                    </Label>
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

              {/* Stage Field */}
              <form.Field name="stage">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>
                      Stage <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((option: any) => (
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

              {/* Deal Value Field */}
              <form.Field name="deal_value">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Deal Value</Label>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                    {field.state.meta.errors && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Expected Revenue Field */}
              <form.Field name="expected_revenue">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Expected Revenue</Label>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                    {field.state.meta.errors && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Close Probability Field */}
              <form.Field name="close_probability">
                {(field) => (
                  <Field className="col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.name}>
                        Close Probability: {field.state.value || 0}%
                      </Label>
                    </div>
                    <Slider
                      value={[field.state.value || 0]}
                      onValueChange={(value) => field.handleChange(value[0])}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    {field.state.meta.errors && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Expected Closing Date Field */}
              <form.Field name="expected_closing_date">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Expected Closing Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !selectedDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
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

              {/* Lead Source Field */}
              <form.Field name="lead_source">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Lead Source</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSourceOptions.map((option: any) => (
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

              {/* Customer Type Field */}
              <form.Field name="customer_type">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Customer Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customerTypeOptions.map((option: any) => (
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

              {/* Country Field */}
              <form.Field name="country">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Country</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((option: any) => (
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

              {/* Hot Prospect Field */}
              <form.Field name="hot_prospect">
                {(field) => (
                  <Field>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                      <Label htmlFor={field.name} className="cursor-pointer">
                        Hot Prospect
                      </Label>
                    </div>
                    {field.state.meta.errors && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </Field>
                )}
              </form.Field>
            </div>
          </div>

          <ResponsiveDialogFooter>
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
              {mode === 'create' ? 'Create Deal' : 'Update Deal'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
