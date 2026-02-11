import type { RestApiClient } from '@docyrus/api-client'

// Module-level API client instance, set by the React app once DocyrusAuthProvider is ready
let apiClient: RestApiClient | null = null

export function setApiClient(client: RestApiClient) {
  apiClient = client

  // Add request interceptor for custom param handling
  apiClient.use({
    request: (config) => {
      // Handle columns array parameter - join as comma-separated
      if (
        config.params &&
        config.params.columns &&
        Array.isArray(config.params.columns)
      ) {
        config.params = {
          ...config.params,
          columns: config.params.columns.join(','),
        }
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
