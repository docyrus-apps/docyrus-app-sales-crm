import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/*
 * Storage-only Supabase client.
 *
 * The app never signs in to Supabase. It forwards the session token the Docyrus
 * shell hands it through the `accessToken` hook supabase-js exposes for
 * third-party authentication, which takes the client's own auth namespace out of
 * play: no stored session, and no refresh timer that could race the shell's own.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** False when the storage env vars are absent. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Builds a client bound to one caller's token. Cheap enough to make per
 * operation, which keeps the token from going stale in a long-lived instance.
 */
export function createStorageClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    accessToken: async () => accessToken,
  })
}
