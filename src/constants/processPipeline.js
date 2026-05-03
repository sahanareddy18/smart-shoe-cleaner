/** Full cleaning pipeline steps (deep clean). Dry-only uses a shorter list in context. */
export const PIPELINE_DEEP = [
  { id: 'presence', label: 'Detect shoe presence' },
  { id: 'type', label: 'Identify shoe type' },
  { id: 'wash', label: 'Cleaning & agitation' },
  { id: 'rinse', label: 'Rinse' },
  { id: 'dry', label: 'Drying' },
  { id: 'deodorize', label: 'Deodorization' },
  { id: 'uv', label: 'UV sterilization' },
  { id: 'store', label: 'Cycle complete · Ready to store' },
]

export const PIPELINE_DRY = [
  { id: 'presence', label: 'Detect shoe presence' },
  { id: 'type', label: 'Confirm shoe type' },
  { id: 'dry', label: 'Drying' },
  { id: 'deodorize', label: 'Deodorization' },
  { id: 'uv', label: 'UV sterilization' },
  { id: 'store', label: 'Cycle complete · Ready to store' },
]

export const SHOE_PROFILES = [
  { id: 'sports', label: 'Sports' },
  { id: 'leather', label: 'Leather' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'delicate', label: 'Delicate' },
]

export function profileLabel(id) {
  return SHOE_PROFILES.find((p) => p.id === id)?.label ?? id
}

/** Map overall progress % to pipeline index for deep clean */
export function deepStepIndex(progress) {
  if (progress < 6) return 0
  if (progress < 12) return 1
  if (progress < 38) return 2
  if (progress < 48) return 3
  if (progress < 72) return 4
  if (progress < 84) return 5
  if (progress < 96) return 6
  return 7
}

export function dryStepIndex(progress) {
  if (progress < 10) return 0
  if (progress < 18) return 1
  if (progress < 55) return 2
  if (progress < 78) return 3
  if (progress < 94) return 4
  return 5
}
