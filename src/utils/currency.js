// 테스트 환경에서는 SOL 단위의 자산을 충분히 확보하기 어렵기 때문에
// 모든 가격 및 수수료 값을 SOL 환산 없이 그대로 lamports 단위로 취급한다.
// 따라서 1 SOL = 1 lamport 로 간주한다.
const LAMPORTS_PER_SOL_VALUE = 1;

export const convertSolToLamports = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return numericValue * LAMPORTS_PER_SOL_VALUE;
};

export const formatLamports = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '0 lamports';
  }

  const formatOptions = Number.isInteger(numericValue)
    ? undefined
    : { maximumFractionDigits: 9 };

  return `${numericValue.toLocaleString(undefined, formatOptions)} lamports`;
};

export const lamportsToSol = (lamports) => {
  const numericValue = Number(lamports || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return numericValue / LAMPORTS_PER_SOL_VALUE;
};

export const LAMPORTS_PER_SOL_CONSTANT = LAMPORTS_PER_SOL_VALUE;
