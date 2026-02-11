import { getApiClient } from '@/lib/api'

interface UserInfo {
  id?: string
  email?: string
  firstname?: string
  lastname?: string
}

export const UsersCollection = {
  async getMyInfo(): Promise<UserInfo> {
    const response = await getApiClient().get<UserInfo>('/v1/users/me')
    // The response interceptor in api.ts unwraps nested data structures

    return (response as any).data as UserInfo
  },
}
