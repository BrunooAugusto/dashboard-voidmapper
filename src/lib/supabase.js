import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) throw new Error('[supabase] VITE_SUPABASE_URL is not set. Check .env.local')
if (!SUPABASE_KEY) throw new Error('[supabase] VITE_SUPABASE_ANON_KEY is not set. Check .env.local')
if (!SUPABASE_URL.startsWith('https://')) throw new Error(`[supabase] URL must start with https:// — got: "${SUPABASE_URL}"`)


export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
