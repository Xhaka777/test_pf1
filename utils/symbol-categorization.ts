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
  
  // Crypto
  crypto: [
    "BTCUSD", "ETHUSD"
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
 * Forex tab: forex symbols
 * Stocks tab: indices, metals, commodities (everything else except crypto and forex)
 */
export function getSymbolsForTab<T extends { symbol: string }>(
  symbols: T[], 
  tab: 'forex' | 'stocks'
): T[] {
  if (tab === 'forex') {
    return filterSymbolsByCategory(symbols, 'forex');
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
 */
export function categorizeProviderSymbol(symbol: string): SymbolCategory | null {
  // Direct match first
  const directMatch = getSymbolCategory(symbol);
  if (directMatch) return directMatch;
  
  // For provider symbols that might have different formats
  // Handle cases like "FTSE RAFI US1000" -> should be categorized as indices/stocks
  const upperSymbol = symbol.toUpperCase();
  
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
  if (/^[A-Z]{6}$/.test(symbol) || /^[A-Z]{3}\/[A-Z]{3}$/.test(symbol)) {
    return 'forex';
  }
  
  // Check for crypto patterns
  if (
    upperSymbol.includes('BTC') ||
    upperSymbol.includes('ETH') ||
    upperSymbol.includes('CRYPTO')
  ) {
    return 'crypto';
  }
  
  // Default to indices (stocks tab) for unknown symbols
  return 'indices';
}