export enum CurrencyCodeEnum {
    // Major currencies
    AUD = 'AUD',
    BTC = 'BTC',
    CAD = 'CAD',
    CHF = 'CHF',
    CNH = 'CNH',
    CZK = 'CZK',
    DKK = 'DKK',
    ETH = 'ETH',
    EUR = 'EUR',
    GBP = 'GBP',
    HKD = 'HKD',
    HUF = 'HUF',
    ILS = 'ILS',
    JPY = 'JPY',
    MXN = 'MXN',
    NOK = 'NOK',
    NZD = 'NZD',
    PLN = 'PLN',
    RUB = 'RUB',
    SEK = 'SEK',
    SGD = 'SGD',
    THB = 'THB',
    TRY = 'TRY',
    USD = 'USD',
    USDT = 'USDT',
    ZAR = 'ZAR',
    
    // Indices and commodities (using simplified codes for display)
    AUS200 = 'AUS200',
    COPPER = 'COPPER',
    ESP35 = 'ESP35',
    EU50 = 'EU50',
    FRA40 = 'FRA40',
    GER40 = 'GER40',
    HK50 = 'HK50',
    JPN225 = 'JPN225',
    NATGAS = 'NATGAS',
    UK100 = 'UK100',
    UKOIL = 'UKOIL',
    US100 = 'US100',
    US30 = 'US30',
    US500 = 'US500',
    USOIL = 'USOIL',
    
    // Precious metals
    XAG = 'XAG', // Silver
    XAU = 'XAU', // Gold
    XPD = 'XPD', // Palladium
    XPT = 'XPT', // Platinum
    
    // Unknown fallback
    UNKNOWN = 'UNKNOWN',
}

// Extended type to include all possible currency pairs
export type CurrencyPair = string; // Make this dynamic to accept any symbol from backend

interface CurrencyPairInfo {
    from: CurrencyCodeEnum;
    to: CurrencyCodeEnum;
}

// Enhanced function to parse any currency pair dynamically
export function getCurrencyFlags(pair: string): CurrencyPairInfo {
    if (!pair) {
        return {
            from: CurrencyCodeEnum.UNKNOWN,
            to: CurrencyCodeEnum.UNKNOWN
        };
    }

    // Handle precious metals first (they start with X)
    if (pair.startsWith('XAG')) {
        const toCurrency = pair.slice(3);
        return {
            from: CurrencyCodeEnum.XAG,
            to: getCurrencyCodeFromString(toCurrency)
        };
    }
    
    if (pair.startsWith('XAU')) {
        const toCurrency = pair.slice(3);
        return {
            from: CurrencyCodeEnum.XAU,
            to: getCurrencyCodeFromString(toCurrency)
        };
    }
    
    if (pair.startsWith('XPD')) {
        const toCurrency = pair.slice(3);
        return {
            from: CurrencyCodeEnum.XPD,
            to: getCurrencyCodeFromString(toCurrency)
        };
    }
    
    if (pair.startsWith('XPT')) {
        const toCurrency = pair.slice(3);
        return {
            from: CurrencyCodeEnum.XPT,
            to: getCurrencyCodeFromString(toCurrency)
        };
    }

    // Handle indices and commodities (single symbols)
    const singleSymbols = [
        'AUS200', 'COPPER', 'ESP35', 'EU50', 'FRA40', 'GER40', 
        'HK50', 'JPN225', 'NATGAS', 'UK100', 'UKOIL', 'US100', 
        'US30', 'US500', 'USOIL'
    ];
    
    if (singleSymbols.includes(pair)) {
        return {
            from: getCurrencyCodeFromString(pair),
            to: CurrencyCodeEnum.USD // Default to USD for indices
        };
    }

    // Handle regular currency pairs
    return parseCurrencyPair(pair);
}

function parseCurrencyPair(pair: string): CurrencyPairInfo {
    // Try different parsing strategies
    
    // Strategy 1: Known 3-letter combinations
    const knownCurrencies = [
        'AUD', 'BTC', 'CAD', 'CHF', 'CNH', 'CZK', 'DKK', 'ETH', 
        'EUR', 'GBP', 'HKD', 'HUF', 'ILS', 'JPY', 'MXN', 'NOK', 
        'NZD', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 
        'USDT', 'ZAR'
    ];
    
    // Try to find the split point
    for (let i = 3; i <= 4; i++) {
        if (i >= pair.length) continue;
        
        const firstPart = pair.substring(0, i);
        const secondPart = pair.substring(i);
        
        if (knownCurrencies.includes(firstPart) && knownCurrencies.includes(secondPart)) {
            return {
                from: getCurrencyCodeFromString(firstPart),
                to: getCurrencyCodeFromString(secondPart)
            };
        }
    }
    
    // Strategy 2: Default 3-3 split for 6-letter pairs
    if (pair.length === 6) {
        return {
            from: getCurrencyCodeFromString(pair.substring(0, 3)),
            to: getCurrencyCodeFromString(pair.substring(3))
        };
    }
    
    // Strategy 3: Default 3-4 split for 7-letter pairs (like USDUSDT)
    if (pair.length === 7) {
        return {
            from: getCurrencyCodeFromString(pair.substring(0, 3)),
            to: getCurrencyCodeFromString(pair.substring(3))
        };
    }
    
    // Fallback
    return {
        from: CurrencyCodeEnum.UNKNOWN,
        to: CurrencyCodeEnum.UNKNOWN
    };
}

function getCurrencyCodeFromString(currency: string): CurrencyCodeEnum {
    const upperCurrency = currency.toUpperCase();
    
    // Check if it exists in our enum
    if (Object.values(CurrencyCodeEnum).includes(upperCurrency as CurrencyCodeEnum)) {
        return upperCurrency as CurrencyCodeEnum;
    }
    
    return CurrencyCodeEnum.UNKNOWN;
}

// Legacy support - keep these exports for backward compatibility
export const currencyFlags = {
    AUDUSDT: { from: CurrencyCodeEnum.AUD, to: CurrencyCodeEnum.USDT },
    BTCUSDT: { from: CurrencyCodeEnum.BTC, to: CurrencyCodeEnum.USDT },
    EURCHF: { from: CurrencyCodeEnum.EUR, to: CurrencyCodeEnum.CHF },
    EURJPY: { from: CurrencyCodeEnum.EUR, to: CurrencyCodeEnum.JPY },
    EURUSDT: { from: CurrencyCodeEnum.EUR, to: CurrencyCodeEnum.USDT },
    EURUSD: { from: CurrencyCodeEnum.EUR, to: CurrencyCodeEnum.USD },
    GBPUSDT: { from: CurrencyCodeEnum.GBP, to: CurrencyCodeEnum.USDT },
    NZDUSDT: { from: CurrencyCodeEnum.NZD, to: CurrencyCodeEnum.USDT },
    USDTCAD: { from: CurrencyCodeEnum.USDT, to: CurrencyCodeEnum.CAD },
} as const;

export function getFlagUrl(symbol: CurrencyCodeEnum): string {
    return `/images/flags${symbol.toLowerCase()}.png`;
}

export const CurrencyPairOptions = Object.keys(currencyFlags) as [
    keyof typeof currencyFlags,
    ...(keyof typeof currencyFlags)[],
];

export const DirectionOptions = ['Long', 'Short'] as const;