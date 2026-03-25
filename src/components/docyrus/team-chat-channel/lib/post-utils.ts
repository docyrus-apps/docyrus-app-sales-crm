const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);

    return `${mins}m ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);

    return `${hours}h ago`;
  }
  if (diff < DAY * 7) {
    const days = Math.floor(diff / DAY);

    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function getUserDisplayName(user: { firstname?: string | null; lastname?: string | null } | undefined): string {
  if (!user) return 'Unknown User';

  return `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || 'Unknown User';
}

export function getUserInitials(user: { firstname?: string | null; lastname?: string | null } | undefined): string {
  if (!user) return '?';

  return `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}` || '?';
}