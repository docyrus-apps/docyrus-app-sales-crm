// @ts-nocheck
/* eslint-disable */
import { type JsonataSample } from './jsonata-editor-types'

/**
 * Ready-made input + expression pairs, suitable for the `samples` prop of
 * `JsonataEditor`. Adapted from the official JSONata Exerciser.
 */
export const JSONATA_SAMPLES: JsonataSample[] = [
  {
    name: 'Invoice',
    description: 'Sum line totals across nested orders.',
    expression: '$sum(Account.Order.Product.(Price * Quantity))',
    input: {
      Account: {
        'Account Name': 'Firefly',
        Order: [
          {
            OrderID: 'order103',
            Product: [
              {
                'Product Name': 'Bowler Hat',
                ProductID: 858383,
                Price: 34.45,
                Quantity: 2,
              },
              {
                'Product Name': 'Trilby hat',
                ProductID: 858236,
                Price: 21.67,
                Quantity: 1,
              },
            ],
          },
          {
            OrderID: 'order104',
            Product: [
              {
                'Product Name': 'Bowler Hat',
                ProductID: 858383,
                Price: 34.45,
                Quantity: 4,
              },
              {
                'Product Name': 'Cloak',
                ProductID: 345664,
                Price: 107.99,
                Quantity: 1,
              },
            ],
          },
        ],
      },
    },
  },
  {
    name: 'Address',
    description: 'Combine and reshape contact fields.',
    expression:
      '{\n  "name": FirstName & " " & Surname,\n  "address": Address.City & ", " & Address.Postcode\n}',
    input: {
      FirstName: 'Fred',
      Surname: 'Smith',
      Age: 28,
      Address: {
        Street: 'Hursley Park',
        City: 'Winchester',
        Postcode: 'SO21 2JN',
      },
      Phone: [
        { type: 'home', number: '0203 544 1234' },
        { type: 'mobile', number: '077 7700 1234' },
      ],
    },
  },
  {
    name: 'Orders',
    description: 'Filter, map and aggregate an array.',
    expression: 'orders[total > 100].{\n  "id": id,\n  "total": total\n}',
    input: {
      orders: [
        { id: 'A-1', total: 49.9, status: 'paid' },
        { id: 'A-2', total: 129.5, status: 'paid' },
        { id: 'A-3', total: 312, status: 'pending' },
        { id: 'A-4', total: 87.25, status: 'paid' },
      ],
    },
  },
]
