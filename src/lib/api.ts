import type { RestApiClient } from '@docyrus/api-client'

// Module-level API client instance, set by the React app once DocyrusAuthProvider is ready
let apiClient: RestApiClient | null = null

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
          'distinctColumns'
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
        'data' in response.data
      ) {
        // @ts-ignore
        response.data = response.data.data
      }

      return response
    }
  })
}

export function getApiClient(): RestApiClient {
  if (!apiClient) {
    throw new Error(
      'API client not initialized. Ensure DocyrusAuthProvider is mounted.'
    )
  }

  return apiClient
}

export { apiClient }
