// Generated collection for users
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'

export interface UserEntity {
  /** ID */
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

  /** Photo URL */
  photo?: string | null

  /** Primary team */
  primary_team?: string | null

  /** Activity status */
  activity_status?: number | null

  /** Locale */
  locale?: string | null

  /** Country */
  country?: string | null

  /** User status */
  status?: number | null

  /** Tenant object */
  tenant: UserTenantDto
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

export interface UpdateCommentDto {
  /** Comment message */
  message?: string

  /** Parent comment ID */
  parentId?: string

  /** Assigned user ID */
  assignedTo?: string

  /** Attachments */
  attachments?: Record<string, any>

  /** Comment level */
  level?: number

  /** Comment status */
  status?: number

  /** Is comment done */
  done?: boolean
}

export interface UserCommentReplyDto {
  /** Reply message */
  message: string

  /** Attachments */
  attachments?: Record<string, any>

  /** Assigned user ID */
  assignedTo?: string
}

export interface AclCreateRoleDto {}

export interface AclUpdateRoleDto {}

export interface AclReplaceUserRolesDto {}

export interface AclCreateRoleQueryDto {}

export interface AclUpdateRoleQueryDto {}

export interface AclShareRequestDto {}

export interface AclRevokeRequestDto {}

export interface AclTransferOwnerDto {}

export interface UserTenantDto {
  /** Tenant/Company ID */
  id: string

  /** Tenant/Company Name */
  name: string

  /** Tenant/Company No */
  no: string

