import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useBaseCountryCollection } from '@/collections'
import type { BaseCountryEntity } from '@/collections/base-country.collection'

/*
 * The get-items endpoint caps a page at 100 rows no matter how large a `limit`
 * we ask for. Country pickers used to issue a single `limit: 300` request and
 * silently received only the first alphabetical page (Afghanistan–Iceland), so
 * every country from "India" onward — Turkey included — was absent from the
 * dropdown and unfindable by its search box. Page until the API hands back a
 * short page instead of trusting one oversized request.
 */
const COUNTRY_PAGE_SIZE = 100
const COUNTRY_MAX_PAGES = 10

export const COUNTRY_OPTIONS_QUERY_KEY = ['base-country-options'] as const

/*
 * `base.country.name` is always English. The datasource carries a
 * `translations` JSON blob keyed by language ("tr" → "Türkiye"), populated for
 * every row, so the picker can show localized names instead of making a Turkish
 * user search for "Turkey".
 */
function localizeCountryName(
  country: BaseCountryEntity,
  language: string
): string {
  const raw = (country as { translations?: unknown }).translations

  if (!raw) return country.name ?? ''

  try {
    const translations = (
      typeof raw === 'string' ? JSON.parse(raw) : raw
    ) as Record<string, string>
    const baseLanguage = language.split('-')[0]

    return (
      translations[language] ||
      translations[baseLanguage] ||
      country.name ||
      ''
    )
  } catch {
    return country.name ?? ''
  }
}

export function useCountryOptions(): Array<BaseCountryEntity> {
  const countriesCollection = useBaseCountryCollection()
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'en'

  const { data: countries = [] } = useQuery({
    queryKey: COUNTRY_OPTIONS_QUERY_KEY,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const rows: Array<BaseCountryEntity> = []

      for (let page = 0; page < COUNTRY_MAX_PAGES; page++) {
        const batch = await countriesCollection.list({
          columns: ['id', 'name', 'translations'],
          orderBy: 'name ASC',
          limit: COUNTRY_PAGE_SIZE,
          offset: page * COUNTRY_PAGE_SIZE
        })

        if (!batch?.length) break

        rows.push(...batch)

        if (batch.length < COUNTRY_PAGE_SIZE) break
      }

      return rows
    }
  })

  /*
   * Re-sort after localizing: the API ordered by the English name, which is not
   * alphabetical once the labels are translated.
   */
  return useMemo(() => {
    const collator = new Intl.Collator(language)

    return countries
      .map(country => ({
        ...country,
        name: localizeCountryName(country, language)
      }))
      .sort((a, b) => collator.compare(a.name, b.name))
  }, [countries, language])
}
