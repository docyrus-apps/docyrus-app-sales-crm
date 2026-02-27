'use client';

import {
  type ChangeEvent, type InputHTMLAttributes, useEffect, useMemo, useState
} from 'react';

import { Input } from '@/components/ui/input';

import { debounce } from '../lib/debounce';

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounceMs?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const debouncedOnChange = useMemo(
    () => debounce((newValue: string | number) => {
      onChange(newValue);
    }, debounceMs),
    [debounceMs, onChange]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setValue(newValue);
    debouncedOnChange(newValue);
  };

  return <Input {...props} value={value} onChange={handleChange} />;
}