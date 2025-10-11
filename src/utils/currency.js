const LAMPORTS_PER_SOL_VALUE = 1_000_000_000;

export const convertSolToLamports = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.round(numericValue * LAMPORTS_PER_SOL_VALUE);
};

export const formatLamports = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '0 lamports';
  }
  return `${Math.round(numericValue).toLocaleString()} lamports`;
};

export const lamportsToSol = (lamports) => {
  const numericValue = Number(lamports || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return numericValue / LAMPORTS_PER_SOL_VALUE;
};

export const LAMPORTS_PER_SOL_CONSTANT = LAMPORTS_PER_SOL_VALUE;
