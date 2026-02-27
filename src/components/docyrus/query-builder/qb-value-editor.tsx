'use client';

import { memo, useId, useMemo } from 'react';

import { type ValueEditorProps, useValueEditor, getFirstOption } from 'react-querybuilder';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const QBValueEditor = memo((allProps: ValueEditorProps) => {
  const {
    className,
    handleOnChange,
    inputType,
    operator,
    value,
    title,
    disabled,
    type,
    values = [],
    fieldData,
    testID
  } = allProps;

  useValueEditor(allProps);

  const id = useId();
  const ariaLabel = title || fieldData?.label || 'Value';

  const flatValues = useMemo(() => {
    const flat: { name: string; label: string }[] = [];

    for (const opt of values) {
      if ('options' in opt && Array.isArray(opt.options)) {
        for (const subOpt of opt.options) {
          flat.push({
            name: String(subOpt.name ?? subOpt.value ?? subOpt.label),
            label: String(subOpt.label)
          });
        }
      } else {
        flat.push({
          name: String((opt as { name?: string; value?: string }).name ?? (opt as { value?: string }).value ?? opt.label),
          label: String(opt.label)
        });
      }
    }

    return flat;
  }, [values]);

  if (operator === 'null' || operator === 'notNull') {
    return null;
  }

  switch (type) {
    case 'select':

    case 'multiselect':
      return (
        <Select
          value={String(value ?? getFirstOption(values) ?? '')}
          disabled={disabled}
          onValueChange={handleOnChange}>
          <SelectTrigger
            className={cn('qb-control h-8 min-w-[120px] text-xs', className)}
            title={title}
            aria-label={ariaLabel}
            size="sm"
            data-testid={testID}>
            <SelectValue placeholder={title} />
          </SelectTrigger>
          <SelectContent>
            {flatValues.map(opt => (
              <SelectItem key={opt.name} value={opt.name}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'checkbox':
      return (
        <div
          className={cn('qb-control flex items-center gap-2', className)}
          data-testid={testID}>
          <Checkbox
            id={id}
            checked={!!value}
            disabled={disabled}
            onCheckedChange={v => handleOnChange(v)}
            title={title}
            aria-label={ariaLabel} />
          <Label htmlFor={id} className="text-xs">
            {fieldData?.label ?? title}
          </Label>
        </div>
      );

    case 'switch':
      return (
        <div
          className={cn('qb-control flex items-center gap-2', className)}
          data-testid={testID}>
          <Switch
            id={id}
            size="sm"
            checked={!!value}
            disabled={disabled}
            onCheckedChange={v => handleOnChange(v)}
            title={title}
            aria-label={ariaLabel} />
          <Label htmlFor={id} className="text-xs">
            {fieldData?.label ?? title}
          </Label>
        </div>
      );

    case 'radio':
      return (
        <RadioGroup
          value={String(value ?? '')}
          disabled={disabled}
          onValueChange={handleOnChange}
          className={cn('qb-control flex flex-row gap-3', className)}
          title={title}
          aria-label={ariaLabel}
          data-testid={testID}>
          {flatValues.map(opt => (
            <div key={opt.name} className="flex items-center gap-1.5">
              <RadioGroupItem value={opt.name} id={`${id}-${opt.name}`} />
              <Label htmlFor={`${id}-${opt.name}`} className="text-xs">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'textarea':
      return (
        <Textarea
          value={String(value ?? '')}
          title={title}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('qb-control h-8 min-h-8 min-w-[180px] text-xs', className)}
          onChange={e => handleOnChange(e.target.value)}
          data-testid={testID} />
      );

    default:
      return (
        <Input
          type={inputType || 'text'}
          value={String(value ?? '')}
          title={title}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('qb-control h-8 min-w-[140px] text-xs', className)}
          onChange={e => handleOnChange(e.target.value)}
          data-testid={testID} />
      );
  }
});

QBValueEditor.displayName = 'QBValueEditor';

export { QBValueEditor };