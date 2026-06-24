// Single source of truth for the customs variance (under-valuation) thresholds.
// variancePercent = (estimatedValue - declaredValue) / declaredValue * 100.
// A POSITIVE variance means the declared value is below the system's estimated
// reference value (potential under-valuation = customs revenue risk).
//   >= VARIANCE_HIGH_AT  -> high risk (red)
//   >= VARIANCE_WARN_AT  -> elevated / under-valued (amber)
//   else                 -> within tolerance (green)
export const VARIANCE_WARN_AT = 10;
export const VARIANCE_HIGH_AT = 20;
