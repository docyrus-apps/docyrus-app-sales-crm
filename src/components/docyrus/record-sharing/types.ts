import { type UiI18nLocale } from '@/lib/ui-i18n';

export const SharingPermission = {
  READ: 1,
  WRITE: 2,
  COMMENT: 4,
  SHARE: 8,
  DELETE: 16
} as const;

export type SharingPermissionValue = (typeof SharingPermission)[keyof typeof SharingPermission];

export const SharingPermissionPreset = {
  CAN_VIEW: 1,
  CAN_COMMENT: 5,
  CAN_EDIT: 7,
  CAN_SHARE: 15,
  FULL_ACCESS: 31
} as const;

export type SharingPermissionPresetValue = (typeof SharingPermissionPreset)[keyof typeof SharingPermissionPreset];

export type SharingResourceType = 'user' | 'team' | 'role' | 'tenant' | 'public';

export interface SharingSearchResult {
  id: string;
  name: string;
  description?: string;
  type: SharingResourceType;
  avatarUrl?: string | null;
  initials?: string;
}

export interface SharedEntity {
  id: string;
  name: string;
  description?: string;
  type: SharingResourceType;
  avatarUrl?: string | null;
  initials?: string;
  permission: number;
}

export interface PermissionPresetOption {
  label: string;
  value: number;
  description?: string;
}

export interface RecordSharingPanelProps {
  sharedEntities: SharedEntity[];
  resources?: SharingResourceType[];
  permissionPresets?: PermissionPresetOption[];
  defaultPermission?: number;
  onSearch: (query: string) => Promise<SharingSearchResult[]> | SharingSearchResult[];
  onAdd: (entities: Array<{ id: string; type: SharingResourceType; permission: number }>) => void | Promise<void>;
  onPermissionChange: (entityId: string, permission: number) => void | Promise<void>;
  onRemove: (entityId: string) => void | Promise<void>;
  isLoading?: boolean;
  isSearching?: boolean;
  isAddPending?: boolean;
  pendingPermissionChanges?: Record<string, boolean>;
  pendingRemovals?: Record<string, boolean>;
  title?: string;
  maxHeight?: number | string;
  locale?: UiI18nLocale;
  className?: string;
}

export interface RecordSharingButtonProps extends RecordSharingPanelProps {
  variant?: 'button' | 'avatar-group';
  maxAvatars?: number;
  size?: 'sm' | 'default' | 'lg';
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerClassName?: string;
}

export interface RecordSharingItemProps {
  entity: SharedEntity;
  permissionPresets: PermissionPresetOption[];
  onPermissionChange: (entityId: string, permission: number) => void | Promise<void>;
  onRemove: (entityId: string) => void | Promise<void>;
  isPermissionChangePending?: boolean;
  isRemovePending?: boolean;
  locale?: UiI18nLocale;
}