export enum CurrencyCodeEnum {
    AUD = 'AUD',
    BTC = 'BTC',
    USDT = 'USDT',
    EUR = 'EUR',
    CHF = 'CHF',
    JPY = 'JPY',
    GBP = 'GBP',
    NZD = 'NZD',
    CAD = 'CAD',
    USD = 'USD',
    UKNOWN = 'UNKNOWN',
}

type GetCurrencyPair<T extends `${CurrencyCodeEnum}${CurrencyCodeEnum}`> =
    T extends `${infer A}${infer B}` ? `${A}${B}` : never;


export type CurrencyPair = GetCurrencyPair<
    | 'AUDUSDT'
    | 'BTCUSDT'
    | 'EURCHF'
    | 'EURJPY'
    | 'EURUSDT'
    | 'GBPUSDT'
    | 'NZDUSDT'
    | 'USDTCAD'
    | 'EURUSD'
>;

export const currencyFlags = {
    AUDUSDT: {
        from: CurrencyCodeEnum.AUD,
        to: CurrencyCodeEnum.USDT,
    },
    BTCUSDT: {
        from: CurrencyCodeEnum.BTC,
        to: CurrencyCodeEnum.USDT
    },
    EURCHF: {
        from: CurrencyCodeEnum.EUR,
        to: CurrencyCodeEnum.CHF
    },
    EURJPY: {
        from: CurrencyCodeEnum.EUR,
        to: CurrencyCodeEnum.JPY
    },
    EURUSDT: {
        from: CurrencyCodeEnum.EUR,
        to: CurrencyCodeEnum.USDT
    },
    EURUSD: {
        from: CurrencyCodeEnum.EUR,
        to: CurrencyCodeEnum.USD
    },
    GBPUSDT: {
        from: CurrencyCodeEnum.GBP,
        to: CurrencyCodeEnum.USDT
    },
    NZDUSDT: {
        from: CurrencyCodeEnum.NZD,
        to: CurrencyCodeEnum.USDT
    },
    USDTCAD: {
        from: CurrencyCodeEnum.USDT,
        to: CurrencyCodeEnum.CAD
    },
} as const satisfies Record<CurrencyPair, { from: CurrencyCodeEnum; to: CurrencyCodeEnum }>;

export function getCurrencyFlags(pair: CurrencyPair | string) {
    return (
        currencyFlags[pair as CurrencyPair] || {
            from: CurrencyCodeEnum.UKNOWN,
            to: CurrencyCodeEnum.UKNOWN
        }
    )
}

export function getFlagUrl(symbol: CurrencyCodeEnum): string {
    return `/images/flags${symbol.toLowerCase()}.png`;
}

export const CurrencyPairOptions = Object.keys(currencyFlags) as [
    keyof typeof currencyFlags,
    ...(keyof typeof currencyFlags)[],
];

export const DirectionOptions = ['Long', 'Short'] as const;