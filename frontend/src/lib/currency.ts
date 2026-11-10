const CURRENCY_LABEL = 'FCFA';

const groupSeparator = ' ';

const formatAmount = (amount: number): string =>
  Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);

export const formatCFA = (amount: number): string =>
  `${formatAmount(amount)} ${CURRENCY_LABEL}`;
