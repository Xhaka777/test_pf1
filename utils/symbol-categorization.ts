// utils/symbol-categorization.ts
export type SymbolCategory = 'forex' | 'stocks' | 'crypto' | 'metals' | 'commodities' | 'indices';

// Define symbol lists by category
export const SYMBOL_CATEGORIES = {
  // Indices
  indices: [
    "UK100", "JPN225", "FRA40", "US30", "AUS200", "US500", 
    "ESP35", "GER40", "US100", "EU50", "HK50"
  ],
  
  // Metals
  metals: [
    "XAGAUD", "XAUCHF", "XAUGBP", "XPTUSD", "XAGEUR", "XAUUSD", 
    "XPDUSD", "XAGCHF", "XAGGBP", "XAUAUD", "XAGUSD", "XAUEUR", "COPPER"
  ],
  
  // Commodities
  commodities: [
    "USOIL", "UKOIL", "NATGAS"
  ],
  
  // Forex pairs
  forex: [
    "EURUSD", "AUDSGD", "CHFSGD", "EURCZK", "USDCNH", "USDDKK", 
    "AUDNOK", "CHFNOK", "EURJPY", "AUDNZD", "USDSGD", "EURHKD", 
    "USDRUB", "EURCHF", "USDNOK", "EURMXN", "GBPDKK", "PLNJPY", 
    "USDILS", "NZDSGD", "HKDJPY", "GBPSGD", "EURHUF", "GBPNOK", 
    "EURCAD", "USDTHB", "GBPNZD", "EURSEK", "EURTRY", "EURZAR", 
    "AUDUSD", "AUDJPY", "EURPLN", "CHFJPY", "USDCZK", "AUDCHF", 
    "SEKJPY", "USDJPY", "GBPAUD", "USDHKD", "CHFHUF", "USDCHF", 
    "ZARJPY", "USDMXN", "EURDKK", "NZDUSD", "NZDJPY", "AUDCAD", 
    "NOKJPY", "EURGBP", "GBPUSD", "GBPJPY", "USDHUF", "EURSGD", 
    "NZDCHF", "AUDSEK", "CHFSEK", "GBPCHF", "GBPMXN", "EURNOK", 
    "USDCAD", "NZDHUF", "EURNZD", "GBPHUF", "USDSEK", "NZDCAD", 
    "AUDPLN", "GBPCAD", "USDTRY", "CHFPLN", "USDZAR", "CADJPY", 
    "NOKSEK", "GBPSEK", "CADCHF", "USDPLN", "GBPTRY", "GBPZAR", 
    "GBPPLN", "EURAUD", "SGDJPY"
  ],
  
  // Crypto - keeping this for reference, but we'll map it to forex in the categorization logic
  crypto: [
    "BTCUSD", "ETHUSD", "BTCEUR", "ETHEUR", "BTCGBP", "ETHGBP"
  ]
};

// Create reverse lookup maps for efficient categorization
const symbolToCategoryMap = new Map<string, SymbolCategory>();

// Populate the reverse lookup map
Object.entries(SYMBOL_CATEGORIES).forEach(([category, symbols]) => {
  symbols.forEach(symbol => {
    symbolToCategoryMap.set(symbol, category as SymbolCategory);
  });
});

/**
 * Get the category of a symbol
 */
export function getSymbolCategory(symbol: string): SymbolCategory | null {
  return symbolToCategoryMap.get(symbol) || null;
}

/**
 * Check if a symbol belongs to a specific category
 */
export function isSymbolInCategory(symbol: string, category: SymbolCategory): boolean {
  return symbolToCategoryMap.get(symbol) === category;
}

/**
 * Filter symbols by category
 */
export function filterSymbolsByCategory<T extends { symbol: string }>(
  symbols: T[], 
  category: SymbolCategory
): T[] {
  return symbols.filter(item => isSymbolInCategory(item.symbol, category));
}

/**
 * For the TradingPrices component, we'll group categories into tabs
 * Forex tab: forex symbols + crypto (crypto trades like forex)
 * Stocks tab: indices, metals, commodities (everything else except crypto and forex)
 */
export function getSymbolsForTab<T extends { symbol: string }>(
  symbols: T[], 
  tab: 'forex' | 'stocks'
): T[] {
  if (tab === 'forex') {
    // Forex tab includes regular forex pairs AND crypto pairs
    return symbols.filter(item => {
      const category = getSymbolCategory(item.symbol);
      return category === 'forex' || category === 'crypto';
    });
  } else if (tab === 'stocks') {
    // Stocks tab includes indices, metals, and commodities
    return symbols.filter(item => {
      const category = getSymbolCategory(item.symbol);
      return category === 'indices' || category === 'metals' || category === 'commodities';
    });
  }
  return [];
}

/**
 * Get all symbols that match the symbol name patterns from your provider data
 * This function handles the case where provider data might have different naming
 * 
 * IMPORTANT: Crypto symbols are categorized as 'forex' for tab purposes
 */
export function categorizeProviderSymbol(symbol: string): SymbolCategory | null {
  // Direct match first
  const directMatch = getSymbolCategory(symbol);
  if (directMatch) {
    // If it's crypto, return 'forex' for tab categorization purposes
    if (directMatch === 'crypto') {
      return 'forex';
    }
    return directMatch;
  }
  
  // For provider symbols that might have different formats
  const upperSymbol = symbol.toUpperCase();
  
  const cryptoCurrencies = [
    'BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'DOT', 'SOL', 
    'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'XLM', 'DOGE',
    'SHIB', 'BCH', 'XMR', 'EOS', 'TRX', 'XTZ'
  ];
  
  // Check if symbol starts with any crypto currency (e.g., BTCEUR, ETHUSD, etc.)
  if (cryptoCurrencies.some(crypto => upperSymbol.startsWith(crypto))) {
    return 'forex'; 
  }
  
  // Check for common stock/ETF patterns
  if (
    upperSymbol.includes('FTSE') ||
    upperSymbol.includes('S&P') ||
    upperSymbol.includes('QQQ') ||
    upperSymbol.includes('ETF') ||
    upperSymbol.includes('TRUST') ||
    upperSymbol.includes('FUND') ||
    upperSymbol.includes('PORTFOLIO') ||
    upperSymbol.includes('INDEX') ||
    upperSymbol.includes('DOW') ||
    upperSymbol.includes('NASDAQ') ||
    upperSymbol.includes('RUSSELL')
  ) {
    return 'indices'; // Will be grouped under 'stocks' tab
  }
  
  // Check for forex patterns (currency pairs)
  // Standard 6-letter pairs like EURUSD or pairs with slash like EUR/USD
  if (/^[A-Z]{6}$/.test(symbol) || /^[A-Z]{3}\/[A-Z]{3}$/.test(symbol)) {
    // Make sure it's not a crypto pair (already handled above)
    if (!cryptoCurrencies.some(crypto => upperSymbol.startsWith(crypto))) {
      return 'forex';
    }
  }
  
  // Fallback: Check if it contains crypto keywords
  if (
    upperSymbol.includes('BTC') ||
    upperSymbol.includes('ETH') ||
    upperSymbol.includes('CRYPTO')
  ) {
    return 'forex'; // Crypto goes to forex tab
  }
  
  // Default to indices (stocks tab) for unknown symbols
  return 'indices';
}