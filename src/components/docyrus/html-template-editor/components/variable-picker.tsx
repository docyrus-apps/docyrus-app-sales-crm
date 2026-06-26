'use client';

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react';

import { CheckIcon } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

import { type HandlebarsVariable } from '../types';

interface VariablePickerProps {
  variables: HandlebarsVariable[];
  /**
   * When supplied, highlights the matching variable row in the list (used
   * by the edit popover to show which variable the chip currently points
   * to). Plain text — the picker uses an exact-name match.
   */
  currentName?: string;
  onSelect: (name: string) => void;
}

/**
 * Variable picker UI — a `<Command>` with grouped variables, a free-form
 * search input, and a fallback "Custom" row when the typed query doesn't
 * match any catalog entry. Used by both the insert popover (toolbar
 * button) and the edit popover (clicking an existing chip).
 */
export function VariablePicker({ variables, currentName, onSelect }: VariablePickerProps) {
  const [search, setSearch] = useState('');

  const grouped = variables.reduce<Record<string, HandlebarsVariable[]>>(
    (acc, v) => {
      const cat = v.category ?? 'Variables';

      (acc[cat] ??= []).push(v);

      return acc;
    },
    {}
  );

  const hasVariables = variables.length > 0;
  const trimmedSearch = search.trim();

  return (
    <Command>
      <CommandInput
        placeholder="Search variables…"
        value={search}
        onValueChange={setSearch}
        className="h-9" />
      <CommandList className="max-h-56">
        {hasVariables ? (
          <>
            <CommandEmpty>No variables found.</CommandEmpty>
            {Object.entries(grouped).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((v) => {
                  const active = v.name === currentName;

                  return (
                    <CommandItem
                      key={v.name}
                      value={v.name}
                      onSelect={() => onSelect(v.name)}
                      className={cn('cursor-pointer', active && 'bg-primary/10')}>
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {'{{'}
                      </span>
                      <span className="flex-1">
                        <span className={cn('font-mono text-xs font-medium', active && 'text-primary')}>
                          {v.name}
                        </span>
                        {v.label && v.label !== v.name && (
                          <span className="ml-2 text-xs text-muted-foreground">{v.label}</span>
                        )}
                      </span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {'}}'}
                      </span>
                      {active && (
                        <CheckIcon className="ml-1 size-3.5 shrink-0 text-primary" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No variables defined.
            <br />
            Pass a <code className="text-xs">variables</code> prop.
          </div>
        )}
        {trimmedSearch && (
          <CommandGroup heading="Custom">
            <CommandItem
              value={`__custom__${trimmedSearch}`}
              onSelect={() => onSelect(trimmedSearch)}
              className="cursor-pointer">
              <span className="font-mono text-xs">
                <span className="text-muted-foreground">{'{{'}</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {trimmedSearch}
                </span>
                <span className="text-muted-foreground">{'}}'}</span>
              </span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}