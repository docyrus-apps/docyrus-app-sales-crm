'use client';

import { useMemo } from 'react';

import CodeMirror, { type BasicSetupOptions } from '@uiw/react-codemirror';
import { type LanguageName, loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useTheme } from 'next-themes';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';

import { type DocyrusFormFieldProps } from './types';

const DEFAULT_BASIC_SETUP: BasicSetupOptions = {
  lineNumbers: true,
  foldGutter: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  highlightActiveLine: true,
  highlightSelectionMatches: true,
  tabSize: 2
};

export interface CodeEditorFormFieldProps extends DocyrusFormFieldProps {
  /** CodeMirror language name (e.g. 'tsx', 'python', 'json', 'css', 'sql') */
  language?: LanguageName;
  /** CodeMirror basicSetup overrides */
  basicSetup?: BasicSetupOptions;
  /** Editor minimum height */
  minHeight?: string;
  /** Editor maximum height (enables scroll) */
  maxHeight?: string;
}

export function CodeEditorFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  language = 'tsx',
  basicSetup,
  minHeight = '200px',
  maxHeight = '400px'
}: CodeEditorFormFieldProps) {
  const isReadOnly = disabled || fieldConfig.readOnly === true;
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(() => {
    const lang = loadLanguage(language);

    return lang ? [lang] : [];
  }, [language]);

  const setup = useMemo(
    () => ({ ...DEFAULT_BASIC_SETUP, ...basicSetup }),
    [basicSetup]
  );

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <div className="overflow-hidden rounded-md border">
              <CodeMirror
                value={field.state.value ?? ''}
                extensions={extensions}
                editable={!isReadOnly}
                readOnly={isReadOnly}
                onChange={(val: string) => { field.handleChange(val); }}
                onBlur={field.handleBlur}
                basicSetup={setup}
                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                minHeight={minHeight}
                maxHeight={maxHeight} />
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}