  /** Tenant/Company logo URL */
  logo_url?: string | null
}

export function useUsersCollection() {
  const client = useDocyrusClient()

  // Memoized so the returned object's identity is stable across renders.
  // Same rationale as the data-source collection hooks — see the comment
  // in collections.ts.
  return useMemo(
    () => ({
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
       * Update my photo
       * @param data - Request body
       */
      updateMyPhoto: (data: any) => client!.put('/v1/users/me/photo', data),

      /**
       * Update user
       * @param userId -
       * @param data - Request body
       * @returns UserEntity
       */
      updateUser: (
        userId: string,
        data: UserUpdateParams,
      ): Promise<UserEntity> =>
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

      /**
       * Get current user's tenants
       */
      getMyTenants: () => client!.get('/v1/users/me/tenants'),

      /**
       * List my comments
       */
      getMyComments: () => client!.get('/v1/users/me/comments'),

      /**
       * Update my comment
       * @param commentId - Comment ID
       * @param data - Request body
       */
      updateMyComment: (commentId: string, data: UpdateCommentDto) =>
        client!.patch(
          '/v1/users/me/comments/{commentId}'.replace(
            '{commentId}',
            commentId.toString(),
          ),
          data,
        ),

      /**
       * Delete my comment
       * @param commentId - Comment ID
       */
      deleteMyComment: (commentId: string) =>
        client!.delete(
          '/v1/users/me/comments/{commentId}'.replace(
            '{commentId}',
            commentId.toString(),
          ),
        ),

      /**
       * Reply to a comment
       * @param commentId - Parent comment ID to reply to
       * @param data - Request body
       */
      replyToComment: (commentId: string, data: UserCommentReplyDto) =>
        client!.put(
          '/v1/users/me/comments/{commentId}/reply'.replace(
            '{commentId}',
            commentId.toString(),
          ),
          data,
        ),

      /**
       * List my activities
       */
      getMyActivities: () => client!.get('/v1/users/me/activities'),

      /**
       * List user activities
       */
      getUserActivities: () => client!.get('/v1/users/activities'),

      /**
       * Get record ACL
       * Return direct and effective ACL entries for a record in a data source.
       */
      getAcl: () => client!.get('/v1/users/acl'),

      /**
       * List roles
       * List tenant roles, optionally filtered by name or slug.
       */
      listRoles: () => client!.get('/v1/users/acl/roles'),

      /**
       * Create role
       * Create a new tenant role.
       * @param data - Request body
       */
      createRole: (data: AclCreateRoleDto) =>
        client!.post('/v1/users/acl/roles', data),

      /**
       * Get role
       * Get a single tenant role by id, uid, or slug.
       * @param roleId - Tenant role id
       */
      getRole: (roleId: string) =>
        client!.get(
          '/v1/users/acl/roles/{roleId}'.replace('{roleId}', roleId.toString()),
        ),

      /**
       * Update role
       * Partially update an existing tenant role.
       * @param roleId - Tenant role id
       * @param data - Request body
       */
      updateRole: (roleId: string, data: AclUpdateRoleDto) =>
        client!.patch(
          '/v1/users/acl/roles/{roleId}'.replace('{roleId}', roleId.toString()),
          data,
        ),

      /**
       * Delete role
       * Delete a tenant role and all related assignments and rules.
       * @param roleId - Tenant role id
       */
      deleteRole: (roleId: string) =>
        client!.delete(
          '/v1/users/acl/roles/{roleId}'.replace('{roleId}', roleId.toString()),
        ),

      /**
       * List user-role assignments
       * List user-role assignments, optionally filtered by user or role.
       */
      listUserRoles: () => client!.get('/v1/users/acl/user-roles'),

      /**
       * Get user roles
       * List roles assigned to a specific user.
       * @param userId - Tenant user id
       */
      getUserRoles: (userId: string) =>
        client!.get(
          '/v1/users/acl/users/{userId}/roles'.replace(
            '{userId}',
            userId.toString(),
          ),
        ),

      /**
       * Add user roles
       * Add roles to a user without removing existing assignments.
       * @param userId - Tenant user id
       * @param data - Request body
       */
      addUserRoles: (userId: string, data: AclReplaceUserRolesDto) =>
        client!.post(
          '/v1/users/acl/users/{userId}/roles'.replace(
            '{userId}',
            userId.toString(),
          ),
          data,
        ),

      /**
       * Replace user roles
       * Replace the full set of roles assigned to a user.
       * @param userId - Tenant user id
       * @param data - Request body
       */
      replaceUserRoles: (userId: string, data: AclReplaceUserRolesDto) =>
        client!.put(
          '/v1/users/acl/users/{userId}/roles'.replace(
            '{userId}',
            userId.toString(),
          ),
          data,
        ),

      /**
       * Remove user role
       * Remove a single role from a user's assignments.
       * @param userId - Tenant user id
       * @param roleId - Tenant role id
       */
      removeUserRole: (userId: string, roleId: string) =>
        client!.delete(
          '/v1/users/acl/users/{userId}/roles/{roleId}'
            .replace('{userId}', userId.toString())
            .replace('{roleId}', roleId.toString()),
        ),

      /**
       * List role queries
       * List tenant role queries, optionally filtered by data source, role, or restriction level.
       */
      listRoleQueries: () => client!.get('/v1/users/acl/role-queries'),

      /**
       * Create role query
       * Create a new role query bound to one or more roles.
       * @param data - Request body
       */
      createRoleQuery: (data: AclCreateRoleQueryDto) =>
        client!.post('/v1/users/acl/role-queries', data),

      /**
       * Get role query
       * Get a single role query by id.
       * @param roleQueryId - Tenant role query id
       */
      getRoleQuery: (roleQueryId: string) =>
        client!.get(
          '/v1/users/acl/role-queries/{roleQueryId}'.replace(
            '{roleQueryId}',
            roleQueryId.toString(),
          ),
        ),

      /**
       * Update role query
       * Partially update an existing role query.
       * @param roleQueryId - Tenant role query id
       * @param data - Request body
       */
      updateRoleQuery: (roleQueryId: string, data: AclUpdateRoleQueryDto) =>
        client!.patch(
          '/v1/users/acl/role-queries/{roleQueryId}'.replace(
            '{roleQueryId}',
            roleQueryId.toString(),
          ),
          data,
        ),

      /**
       * Delete role query
       * Delete a role query.
       * @param roleQueryId - Tenant role query id
       */
      deleteRoleQuery: (roleQueryId: string) =>
        client!.delete(
          '/v1/users/acl/role-queries/{roleQueryId}'.replace(
            '{roleQueryId}',
            roleQueryId.toString(),
          ),
        ),

      /**
       * Share record
       * Grant ACL permissions to one or more principals on a record.
       * @param data - Request body
       */
      shareRecord: (data: AclShareRequestDto) =>
        client!.post('/v1/users/acl/share', data),

      /**
       * Revoke record share
       * Revoke ACL permissions previously granted to one or more principals on a record.
       * @param data - Request body
       */
      revokeRecordShare: (data: AclRevokeRequestDto) =>
        client!.delete('/v1/users/acl/share', data),

      /**
       * Transfer record ownership
       * Transfer ownership of a record to a different user.
       * @param data - Request body
       */
      transferRecordOwner: (data: AclTransferOwnerDto) =>
        client!.put('/v1/users/acl/owner', data),
    }),
    [client],
  )
}
