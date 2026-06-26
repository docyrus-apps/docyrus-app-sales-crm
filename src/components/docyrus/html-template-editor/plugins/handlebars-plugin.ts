'use client';

// @ts-nocheck
/* eslint-disable */
import { createPlatePlugin } from 'platejs/react';

import {
  DEFAULT_HELPERS,
  HBS_BLOCK_CLOSE_KEY,
  HBS_BLOCK_OPEN_KEY,
  HBS_ELSE_KEY,
  HBS_VARIABLE_KEY,
  HBS_VARIABLE_MARK_KEYS,
  type HandlebarsBlockHelper,
  type HandlebarsVariable,
  type HbsVariableMarkKey
} from '../types';

const HBS_VARIABLE_MARK_SET = new Set<string>(HBS_VARIABLE_MARK_KEYS);

/*
 * Inline regexes — run once per text node during normalization.
 * Block open MUST be checked before variable to avoid `{{#...` being caught.
 */
const RE_BLOCK_OPEN = /\{\{#(\w+)(?:\s+([^{}]*))?}}/;
const RE_BLOCK_CLOSE = /\{\{\/(\w+)}}/;
const RE_ELSE = /\{\{else}}/;
const RE_VARIABLE = /\{\{([^#/!>^{}][^{}]*?)}}/;

/*
 * ---------------------------------------------------------------------------
 * Node-type plugins — each registers isElement/isInline/isVoid + HTML parser
 * ---------------------------------------------------------------------------
 */

/*
 * Plate v53 quirk: when `parse()` returns just props, the deserializer does
 * NOT auto-populate `type` from the plugin `key`. Without a `type`, the editor
 * treats the resulting node as an unknown block, wraps surrounding text in
 * extra `<p>` wrappers, and silently drops it on serialize. Every parse below
 * therefore returns an explicit `type` and `children: [{text:''}]`.
 */

export const HandlebarsVariablePlugin = createPlatePlugin({
  key: HBS_VARIABLE_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true
  },
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        withoutChildren: true,
        rules: [{ validNodeName: 'SPAN', validAttribute: { 'data-hbs': 'var' } }],
        parse: ({ element }) => {
          const marks: Partial<Record<HbsVariableMarkKey, true>> = {};

          for (const key of HBS_VARIABLE_MARK_KEYS) {
            if (element.getAttribute(`data-mark-${key}`)) marks[key] = true;
          }

          return {
            type: HBS_VARIABLE_KEY,
            name: decodeURIComponent(element.getAttribute('data-n') ?? ''),
            ...marks,
            children: [{ text: '' }]
          };
        }
      }
    }
  }
});

export const HandlebarsBlockOpenPlugin = createPlatePlugin({
  key: HBS_BLOCK_OPEN_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true
  },
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        withoutChildren: true,
        rules: [{ validNodeName: 'SPAN', validAttribute: { 'data-hbs': 'block_open' } }],
        parse: ({ element }) => ({
          type: HBS_BLOCK_OPEN_KEY,
          helper: element.getAttribute('data-h') ?? '',
          expression: decodeURIComponent(element.getAttribute('data-e') ?? ''),
          /*
           * `data-hbs-table-anchored` is set by the preprocessor for chips
           * that were originally inside a table section but got lifted out
           * (slate can't hold inline-void inside `<table>`). Carrying it as
           * a slate-node prop lets the serializer re-inject the chip back
           * into the table on emit — without it, the chip would
           * permanently end up outside the iteration scope after any edit.
           */
          tableAnchored: element.getAttribute('data-hbs-table-anchored') === '1',
          children: [{ text: '' }]
        })
      }
    }
  }
});

export const HandlebarsBlockClosePlugin = createPlatePlugin({
  key: HBS_BLOCK_CLOSE_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true
  },
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        withoutChildren: true,
        rules: [{ validNodeName: 'SPAN', validAttribute: { 'data-hbs': 'block_close' } }],
        parse: ({ element }) => ({
          type: HBS_BLOCK_CLOSE_KEY,
          helper: element.getAttribute('data-h') ?? '',
          tableAnchored: element.getAttribute('data-hbs-table-anchored') === '1',
          children: [{ text: '' }]
        })
      }
    }
  }
});

export const HandlebarsElsePlugin = createPlatePlugin({
  key: HBS_ELSE_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true
  },
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        withoutChildren: true,
        rules: [{ validNodeName: 'SPAN', validAttribute: { 'data-hbs': 'else' } }],
        parse: ({ element }) => ({
          type: HBS_ELSE_KEY,
          tableAnchored: element.getAttribute('data-hbs-table-anchored') === '1',
          children: [{ text: '' }]
        })
      }
    }
  }
});

/*
 * ---------------------------------------------------------------------------
 * Normalizer plugin — auto-converts typed `{{...}}` text to HBS nodes
 * ---------------------------------------------------------------------------
 */

export interface HandlebarsNormalizerConfig {
  options: {
    variables: HandlebarsVariable[];
    helpers: HandlebarsBlockHelper[];
  };
}

