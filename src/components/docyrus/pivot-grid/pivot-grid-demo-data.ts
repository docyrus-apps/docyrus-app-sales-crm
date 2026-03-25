import {
  type PivotGridCellColorRule,
  type PivotGridDimension,
  type PivotGridMeasure
} from './types';

export interface PivotGridDemoRow {
  id: string;
  region: string;
  country: string;
  city: string;
  year: number;
  quarter: string;
  channel: string;
  orders: number;
  revenue: number;
  margin: number;
}

export interface PivotGridDemoOptions {
  regions?: number;
  countriesPerRegion?: number;
  citiesPerCountry?: number;
  years?: number;
  quarters?: number;
  channels?: number;
}

const REGIONS = [
  {
    region: 'North America',
    countries: [
      {
        country: 'United States',
        cities: ['New York', 'Austin', 'Seattle']
      },
      {
        country: 'Canada',
        cities: ['Toronto', 'Montreal', 'Vancouver']
      }
    ]
  },
  {
    region: 'Europe',
    countries: [
      {
        country: 'Germany',
        cities: ['Berlin', 'Munich', 'Hamburg']
      },
      {
        country: 'United Kingdom',
        cities: ['London', 'Manchester', 'Bristol']
      }
    ]
  }
];

const YEARS = [2024, 2025, 2026];
const QUARTERS = ['Q1', 'Q2', 'Q3'];
const CHANNELS = ['Direct', 'Partner', 'Marketplace'];

export function createPivotGridDemoRows(
  options: PivotGridDemoOptions = {}
): Array<PivotGridDemoRow> {
  const {
    regions = REGIONS.length,
    countriesPerRegion = Number.POSITIVE_INFINITY,
    citiesPerCountry = Number.POSITIVE_INFINITY,
    years = YEARS.length,
    quarters = QUARTERS.length,
    channels = CHANNELS.length
  } = options;
  const rows: Array<PivotGridDemoRow> = [];
  let index = 0;

  for (const regionEntry of REGIONS.slice(0, regions)) {
    for (const countryEntry of regionEntry.countries.slice(0, countriesPerRegion)) {
      for (const city of countryEntry.cities.slice(0, citiesPerCountry)) {
        for (const year of YEARS.slice(0, years)) {
          for (const quarter of QUARTERS.slice(0, quarters)) {
            for (const channel of CHANNELS.slice(0, channels)) {
              index += 1;
              const base = 1200 + index * 17;
              const revenue = base * (channel === 'Direct' ? 5.8 : channel === 'Partner' ? 4.9 : 4.2);
              const orders = 18 + (index % 9) * 3;

              rows.push({
                id: `pivot-row-${index}`,
                region: regionEntry.region,
                country: countryEntry.country,
                city,
                year,
                quarter,
                channel,
                orders,
                revenue,
                margin: revenue * (0.18 + (index % 5) * 0.02)
              });
            }
          }
        }
      }
    }
  }

  return rows;
}

export const pivotGridDemoRowDimensions: Array<PivotGridDimension<PivotGridDemoRow>> = [
  {
    id: 'region',
    label: 'Region',
    getValue: row => row.region
  },
  {
    id: 'country',
    label: 'Country',
    getValue: row => row.country
  },
  {
    id: 'city',
    label: 'City',
    getValue: row => row.city
  }
];

export const pivotGridDemoColumnDimensions: Array<PivotGridDimension<PivotGridDemoRow>> = [
  {
    id: 'year',
    label: 'Year',
    getValue: row => row.year,
    sort: (left, right) => Number(left) - Number(right)
  },
  {
    id: 'quarter',
    label: 'Quarter',
    getValue: row => row.quarter
  },
  {
    id: 'channel',
    label: 'Channel',
    getValue: row => row.channel
  }
];

function currencyFormatter(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function integerFormatter(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export const pivotGridDemoMeasures: Array<PivotGridMeasure<PivotGridDemoRow>> = [
  {
    id: 'revenue',
    label: 'Revenue',
    aggregate: 'sum',
    getValue: row => row.revenue,
    formatValue: currencyFormatter
  },
  {
    id: 'orders',
    label: 'Orders',
    aggregate: 'sum',
    getValue: row => row.orders,
    formatValue: integerFormatter
  },
  {
    id: 'margin',
    label: 'Margin',
    aggregate: 'sum',
    getValue: row => row.margin,
    formatValue: currencyFormatter
  }
];

export const pivotGridDemoColorRules: Array<PivotGridCellColorRule> = [
  {
    scope: 'leaf',
    formula: 'measureId = "revenue" and value > 12000',
    color: 'emerald-100'
  },
  {
    scope: 'subtotal',
    formula: 'measureId = "margin" and value > 3500',
    color: 'amber-100'
  },
  {
    scope: 'grand-total',
    formula: 'value > 0',
    color: 'slate-200'
  }
];