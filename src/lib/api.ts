import type { RestApiClient } from '@docyrus/api-client'

// Module-level API client instance, set by the React app once DocyrusAuthProvider is ready
let apiClient: RestApiClient | null = null

/*
 * Keys that mark a body as a result object rather than a `{ success, data }`
 * envelope.
 *
 * The API only wraps a service result when it has no `data` key of its own;
 * otherwise it merges the envelope flat (`{ success, ...result }`). The import
 * endpoint hits that second path, so its rows arrive under `data` with
 * `totalSuccessfulRecords`, `duplicates` and `error` as siblings. Collapsing
 * such a body to `data` keeps the rows and throws the outcome away — that is
 * what made the import wizard report 0 records for an import that had just
 * created them.
 *
 * Deliberately narrow: only bodies carrying one of these keys are left intact,
 * so every other response — list payloads included — unwraps exactly as before.
 */
const RESULT_MARKER_KEYS = [
  'totalSuccessfulRecords',
  'totalWarningRecords',
  'duplicates',
]

export function setApiClient(client: RestApiClient) {
  apiClient = client

  // Add request interceptor for custom param handling
  apiClient.addInterceptor({
    request: (config) => {
      if (config.params) {
        const params = { ...config.params }

        // Handle columns array - join as comma-separated
        if (params.columns && Array.isArray(params.columns)) {
          params.columns = params.columns.join(',')
        }

        // Handle expand array - join as comma-separated
        if (params.expand && Array.isArray(params.expand)) {
          params.expand = params.expand.join(',')
        }

        // Stringify complex object/array params for query string serialization
        const jsonKeys = [
          'filters',
          'orderBy',
          'calculations',
          'formulas',
          'childQueries',
          'pivot',
          'distinctColumns',
        ] as const
        for (const key of jsonKeys) {
          if (
            params[key] !== undefined &&
            params[key] !== null &&
            typeof params[key] === 'object'
          ) {
            params[key] = JSON.stringify(params[key])
          }
        }

        config.params = params
      }
      return config
    },
    response: (response) => {
      // Check if response data is an object (not an array) and has a data parameter
      if (
        response.data &&
        typeof response.data === 'object' &&
        !Array.isArray(response.data) &&
        'data' in response.data &&
        !RESULT_MARKER_KEYS.some((key) => key in (response.data as object))
      ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        response.data = response.data.data
      }
      return response
    },
  })
}

export function getApiClient(): RestApiClient {
  if (!apiClient) {
    throw new Error(
      'API client not initialized. Ensure DocyrusAuthProvider is mounted.',
    )
  }
  return apiClient
}

export { apiClient }