export const HandlebarsNormalizerPlugin = createPlatePlugin({
  key: 'hbs_normalizer',
  options: {
    variables: [] as HandlebarsVariable[],
    helpers: DEFAULT_HELPERS as HandlebarsBlockHelper[]
  },
  extendEditor: ({ editor }) => {
    const editorAny = editor as any;
    const origNormalizeNode = editorAny.normalizeNode as ((entry: any, options?: any) => void) | undefined;
    const origToggleMark = editor.tf.toggleMark as (key: string, options?: { remove?: string | string[] }) => void;
    const origHasMark = editor.api.hasMark as (key: string) => boolean;

    function collectVariablesInSelection(): Array<[any, any]> {
      if (!editor.selection) return [];

      return Array.from(
        editor.api.nodes({
          at: editor.selection,
          match: (n: any) => n?.type === HBS_VARIABLE_KEY
        })
      ) as Array<[any, any]>;
    }

    editor.api.hasMark = ((key: string) => {
      if (origHasMark(key)) return true;
      if (!HBS_VARIABLE_MARK_SET.has(key)) return false;
      const variables = collectVariablesInSelection();

      return variables.some(([n]) => Boolean(n?.[key]));
    }) as typeof editor.api.hasMark;

    /*
     * Make toggleMark apply to variable element props alongside text marks,
     * so a variable chip can be made bold/italic/etc together with surrounding text.
     */
    editor.tf.toggleMark = ((key: string, options?: { remove?: string | string[] }) => {
      if (!editor.selection) return;
      if (!HBS_VARIABLE_MARK_SET.has(key)) {
        origToggleMark(key, options);

        return;
      }
      const isOn = editor.api.hasMark(key);
      const variables = collectVariablesInSelection();

      editor.tf.withoutNormalizing(() => {
        if (isOn) {
          editor.tf.removeMark(key);
          for (const [, path] of variables) {
            editor.tf.setNodes({ [key]: null }, { at: path });
          }
        } else {
          if (options?.remove) {
            const removeKeys = Array.isArray(options.remove) ? options.remove : [options.remove];

            editor.tf.removeMarks([...removeKeys, key]);
          }
          editor.tf.addMark(key, true);
          for (const [, path] of variables) {
            editor.tf.setNodes({ [key]: true }, { at: path });
          }
        }
      });
    }) as typeof editor.tf.toggleMark;

    editorAny.normalizeNode = (entry: any, options?: any) => {
      const [node, path] = entry;

      if (typeof node.text === 'string' && node.text.includes('{')) {
        const { text } = node;

        const elseMatch = RE_ELSE.exec(text);

        if (elseMatch) {
          const start = elseMatch.index;
          const end = start + elseMatch[0].length;

          editor.tf.delete({
            at: { anchor: { path, offset: start }, focus: { path, offset: end } }
          });
          editor.tf.insertNodes(
            [{ type: HBS_ELSE_KEY, children: [{ text: '' }] }],
            { at: { path, offset: start } }
          );

          return;
        }

        const openMatch = RE_BLOCK_OPEN.exec(text);

        if (openMatch) {
          const start = openMatch.index;
          const end = start + openMatch[0].length;

          editor.tf.delete({
            at: { anchor: { path, offset: start }, focus: { path, offset: end } }
          });
          editor.tf.insertNodes(
            [
              {
                type: HBS_BLOCK_OPEN_KEY,
                helper: openMatch[1] ?? '',
                expression: (openMatch[2] ?? '').trim(),
                children: [{ text: '' }]
              }
            ],
            { at: { path, offset: start } }
          );

          return;
        }

        const closeMatch = RE_BLOCK_CLOSE.exec(text);

        if (closeMatch) {
          const start = closeMatch.index;
          const end = start + closeMatch[0].length;

          editor.tf.delete({
            at: { anchor: { path, offset: start }, focus: { path, offset: end } }
          });
          editor.tf.insertNodes(
            [
              {
                type: HBS_BLOCK_CLOSE_KEY,
                helper: closeMatch[1] ?? '',
                children: [{ text: '' }]
              }
            ],
            { at: { path, offset: start } }
          );

          return;
        }

        const varMatch = RE_VARIABLE.exec(text);

        if (varMatch) {
          const start = varMatch.index;
          const end = start + varMatch[0].length;

          editor.tf.delete({
            at: { anchor: { path, offset: start }, focus: { path, offset: end } }
          });
          editor.tf.insertNodes(
            [
              {
                type: HBS_VARIABLE_KEY,
                name: (varMatch[1] ?? '').trim(),
                children: [{ text: '' }]
              }
            ],
            { at: { path, offset: start } }
          );

          return;
        }
      }

      origNormalizeNode?.(entry, options);
    };

    return editorAny;
  }
});

/*
 * ---------------------------------------------------------------------------
 * Convenience kit — spread into your plugins array
 * ---------------------------------------------------------------------------
 */

export const HandlebarsKit = [
  HandlebarsVariablePlugin,
  HandlebarsBlockOpenPlugin,
  HandlebarsBlockClosePlugin,
  HandlebarsElsePlugin,
  HandlebarsNormalizerPlugin
];