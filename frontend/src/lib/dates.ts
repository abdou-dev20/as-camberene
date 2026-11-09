const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (value: string | number | Date): Date => {
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
};

export const formatDate = (
  value: string | number | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
  fallback = ''
): string => {
  if (value === undefined || value === null || value === '') return fallback;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('fr-FR', options);
};

export const formatShortDate = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string => formatDate(value, { day: '2-digit', month: 'short', year: 'numeric' }, fallback);

export const formatFullDate = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string => formatDate(value, { day: 'numeric', month: 'long', year: 'numeric' }, fallback);

export const formatDayMonth = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string => formatDate(value, { weekday: 'short', day: '2-digit', month: 'short' }, fallback);

export const formatDayMonthYear = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string =>
  formatDate(value, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }, fallback);

export const formatLongDate = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string =>
  formatDate(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, fallback);

export const formatLongDateNoYear = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string => formatDate(value, { weekday: 'long', day: 'numeric', month: 'long' }, fallback);

export const formatDateTime = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string =>
  formatDate(
    value,
    { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    fallback
  );

export const formatMonthYear = (
  value: string | number | Date | undefined | null,
  fallback = ''
): string => formatDate(value, { month: 'long', year: 'numeric' }, fallback);
