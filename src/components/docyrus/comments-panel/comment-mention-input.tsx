'use client';

import { createContext, useContext, useState } from 'react';

import { type TComboboxInputElement } from 'platejs';

import { getMentionOnSelectItem } from '@platejs/mention';
import { PlateElement } from 'platejs/react';
import { type PlateElementProps } from 'platejs/react';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem
} from '@/components/editor/ui/inline-combobox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { type MentionUser } from './types';

export const CommentMentionUsersContext = createContext<
  Array<MentionUser>
>([]);

const onSelectItem = getMentionOnSelectItem();

export function CommentMentionInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const [search, setSearch] = useState('');
  const users = useContext(CommentMentionUsersContext);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@">
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>No users found</InlineComboboxEmpty>

          <InlineComboboxGroup>
            {users.map(item => (
              <InlineComboboxItem
                key={item.key}
                value={item.text}
                onClick={() => onSelectItem(editor, item, search)}>
                <Avatar className="mr-2 size-5">
                  <AvatarFallback className="text-[9px]">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}