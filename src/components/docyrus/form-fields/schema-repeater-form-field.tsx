'use client';

import { useState } from 'react';

import {
  ChevronDown, Copy, GripVertical, Plus, Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay
} from '@/components/ui/sortable';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { type DocyrusFormFieldProps, type EnumOption, type IField } from './types';

interface RepeaterItem {
  id: string;
  [key: string]: unknown;
}

export interface SchemaRepeaterFormFieldProps extends DocyrusFormFieldProps {
  /** Sub-field definitions for schema mode. If omitted, key-value mode is used. */
  schema?: IField[];
  /** Enum options for select-based sub-fields */
  schemaEnumOptions?: Record<string, EnumOption[]>;
  /** Maximum number of items */
  maxItems?: number;
  /** Minimum number of items */
  minItems?: number;
  /** Whether items are collapsible */
  collapsible?: boolean;
  /** Whether items start collapsed */
  defaultCollapsed?: boolean;
  /** Add button label */
  addLabel?: string;
  /** Whether items can be cloned */
  cloneable?: boolean;
  /** Dynamic item label function */
  itemLabel?: (item: RepeaterItem, index: number) => string;
}

function SubFieldInput({
  subField,
  value,
  onChange,
  onBlur,
  isDisabled,
  enumOptions
}: {
  subField: IField;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  isDisabled: boolean;
  enumOptions?: EnumOption[];
}) {
  switch (subField.type) {
    case 'field-switch':

    case 'field-checkbox':
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={!!value}
            onCheckedChange={onChange}
            disabled={isDisabled} />
          <span className="text-sm text-muted-foreground">{subField.name}</span>
        </div>
      );

    case 'field-select':

    case 'field-enum':
      return (
        <Select
          value={String(value ?? '')}
          onValueChange={onChange}
          disabled={isDisabled}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={subField.name} />
          </SelectTrigger>
          <SelectContent>
            {enumOptions?.map(opt => (
              <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'field-number':

    case 'field-money':

    case 'field-percent':
      return (
        <Input
          type="number"
          value={value != null ? String(value) : ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
          onBlur={onBlur}
          disabled={isDisabled}
          placeholder={subField.name}
          className="h-8 text-sm" />
      );

    default:
      return (
        <Input
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={isDisabled}
          placeholder={subField.name}
          className="h-8 text-sm" />
      );
  }
}

export function SchemaRepeaterFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  schema,
  schemaEnumOptions,
  maxItems,
  minItems = 0,
  collapsible = true,
  defaultCollapsed = false,
  addLabel = 'Add item',
  cloneable = false,
  itemLabel
}: SchemaRepeaterFormFieldProps) {
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const isDisabled = disabled || fieldConfig.readOnly === true;

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
        const items: RepeaterItem[] = Array.isArray(field.state.value) ? field.state.value : [];

        const addItem = () => {
          if (maxItems && items.length >= maxItems) return;

          const newItem: RepeaterItem = { id: crypto.randomUUID() };

          if (schema) {
            for (const sf of schema) {
              newItem[sf.slug] = sf.defaultValue ?? '';
            }
          } else {
            newItem.key = '';
            newItem.value = '';
          }

          const updated = [...items, newItem];

          field.handleChange(updated);

          if (defaultCollapsed) {
            setCollapsedItems(prev => new Set([...prev, newItem.id]));
          }
        };

        const removeItem = (id: string) => {
          if (items.length <= minItems) return;
          field.handleChange(items.filter(item => item.id !== id));
          setCollapsedItems((prev) => {
            const next = new Set(prev);

            next.delete(id);

            return next;
          });
        };

        const cloneItem = (item: RepeaterItem) => {
          if (maxItems && items.length >= maxItems) return;

          const cloned = { ...item, id: crypto.randomUUID() };
          const idx = items.findIndex(i => i.id === item.id);

          const updated = [...items];

          updated.splice(idx + 1, 0, cloned);
          field.handleChange(updated);
        };

        const updateItemField = (id: string, key: string, val: unknown) => {
          field.handleChange(
            items.map(item => item.id === id ? { ...item, [key]: val } : item)
          );
        };

        const toggleCollapse = (id: string) => {
          setCollapsedItems((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
              next.delete(id);
            } else {
              next.add(id);
            }

            return next;
          });
        };

        const canAdd = !maxItems || items.length < maxItems;
        const canRemove = items.length > minItems;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel>{fieldConfig.name}</FieldLabel>
            <div className="flex flex-col gap-2">
              {items.length > 0 && (
                <Sortable
                  value={items}
                  getItemValue={item => item.id}
                  onValueChange={(reordered) => { field.handleChange(reordered); }}>
                  <SortableContent className="flex flex-col gap-2">
                    {items.map((item, index) => {
                      const isCollapsed = collapsedItems.has(item.id);
                      const label = itemLabel
                        ? itemLabel(item, index)
                        : `#${index + 1}`;

                      return (
                        <SortableItem key={item.id} value={item.id} asChild>
                          <div className="rounded-lg border bg-card">
                            <div className="flex items-center gap-1 px-2 py-1.5">
                              <SortableItemHandle asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  className="cursor-grab text-muted-foreground"
                                  disabled={isDisabled}>
                                  <GripVertical className="size-3.5" />
                                </Button>
                              </SortableItemHandle>

                              {collapsible
                                ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleCollapse(item.id)}
                                      className="flex flex-1 items-center gap-1.5 text-sm font-medium">
                                      <ChevronDown
                                        className={cn(
                                          'size-3.5 text-muted-foreground transition-transform',
                                          isCollapsed && '-rotate-90'
                                        )} />
                                      {label}
                                    </button>
                                  )
                                : (
                                    <span className="flex-1 text-sm font-medium">{label}</span>
                                  )}

                              <div className="flex items-center gap-0.5">
                                {cloneable && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => cloneItem(item)}
                                    disabled={isDisabled || !canAdd}
                                    title="Clone">
                                    <Copy className="size-3" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => removeItem(item.id)}
                                  disabled={isDisabled || !canRemove}
                                  title="Delete">
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </div>

                            {(!collapsible || !isCollapsed) && (
                              <div className="border-t px-3 py-2.5">
                                {schema
                                  ? (
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        {schema.map(sf => (
                                          <div key={sf.slug} className="flex flex-col gap-1">
                                            {sf.type !== 'field-switch' && sf.type !== 'field-checkbox' && (
                                              <label className="text-xs font-medium text-muted-foreground">{sf.name}</label>
                                            )}
                                            <SubFieldInput
                                              subField={sf}
                                              value={item[sf.slug]}
                                              onChange={val => updateItemField(item.id, sf.slug, val)}
                                              onBlur={field.handleBlur}
                                              isDisabled={isDisabled}
                                              enumOptions={schemaEnumOptions?.[sf.slug]} />
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  : (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={String(item.key ?? '')}
                                          onChange={e => updateItemField(item.id, 'key', e.target.value)}
                                          onBlur={field.handleBlur}
                                          disabled={isDisabled}
                                          placeholder="Key"
                                          className="h-8 flex-1 text-sm" />
                                        <Input
                                          value={String(item.value ?? '')}
                                          onChange={e => updateItemField(item.id, 'value', e.target.value)}
                                          onBlur={field.handleBlur}
                                          disabled={isDisabled}
                                          placeholder="Value"
                                          className="h-8 flex-1 text-sm" />
                                      </div>
                                    )}
                              </div>
                            )}
                          </div>
                        </SortableItem>
                      );
                    })}
                  </SortableContent>
                  <SortableOverlay />
                </Sortable>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isDisabled || !canAdd}
                className="w-fit">
                <Plus className="mr-1 size-3.5" />
                {addLabel}
              </Button>
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}