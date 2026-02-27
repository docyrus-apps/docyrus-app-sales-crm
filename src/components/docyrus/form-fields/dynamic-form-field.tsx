'use client';

import { type ComponentType } from 'react';

import { type DocyrusFormFieldProps } from './types';

import { TextFormField } from './text-form-field';
import { TextareaFormField } from './textarea-form-field';
import { NumberFormField } from './number-form-field';
import { EmailFormField } from './email-form-field';
import { UrlFormField } from './url-form-field';
import { CheckboxFormField } from './checkbox-form-field';
import { SwitchFormField } from './switch-form-field';
import { SelectFormField } from './select-form-field';
import { MultiSelectFormField } from './multi-select-form-field';
import { TagSelectFormField } from './tag-select-form-field';
import { RadioGroupFormField } from './radio-group-form-field';
import { EnumFormField } from './enum-form-field';
import { StatusFormField } from './status-form-field';
import { UserSelectFormField } from './user-select-form-field';
import { UserMultiSelectFormField } from './user-multi-select-form-field';
import { RelationFormField } from './relation-form-field';
import { DateFormField } from './date-form-field';
import { DateTimeFormField } from './datetime-form-field';
import { TimeFormField } from './time-form-field';
import { DateRangeFormField } from './date-range-form-field';
import { MoneyFormField } from './money-form-field';
import { PercentFormField } from './percent-form-field';
import { RatingFormField } from './rating-form-field';
import { DurationFormField } from './duration-form-field';
import { PhoneFormField } from './phone-form-field';
import { ColorFormField } from './color-form-field';
import { IconFormField } from './icon-form-field';
import { CurrencyCodeFormField } from './currency-code-form-field';
import { FileFormField } from './file-form-field';
import { ImageFormField } from './image-form-field';
import { AvatarField } from './avatar-field';
import { HtmlEditorFormField } from './html-editor-form-field';
import { EmailEditorFormField } from './email-editor-form-field';
import { CodeEditorFormField } from './code-editor-form-field';
import { DocEditorFormField } from './doc-editor-form-field';
import { TaskListFormField } from './task-list-form-field';
import { LocationSelectFormField } from './location-select-form-field';
import { ApprovalStatusFormField } from './approval-status-form-field';
import { QueryBuilderFormField } from './query-builder-form-field';
import { SchemaRepeaterFormField } from './schema-repeater-form-field';

const FORM_FIELD_MAP: Partial<
  Record<string, ComponentType<DocyrusFormFieldProps>>
> = {
  'field-text': TextFormField,
  'field-textarea': TextareaFormField,
  'field-number': NumberFormField,
  'field-email': EmailFormField,
  'field-url': UrlFormField,
  'field-checkbox': CheckboxFormField,
  'field-switch': SwitchFormField,
  'field-select': SelectFormField,
  'field-multiSelect': MultiSelectFormField,
  'field-tagSelect': TagSelectFormField,
  'field-radioGroup': RadioGroupFormField,
  'field-enum': EnumFormField,
  'field-status': StatusFormField,
  'field-userSelect': UserSelectFormField,
  'field-userMultiSelect': UserMultiSelectFormField,
  'field-relation': RelationFormField,
  'field-date': DateFormField,
  'field-dateTime': DateTimeFormField,
  'field-time': TimeFormField,
  'field-dateRange': DateRangeFormField,
  'field-money': MoneyFormField,
  'field-percent': PercentFormField,
  'field-rating': RatingFormField,
  'field-duration': DurationFormField,
  'field-phone': PhoneFormField,
  'field-color': ColorFormField,
  'field-icon': IconFormField,
  'field-currency': CurrencyCodeFormField,
  'field-file': FileFormField,
  'field-image': ImageFormField,
  'field-avatar': AvatarField,
  'field-htmlEditor': HtmlEditorFormField,
  'field-emailEditor': EmailEditorFormField,
  'field-codeEditor': CodeEditorFormField,
  'field-docEditor': DocEditorFormField,
  'field-taskList': TaskListFormField,
  'field-locationSelect': LocationSelectFormField,
  'field-approvalStatus': ApprovalStatusFormField,
  'field-queryBuilder': QueryBuilderFormField,
  'field-schemaRepeater': SchemaRepeaterFormField
};

/**
 * Dynamic form field dispatcher.
 * Renders the correct form field component based on the field's type.
 */
export function DynamicFormField(props: DocyrusFormFieldProps) {
  const Comp = FORM_FIELD_MAP[props.field.type];

  if (!Comp) {
    return null;
  }

  return <Comp {...props} />;
}