// Generated collection for users
import { useDocyrusClient } from '@docyrus/signin'

export interface UserEntity {
  /** Tenant/Company ID */
  id?: string

  /** Created On */
  created_on?: string

  /** Created By */
  created_by?: string

  /** Last Modified On */
  last_modified_on?: string

  /** Last Modified By */
  last_modified_by?: string

  /** Email address (username) */
  email: string

  /** First name */
  firstname: string

  /** Last name */
  lastname: string

  /** Gender */
  gender: string

  /** Telephone number */
  mobile: string

  /** Time zone id */
  time_zone: string

  /** Language/locale id */
  language: string

  /** Job title */
  job_title: string

  /** Primary role */
  primary_role: string

  /** Additional Roles */
  role: Array<any>

  /** Date of birth */
  date_of_birth: string

  /** Notify User by Email */
  notify_user: boolean

  /** Organization Unit id */
  tenant_user_hierarchy_unit_id: string

  /** Tenant/Company Name */
  name: string

  /** Tenant/Company No */
  no: string

  /** Tenant info */
  tenant?: {
    id: string
    name: string
    no: number
    logo_url?: string
  }
}

export interface UserCreateParams {
  /** Email address (username) */
  email: string

  /** Password */
  password: string

  /** First name */
  firstname: string

  /** Last name */
  lastname: string

  /** Gender */
  gender: string

  /** Telephone number */
  mobile: string

  /** Time zone id */
  time_zone: string

  /** Language/locale id */
  language: string

  /** Job title */
  job_title: string

  /** Primary role */
  primary_role: string

  /** Additional Roles */
  role: Array<any>

  /** Date of birth */
  date_of_birth: string

  /** Notify User by Email */
  notify_user: boolean

  /** Organization Unit id */
  tenant_user_hierarchy_unit_id: string
}

export interface UserUpdateParams {
  /** Password */
  password?: string

  /** First name */
  firstname?: string

  /** Last name */
  lastname?: string

  /** Gender */
  gender?: string

  /** Telephone number */
  mobile?: string

  /** Time zone id */
  time_zone?: string

  /** Language/locale id */
  language?: string

  /** Job title */
  job_title?: string

  /** Primary role */
  primary_role?: string

  /** Additional Roles */
  role?: Array<any>

  /** Date of birth */
  date_of_birth?: string

  /** Notify User by Email */
  notify_user?: boolean

  /** Organization Unit id */
  tenant_user_hierarchy_unit_id?: string
}

export interface UserDeviceDto {
  /** Device platform */
  platform: string

  /** Push notification token */
  push_token: string

  /** Whether device is enabled */
  enabled?: boolean
}

export function useUsersCollection() {
  const client = useDocyrusClient()

  return {
    /**
     * List all users
     * @returns Array<UserEntity>
     */
    getUsers: (): Promise<Array<UserEntity>> =>
      client!.get<Array<UserEntity>>('/v1/users'),

    /**
     * Create user
     * @param data - Request body
     * @returns UserEntity
     */
    createUser: (data: UserCreateParams): Promise<UserEntity> =>
      client!.post<UserEntity>('/v1/users', data),

    /**
     * Get my info
     * @returns UserEntity
     */
    getMyInfo: (): Promise<UserEntity> =>
      client!.get<UserEntity>('/v1/users/me'),

    /**
     * Update current user
     * @param data - Request body
     * @returns UserEntity
     */
    updateMe: (data: UserUpdateParams): Promise<UserEntity> =>
      client!.patch<UserEntity>('/v1/users/me', data),

    /**
     * Update user
     * @param userId -
     * @param data - Request body
     * @returns UserEntity
     */
    updateUser: (userId: string, data: UserUpdateParams): Promise<UserEntity> =>
      client!.patch<UserEntity>(
        '/v1/users/{userId}'.replace('{userId}', userId.toString()),
        data,
      ),

    /**
     * Change user status
     * @param userId -
     * @param status -
     */
    changeUserStatus: (userId: string, status: number) =>
      client!.put(
        '/v1/users/{userId}/status/{status}'
          .replace('{userId}', userId.toString())
          .replace('{status}', status.toString()),
      ),

    /**
     * Save user device for notifications
     * @param data - Request body
     */
    saveUserDevice: (data: UserDeviceDto) =>
      client!.post('/v1/users/device', data),
  }
}
