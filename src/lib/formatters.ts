/**
 * Utility functions for formatting data display
 */

/**
 * Format currency values with symbol and locale-aware formatting
 */
export function formatCurrency(
  value: number | null | undefined,
  currencySymbol: string = '$',
  locale: string = 'en-US',
): string {
  if (value === null || value === undefined) {
    return `${currencySymbol}0`
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)

  return `${currencySymbol}${formatted}`
}

/**
 * Format date with relative time for recent dates
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: {
    format?: 'short' | 'long' | 'relative'
    locale?: string
  } = {},
): string {
  if (!date) {
    return '-'
  }

  const { format = 'short', locale = 'en-US' } = options
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return '-'
  }

  // Relative time for dates within the last 7 days
  if (format === 'relative') {
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        if (diffInMinutes === 0) {
          return 'Just now'
        }
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
      }
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    }
  }

  // Format options based on style
  const formatOptions: Intl.DateTimeFormatOptions =
    format === 'long'
      ? {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 0,
): string {
  if (value === null || value === undefined) {
    return '0%'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * Format phone numbers (basic international format)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) {
    return '-'
  }

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Check if it's a US/Canada number (10 digits) or international (more than 10)
  if (cleaned.length === 10) {
    // US/Canada format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length > 10) {
    // International format: +X XXX XXX XXXX
    const countryCode = cleaned.slice(0, cleaned.length - 10)
    const rest = cleaned.slice(-10)
    return `+${countryCode} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
  }

  // Return as-is if doesn't match expected patterns
  return phone
}

/**
 * Format compact numbers (e.g., 1.2K, 3.5M)
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })

  return formatter.format(value)
}
