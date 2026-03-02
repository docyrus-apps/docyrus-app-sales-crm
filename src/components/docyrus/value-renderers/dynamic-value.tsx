'use client';

import { type ComponentType } from 'react';

import { type DocyrusValueProps } from './types';

import { TextValue } from './text-value';
import { NumberValue } from './number-value';
import { MoneyValue } from './money-value';
import { PercentValue } from './percent-value';
import { EmailValue } from './email-value';
import { PhoneValue } from './phone-value';
import { UrlValue } from './url-value';
import { ColorValue } from './color-value';
import { IconValue } from './icon-value';
import { CurrencyCodeValue } from './currency-code-value';
import { SelectValue } from './select-value';
import { MultiSelectValue } from './multi-select-value';
import { StatusValue } from './status-value';
import { CheckboxValue } from './checkbox-value';
import { SwitchValue } from './switch-value';
import { DateValue } from './date-value';
import { DateTimeValue } from './datetime-value';
import { TimeValue } from './time-value';
import { DateRangeValue } from './date-range-value';
import { RatingValue } from './rating-value';
import { DurationValue } from './duration-value';
import { UserValue } from './user-value';
import { UserMultiValue } from './user-multi-value';
import { RelationValue } from './relation-value';
import { FileValue } from './file-value';
import { ImageValue } from './image-value';
import { AvatarValue } from './avatar-value';
import { JsonValue } from './json-value';
import { RichTextValue } from './rich-text-value';
import { CodeValue } from './code-value';
import { DocEditorValue } from './doc-editor-value';
import { FormulaValue } from './formula-value';
import { RelatedFieldValue } from './related-field-value';
import { IdentityValue } from './identity-value';
import { ButtonValue } from './button-value';
import { TaskListValue } from './task-list-value';
import { TodoValue } from './todo-value';
import { InlineDataValue } from './inline-data-value';
import { LocationValue } from './location-value';
import { ApprovalStatusValue } from './approval-status-value';
import { ListValue } from './list-value';
import { ConversationChannelValue } from './conversation-channel-value';
import { FileStorageFolderValue } from './file-storage-folder-value';

const VALUE_RENDERER_MAP: Record<
  string,
  ComponentType<DocyrusValueProps>
> = {
  'field-text': TextValue,
  'field-textarea': TextValue,
  'field-display': TextValue,
  'field-code': TextValue,

  'field-number': NumberValue,
  'field-money': MoneyValue,
  'field-percent': PercentValue,
  'field-duration': DurationValue,
  'field-rating': RatingValue,

  'field-checkbox': CheckboxValue,
  'field-switch': SwitchValue,

  'field-email': EmailValue,
  'field-phone': PhoneValue,
  'field-url': UrlValue,

  'field-date': DateValue,
  'field-dateTime': DateTimeValue,
  'field-time': TimeValue,
  'field-dateRange': DateRangeValue,

  'field-select': SelectValue,
  'field-radioGroup': SelectValue,
  'field-enum': SelectValue,
  'field-status': StatusValue,
  'field-userSelect': UserValue,
  'field-userMultiSelect': UserMultiValue,
  'field-multiSelect': MultiSelectValue,
  'field-tagSelect': MultiSelectValue,
  'field-relation': RelationValue,
  'field-list': ListValue,

  'field-color': ColorValue,
  'field-icon': IconValue,
  'field-currency': CurrencyCodeValue,

  'field-file': FileValue,
  'field-image': ImageValue,
  'field-avatar': AvatarValue,

  'field-htmlEditor': RichTextValue,
  'field-emailEditor': RichTextValue,
  'field-codeEditor': CodeValue,
  'field-docEditor': DocEditorValue,
  'field-json': JsonValue,

  'field-taskList': TaskListValue,
  'field-todo': TodoValue,
  'field-inlineData': InlineDataValue,
  'field-locationSelect': LocationValue,
  'field-approvalStatus': ApprovalStatusValue,

  'field-formula': FormulaValue,
  'field-relatedField': RelatedFieldValue,
  'field-identity': IdentityValue,
  'field-autonumber': IdentityValue,
  'field-button': ButtonValue,
  'field-conversationChannel': ConversationChannelValue,
  'field-fileStorageFolder': FileStorageFolderValue
};

/**
 * Dynamic value renderer dispatcher.
 * Renders the correct read-only display component based on the field's type.
 */
export function DynamicValue(props: DocyrusValueProps) {
  const Comp = VALUE_RENDERER_MAP[props.field.type];

  if (!Comp) {
    return <TextValue {...props} />;
  }

  return <Comp {...props} />;
}