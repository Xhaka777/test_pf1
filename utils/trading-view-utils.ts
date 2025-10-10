export const TRADING_VIEW_LOCALSTORAGE_PREFIX =
  'TRADING_VIEW_LOCALSTORAGE_PREFIX';

export const getTvLocalStorageKey = (suffix: string): string =>
  `${TRADING_VIEW_LOCALSTORAGE_PREFIX}_${suffix}`;
