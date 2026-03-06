'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject
} from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { DynamicFormField } from '@/components/docyrus/form-fields/dynamic-form-field';
import {
  isMultiSelectField,
  isReadOnlyField,
  isSelectField
} from '@/components/docyrus/form-fields/lib/utils';
import {
  type EnumOption,
  type IField,
  type IFieldType
} from '@/components/docyrus/form-fields/types';
import { DynamicValue } from '@/components/docyrus/value-renderers/dynamic-value';

const editableValueVariants = cva(
  'relative inline-flex w-full items-center rounded-md transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'border border-transparent',
        ghost: ''
      },
      size: {
        sm: 'min-h-7 px-1.5 py-0.5 text-xs',
        default: 'min-h-9 px-2 py-1 text-sm',
        lg: 'min-h-11 px-3 py-1.5 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

/** Pure inline input fields — blur saves, Enter saves */
const INLINE_TYPES = new Set<IFieldType>([
  'field-text',
  'field-number',
  'field-email',
  'field-url',
  'field-percent'
]);

/**
 * Instant-save fields — value change immediately commits and exits edit mode.
 * These are simple toggle/click fields with no intermediate editing state.
 */
const INSTANT_SAVE_TYPES = new Set<IFieldType>(['field-checkbox', 'field-switch', 'field-rating']);

/**
 * Fields that always require explicit save + visible action buttons.
 * These have compound inputs (e.g. amount + currency) or complex
 * interactions where auto-save on blur would be premature.
 */
const EXPLICIT_SAVE_TYPES = new Set<IFieldType>([
  'field-money',
  'field-phone',
  'field-duration',
  'field-currency',
  'field-dateTime',
  'field-time'
]);

/**
 * Popover/dropdown fields that portal content outside the wrapper.
 * Blur must be ignored because focus moves to the portal.
 * Compound inline fields (money, phone, duration, currency) are also
 * included here because their internal dropdowns use portals.
 */
const POPOVER_TYPES = new Set<IFieldType>([
  'field-select',
  'field-status',
  'field-radioGroup',
  'field-enum',
  'field-relation',
  'field-userSelect',
  'field-list',
  'field-multiSelect',
  'field-userMultiSelect',
  'field-tagSelect',
  'field-date',
  'field-dateTime',
  'field-time',
  'field-dateRange',
  'field-color',
  'field-icon',
  'field-locationSelect',
  'field-approvalStatus',
  'field-money',
  'field-phone',
  'field-duration',
  'field-currency'
]);

/**
 * A stable component that holds its own value state so the parent
 * micro-form object never needs to be recreated on every keystroke.
 */
function MicroFormField({
  slug,
  initialValue,
  onChangeRef,
  children
}: {
  slug: string;
  initialValue: unknown;
  onChangeRef: RefObject<(v: unknown) => void>;
  children: (field: any) => ReactNode;
}) {
  const [localValue, setLocalValue] = useState<unknown>(initialValue);

  const handleChange = useCallback(
    (v: unknown) => {
      setLocalValue(v);
      onChangeRef.current(v);
    },
    [onChangeRef]
  );

  return (
    <>
      {children({
        name: slug,
        state: {
          value: localValue,
          meta: { isTouched: false, isValid: true, errors: [] }
        },
        handleChange,
        handleBlur: () => {}
      })}
    </>
  );
}

/**
 * Creates a stable form object whose `Field` component is always the same
 * reference. The `onChangeRef` allows the parent to read the latest value
 * without causing re-creation of the form.
 *
 * `editCount` is used as a React key on MicroFormField so that each time
 * edit mode is entered the field remounts with the fresh `initialValue`.
 */
function useMicroForm(
  _slug: string,
  initialValue: unknown,
  onChangeRef: RefObject<(v: unknown) => void>,
  editCount: number
) {
  const initialValueRef = useRef(initialValue);
  const editCountRef = useRef(editCount);

  initialValueRef.current = initialValue;
  editCountRef.current = editCount;

  const [form] = useState(() => ({
    Field: ({
      name,
      children
    }: {
      name: string;
      children: (field: any) => ReactNode;
    }) => (
      <MicroFormField
        key={editCountRef.current}
        slug={name}
        initialValue={initialValueRef.current}
        onChangeRef={onChangeRef}>
        {children}
      </MicroFormField>
    )
  }));

  return form;
}

function EditableValueActions({
  onSave,
  onCancel
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="ml-1 flex shrink-0 items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        onMouseDown={e => e.preventDefault()}
        onClick={onSave}>
        <Check className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        onMouseDown={e => e.preventDefault()}
        onClick={onCancel}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

export interface EditableValueProps
  extends Omit<ComponentProps<'div'>, 'children' | 'onChange'>,
  VariantProps<typeof editableValueVariants> {
  /** Field configuration — determines which renderer and editor to use */
  field: IField;
  /** Current value to display and edit */
  value: unknown;
  /** Called when a new value is committed */
  onValueChange?: (value: unknown) => void;
  /** Full record for companion fields (phone country, money currency) */
  record?: Record<string, unknown>;
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>;
  /** TanStack Form instance — if provided, delegates editing to this form */
  form?: any;
  /** Whether the field is disabled (prevents entering edit mode) */
  disabled?: boolean;
  /** Whether the field is read-only (shows value, no hover affordance) */
  readOnly?: boolean;
  /** Custom display content — overrides DynamicValue auto-rendering */
  children?: ReactNode;
  /** Show confirm/cancel buttons during editing */
  showActions?: boolean;
  /** Require explicit save — blur cancels instead of saving */
  explicitSave?: boolean;
  /** Controlled editing state */
  editing?: boolean;
  /** Called when editing state changes */
  onEditingChange?: (editing: boolean) => void;
  /** App slug for dynamic enum loading */
  appSlug?: string;
  /** Data source slug for dynamic enum loading */
  dataSourceSlug?: string;
}

const EditableValue = forwardRef<HTMLDivElement, EditableValueProps>(
  (
    {
      field,
      value,
      onValueChange,
      record,
      enumOptions,
      form: externalForm,
      disabled,
      readOnly,
      children,
      showActions: showActionsProp,
      explicitSave: explicitSaveProp,
      editing: controlledEditing,
      onEditingChange,
      appSlug,
      dataSourceSlug,
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const isFieldReadOnly
      = readOnly
        || disabled
        || isReadOnlyField(field.type)
        || field.readOnly === true;

    const isPopover = POPOVER_TYPES.has(field.type);
    const isMulti = isMultiSelectField(field.type);
    const isSingleSelect
      = isPopover && isSelectField(field.type) && !isMulti;

    /*
     * Multi-select and compound fields always need explicit save + actions.
     * Single-select popover fields auto-save on change (no actions needed).
     * Inline fields use the user's props (defaults: blur-to-save, no actions).
     */
    const forceExplicit = isMulti || EXPLICIT_SAVE_TYPES.has(field.type);
    const effectiveExplicitSave = forceExplicit
      ? true
      : (explicitSaveProp ?? false);
    const effectiveShowActions = forceExplicit
      ? true
      : (showActionsProp ?? false);

    const isInstantSave = INSTANT_SAVE_TYPES.has(field.type);

    const [internalEditing, setInternalEditing] = useState(false);
    const isEditing = controlledEditing ?? internalEditing;

    /*
     * Tracks how many times edit mode has been entered — used as a key
     * to remount MicroFormField with the latest value on each edit.
     */
    const editCountRef = useRef(0);

    const setEditing = useCallback(
      (v: boolean) => {
        if (v) editCountRef.current += 1;
        setInternalEditing(v);
        onEditingChange?.(v);
      },
      [onEditingChange]
    );

    const editingValueRef = useRef<unknown>(value);
    const onValueChangeRef = useRef(onValueChange);

    onValueChangeRef.current = onValueChange;

    useEffect(() => {
      if (!isEditing) {
        editingValueRef.current = value;
      }
    }, [value, isEditing]);

    useEffect(() => {
      if (isEditing) {
        editingValueRef.current = value;
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on edit start
    }, [isEditing]);

    const setEditingRef = useRef(setEditing);

    setEditingRef.current = setEditing;

    const onChangeRef = useRef((v: unknown) => {
      editingValueRef.current = v;
    });

    /*
     * Instant-save fields: change = commit + close immediately
     * Single-select popover fields: selecting a value = save + close
     * Non-multi popover fields (date pickers, etc.): selecting = save + close
     * Multi-select / explicit-save: onChange just stores, confirm button saves
     */
    useEffect(() => {
      if (isInstantSave || (!forceExplicit && (isSingleSelect || (isPopover && !isMulti)))) {
        onChangeRef.current = (v: unknown) => {
          editingValueRef.current = v;
          onValueChangeRef.current?.(v);
          setEditingRef.current(false);
        };
      } else {
        onChangeRef.current = (v: unknown) => {
          editingValueRef.current = v;
        };
      }
    }, [
      isInstantSave,
      forceExplicit,
      isSingleSelect,
      isPopover,
      isMulti
    ]);

    const internalForm = useMicroForm(field.slug, value, onChangeRef, editCountRef.current);
    const activeForm = externalForm ?? internalForm;

    const handleSave = useCallback(() => {
      onValueChange?.(editingValueRef.current);
      setEditing(false);
    }, [onValueChange, setEditing]);

    const handleCancel = useCallback(() => {
      editingValueRef.current = value;
      setEditing(false);
    }, [value, setEditing]);

    const handleClick = useCallback(() => {
      if (!isEditing && !isFieldReadOnly) {
        setEditing(true);
      }
    }, [isEditing, isFieldReadOnly, setEditing]);

    const handleBlur = useCallback(
      (e: FocusEvent<HTMLDivElement>) => {
        /*
         * Popover fields portal their content — blur fires when focus
         * moves to the popover, so we must ignore blur entirely for these
         */
        if (isPopover) return;

        const related = e.relatedTarget as Node | null;

        if (wrapperRef.current?.contains(related)) {
          return;
        }

        if (effectiveExplicitSave) {
          handleCancel();
        } else {
          handleSave();
        }
      },
      [
        isPopover,
        effectiveExplicitSave,
        handleSave,
        handleCancel
      ]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();

          return;
        }

        if (
          e.key === 'Enter'
          && !e.shiftKey
          && INLINE_TYPES.has(field.type)
        ) {
          e.preventDefault();
          handleSave();
        }
      },
      [field.type, handleSave, handleCancel]
    );

    const handleDisplayKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    useEffect(() => {
      if (isEditing && wrapperRef.current) {
        const focusable = wrapperRef.current.querySelector<HTMLElement>(
          'input, textarea, select, [tabindex], [contenteditable="true"]'
        );

        focusable?.focus();
      }
    }, [isEditing]);

    if (isEditing) {
      return (
        <div
          ref={(node) => {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          data-slot="editable-value"
          className={cn(
            editableValueVariants({ variant, size }),
            'relative',
            className
          )}
          {...props}>
          {/* Invisible spacer preserving the display-mode height */}
          <div className="invisible">
            {children ?? (
              <DynamicValue
                field={field}
                value={value}
                record={record}
                enumOptions={enumOptions} />
            )}
          </div>
          {/* Floating edit container */}
          <div
            ref={(node) => { wrapperRef.current = node; }}
            data-editing=""
            className={cn(
              'absolute inset-x-0 top-0 z-10',
              'flex w-full items-start rounded-md',
              'border border-ring bg-background shadow-md'
            )}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}>
            <div className={cn(
              'w-full',
              editableValueVariants({ size }),
              '**:data-[slot=field-label]:hidden',
              '**:data-[slot=field]:mb-0 **:data-[slot=field]:gap-1'
            )}>
              <DynamicFormField
                field={field}
                form={activeForm}
                enumOptions={enumOptions}
                appSlug={appSlug}
                dataSourceSlug={dataSourceSlug} />
            </div>
            {effectiveShowActions && (
              <EditableValueActions
                onSave={handleSave}
                onCancel={handleCancel} />
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={(node) => {
          wrapperRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        data-slot="editable-value"
        role={isFieldReadOnly ? undefined : 'button'}
        tabIndex={isFieldReadOnly ? undefined : 0}
        className={cn(
          editableValueVariants({ variant, size }),
          !isFieldReadOnly
          && 'cursor-pointer hover:border-muted-foreground/30',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleDisplayKeyDown}
        {...props}>
        {children ?? (
          <DynamicValue
            field={field}
            value={value}
            record={record}
            enumOptions={enumOptions} />
        )}
      </div>
    );
  }
);

EditableValue.displayName = 'EditableValue';

export { EditableValue, editableValueVariants };