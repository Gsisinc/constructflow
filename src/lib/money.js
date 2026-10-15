// Central money formatting for MYGSIS financial surfaces.
// Always 2 decimals; rounds to cents so sub-cent float residuals show $0.00.

export const roundCents = (n) => {
  const v = Number.isFinite(n) ? Number(n) : 0;
  return Math.round(v * 100) / 100;
};

export const fmtMoney = (n) => {
  const cents = roundCents(n);
  const str = '$' + Math.abs(cents).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cents < 0 ? '(' + str + ')' : str;
};

export const signedMoney = (n) => {
  const cents = roundCents(n);
  if (cents === 0) return '$0.00';
  return cents < 0 ? '(' + fmtMoney(Math.abs(cents)) + ')' : fmtMoney(cents);
};

// Exact whole-dollar formatting for summary surfaces (project cards, bids,
// dashboard budget card, accounts) where cents aren't meaningful.
export const fmtDollars = (n) => {
  const cents = roundCents(n);
  const str = '$' + Math.round(Math.abs(cents)).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return cents < 0 ? '(' + str + ')' : str;
};