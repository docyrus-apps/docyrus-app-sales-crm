'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { type DocyrusFormFieldProps } from './types';

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export function TaskListFormField({
  field: fieldConfig,
  form,
  disabled,
  className
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;
        const items: Array<TaskItem> = Array.isArray(field.state.value)
          ? field.state.value
          : [];
        const isDisabled = disabled || fieldConfig.readOnly === true;

        const addItem = () => {
          const newItem: TaskItem = {
            id: crypto.randomUUID(),
            title: '',
            completed: false
          };

          field.handleChange([...items, newItem]);
        };

        const removeItem = (id: string) => {
          field.handleChange(items.filter(item => item.id !== id));
        };

        const updateItem = (id: string, updates: Partial<TaskItem>) => {
          field.handleChange(
            items.map(item => item.id === id ? { ...item, ...updates } : item)
          );
        };

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel>{fieldConfig.name}</FieldLabel>
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={checked => updateItem(item.id, { completed: !!checked })}
                    disabled={isDisabled} />
                  <Input
                    value={item.title}
                    onChange={e => updateItem(item.id, { title: e.target.value })}
                    onBlur={field.handleBlur}
                    disabled={isDisabled}
                    placeholder="Task title"
                    className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(item.id)}
                    disabled={isDisabled}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isDisabled}
                className="w-fit">
                <Plus className="mr-1 size-3.5" />
                Add task
              </Button>
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}