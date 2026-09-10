import type { EnumOption } from '@/components/docyrus/form-fields/types'

function optionId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value)
    return (value as { id?: string }).id ?? null

  return typeof value === 'string' ? value : null
}

function optionName(value: unknown): string | null {
  if (value && typeof value === 'object' && 'name' in value) {
    const { name } = value as { name?: string }

    return name?.trim() ? name : null
  }
  if (value && typeof value === 'object' && 'label' in value) {
    const { label } = value as { label?: string }

    return label?.trim() ? label : null
  }
  if (
    value &&
    typeof value === 'object' &&
    ('firstname' in value || 'lastname' in value)
  ) {
    const user = value as { firstname?: string; lastname?: string }
    const fullName = `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim()

    if (fullName) return fullName
  }
  if (value && typeof value === 'object' && 'email' in value) {
    const { email } = value as { email?: string }

    return email?.trim() ? email : null
  }

  return null
}

export function mergeCurrentEnumOption(
  options: Array<EnumOption>,
  value: unknown
): Array<EnumOption> {
  const id = optionId(value)
  const name = optionName(value)

  if (!id || !name || options.some(option => option.id === id)) return options

  const current =
    value && typeof value === 'object'
      ? (value as { color?: string | null; icon?: string | null })
      : {}

  return [
    {
      id,
      name,
      color: current.color ?? undefined,
      icon: current.icon ?? undefined
    },
    ...options
  ]
}
