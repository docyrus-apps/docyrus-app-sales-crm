// @ts-nocheck
/* eslint-disable */
import { type HandlebarsSample } from './handlebars-editor-types'

/**
 * Ready-made input + template pairs, suitable for the `samples` prop of
 * `HandlebarsEditor`.
 */
export const HANDLEBARS_SAMPLES: HandlebarsSample[] = [
  {
    name: 'Greeting',
    description: 'Combine a few interpolations and a conditional.',
    template:
      '<p>Hello, {{firstName}} {{lastName}}!</p>\n{{#if vip}}<p class="badge">VIP customer</p>{{/if}}',
    input: { firstName: 'Fred', lastName: 'Smith', vip: true },
  },
  {
    name: 'Order list',
    description: 'Iterate, use @index, and render an empty state.',
    template:
      '<ul>\n{{#each orders}}\n  <li>#{{@index}} — {{id}}: {{total}} {{currency}}</li>\n{{else}}\n  <li>No orders yet.</li>\n{{/each}}\n</ul>',
    input: {
      orders: [
        { id: 'A-1', total: 49.9, currency: 'USD' },
        { id: 'A-2', total: 129.5, currency: 'USD' },
        { id: 'A-3', total: 312, currency: 'USD' },
      ],
    },
  },
  {
    name: 'Invoice',
    description: 'Nested iteration, math, and currency formatting.',
    template:
      '<h1>Invoice {{invoice.number}}</h1>\n<table>\n  <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>\n  <tbody>\n  {{#each invoice.lines}}\n    <tr>\n      <td>{{description}}</td>\n      <td>{{qty}}</td>\n      <td>{{formatCurrency unitPrice "USD"}}</td>\n      <td>{{formatCurrency (multiply qty unitPrice) "USD"}}</td>\n    </tr>\n  {{/each}}\n  </tbody>\n</table>',
    input: {
      invoice: {
        number: 'INV-2024-0042',
        lines: [
          { description: 'Bowler hat', qty: 2, unitPrice: 34.45 },
          { description: 'Trilby hat', qty: 1, unitPrice: 21.67 },
          { description: 'Cloak', qty: 1, unitPrice: 107.99 },
        ],
      },
    },
  },
  {
    name: 'Address',
    description: 'Use `with` to shift the rendering context.',
    template:
      '{{#with address}}\n<p>{{street}}<br />{{city}}, {{postcode}}</p>\n{{/with}}',
    input: {
      address: {
        street: 'Hursley Park',
        city: 'Winchester',
        postcode: 'SO21 2JN',
      },
    },
  },
]
