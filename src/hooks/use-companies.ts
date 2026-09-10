import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseOrganizationCollection } from '@/collections'
import { getApiClient } from '@/lib/api'

interface UseCompaniesOptions {
  enabled?: boolean;
}

/**
 * Hook to list companies (organizations) with optional filters
 */
export function useCompanies(
  params?: ICollectionListParams,
  options: UseCompaniesOptions = {}
) {
  const organizationCollection = useBaseOrganizationCollection()

  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await organizationCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'name',
          'industry',
          'phone',
          'email',
          'website',
          'country(id,name)',
          'city(id,name)',
          'status',
          'type',
          'address',
          'tax_number',
          'created_on'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    },
    enabled: options.enabled
  })
}

/**
 * Hook to get a single company by ID
 */
export function useCompany(companyId: string | undefined) {
  const organizationCollection = useBaseOrganizationCollection()

  return useQuery({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error('Company ID is required')
      }
      const response = await organizationCollection.get(companyId, {
        columns: [
          'id',
          'name',
          'industry',
          'phone',
          'email',
          'website',
          'country(id,name,currency_symbol)',
          'city(id,name,latitude,longitude)',
          'status',
          'type',
          'lifecycle_stage',
          'commercial_title',
          'address',
          'tax_number',
          'district',
          'company_logo',
          'created_on'
        ]
      })

      return response
    },
    enabled: !!companyId
  })
}

/**
 * Stored value shape for an image/file field (e.g. `company_logo`).
 * Mirrors the platform's image field value so it round-trips through update.
 */
export interface CompanyLogoValue {
  file_name: string;
  file_type: string;
  file_size: number;
  signed_url: string;
  source: string;
  file_data?: unknown;
}

/**
 * Upload an image to the organization data source and persist it as the
 * company's `company_logo` field value. Uploading to the data-source-level
 * `/files/upload` endpoint returns the stored file metadata (incl. signed_url),
 * which is the same shape `company_logo` is read back as.
 */
export function useUploadCompanyLogo() {
  const { t } = useTranslation()
  const organizationCollection = useBaseOrganizationCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      companyId,
      file
    }: {
      companyId: string;
      file: File;
    }) => {
      const apiClient = getApiClient()
      const formData = new FormData()

      formData.append('file', file, file.name)

      const uploadResponse = await apiClient.post(
        '/v1/apps/base/data-sources/organization/files/upload',
        formData
      )

      // The endpoint may return the file object directly or wrapped in an array.
      const uploaded = (
        Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : ((uploadResponse as any)?.files?.[0] ?? uploadResponse)
      ) as Record<string, any> | undefined

      if (!uploaded?.signed_url && !uploaded?.source) {
        throw new Error('Upload did not return a usable file reference')
      }

      const logo: CompanyLogoValue = {
        file_name: uploaded.file_name ?? file.name,
        file_type: uploaded.file_type ?? file.type,
        file_size: uploaded.file_size ?? file.size,
        signed_url: uploaded.signed_url ?? '',
        source: uploaded.source ?? 'local',
        file_data: uploaded.file_data ?? null
      }

      return organizationCollection.update(companyId, { company_logo: logo })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({
        queryKey: ['companies', variables.companyId]
      })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('companies.logoUpdatedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('companies.logoUploadError'))
    }
  })
}

/**
 * Hook to create a new company
 */
export function useCreateCompany() {
  const { t } = useTranslation()
  const organizationCollection = useBaseOrganizationCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await organizationCollection.create(data)

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('companies.createdSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('companies.createError'))
    }
  })
}

/**
 * Hook to update a company
 */
export function useUpdateCompany() {
  const { t } = useTranslation()
  const organizationCollection = useBaseOrganizationCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      companyId,
      data
    }: {
      companyId: string;
      data: any;
    }) => {
      const response = await organizationCollection.update(companyId, data)

      return response
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({
        queryKey: ['companies', variables.companyId]
      })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('companies.updatedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('companies.updateError'))
    }
  })
}

/**
 * Hook to delete a company
 */
export function useDeleteCompany() {
  const { t } = useTranslation()
  const organizationCollection = useBaseOrganizationCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyId: string) => {
      await organizationCollection.delete(companyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('companies.deletedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('companies.deleteError'))
    }
  })
}

/**
 * Hook to delete multiple companies
 */
export function useDeleteCompanies() {
  const { t } = useTranslation()
  const organizationCollection = useBaseOrganizationCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyIds: Array<string>) => {
      await organizationCollection.deleteMany({ recordIds: companyIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('companies.bulkDeletedSuccess'))
    },
    onError: (error: any) => {
      toast.error(error?.message || t('companies.bulkDeleteError'))
    }
  })
}
