// Central money formatting for MYGSIS financial surfaces.
// Always 2 decimals; rounds to cents so sub-cent float residuals show $0.00.

export const roundCents = (n) => {
  const v = Number.isFinite(n) ? Number(n) : 0;
  return Math.round(v * 100) / 100;
};

export const fmtMoney = (n) => {
  const cents = roundCents(n);
  return '$' + cents.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const signedMoney = (n) => {
  const cents = roundCents(n);
  if (cents === 0) return '$0.00';
  return cents < 0 ? '(' + fmtMoney(Math.abs(cents)) + ')' : fmtMoney(cents);
};