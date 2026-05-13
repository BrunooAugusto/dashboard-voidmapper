// Legacy shim — data layer is now handled directly via Supabase client.
// setUnauthorizedHandler is kept so App.jsx compiles without changes.
let _onUnauthorized = null
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn }
export function triggerUnauthorized() { _onUnauthorized?.() }
