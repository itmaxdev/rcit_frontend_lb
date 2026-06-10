// src/functions/format.js
// Shared number-formatting helpers so user-facing numeric values consistently
// use thousand separators (e.g. 1,234,567.89 / 12,345).

const isMissing = (value) =>
  value === null || value === undefined || value === "";

// Money / decimal value with thousand separators and 2 decimals.
// Returns `fallback` for missing or non-numeric values.
export const formatMoney = (value, fallback = "-") => {
  if (isMissing(value)) return fallback;
  const amount = Number(value);
  if (Number.isNaN(amount)) return fallback;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Integer count with thousand separators.
// Returns `fallback` for missing or non-numeric values.
export const formatCount = (value, fallback = "-") => {
  if (isMissing(value)) return fallback;
  const amount = Number(value);
  if (Number.isNaN(amount)) return fallback;
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
