import { type Value } from 'platejs';

import {
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseHighlightPlugin,
  BaseItalicPlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin
} from '@platejs/basic-nodes';
import {
  MarkdownPlugin,
  deserializeMd,
  remarkMention,
  serializeMd
} from '@platejs/markdown';
import { BaseMentionPlugin } from '@platejs/mention';
import { createSlateEditor } from 'platejs';

const commentPlugins = [
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseCodePlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseHighlightPlugin,
  BaseKbdPlugin,
  BaseMentionPlugin,
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkMention]
    }
  })
];

function createCommentEditor(value?: Value) {
  return createSlateEditor({
    plugins: commentPlugins,
    value
  });
}

export function serializeCommentMarkdown(value: Value): string {
  const editor = createCommentEditor(value);

  return serializeMd(editor);
}

export function deserializeCommentMarkdown(content: string): Value {
  if (Array.isArray(content)) {
    return content as unknown as Value;
  }

  if (!content || typeof content !== 'string') {
    return [{ type: 'p', children: [{ text: '' }] }] as Value;
  }

  const editor = createCommentEditor();

  return deserializeMd(editor, content);
}