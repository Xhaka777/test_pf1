import { TradingPair } from "@/api/schema/trading-service";
import { ASSET_CONFIG, getAssetCategory } from "./asset-config";
import { categorizeProviderSymbol, SymbolCategory } from "./symbol-categorization";

export type TabType = 'forex' | 'stocks' | 'favorites';

/**
 * Enhanced symbol categorization that combines ASSET_CONFIG with fallback categorization
 */
export function getSymbolTabCategory(symbol: string): TabType | null {
  // First check ASSET_CONFIG
  const assetCategory = getAssetCategory(symbol);
  if (assetCategory) {
    return assetCategory === 'crypto' ? null : assetCategory; // Exclude crypto for now
  }

  // Fallback to provider categorization
  const providerCategory = categorizeProviderSymbol(symbol);
  
  switch (providerCategory) {
    case 'forex':
      return 'forex';
    case 'indices':
    case 'metals':
    case 'commodities':
      return 'stocks';
    case 'crypto':
      return null; // Exclude crypto for now
    default:
      return 'stocks'; // Default unknown symbols to stocks
  }
}

/**
 * Filter symbols for a specific tab
 */
export function filterSymbolsForTab(symbols: TradingPair[], tab: TabType, favoriteSymbols: string[]): TradingPair[] {
  if (tab === 'favorites') {
    return symbols.filter(symbol => favoriteSymbols.includes(symbol.symbol));
  }

  return symbols.filter(symbol => {
    const category = getSymbolTabCategory(symbol.symbol);
    return category === tab;
  });
}

/**
 * Get symbol counts for each tab
 */
export function getSymbolCounts(symbols: TradingPair[], favoriteSymbols: string[]): Record<TabType, number> {
  const counts = {
    forex: 0,
    stocks: 0,
    favorites: favoriteSymbols.length
  };

  symbols.forEach(symbol => {
    const category = getSymbolTabCategory(symbol.symbol);
    if (category && counts.hasOwnProperty(category)) {
      counts[category]++;
    }
  });

  return counts;
}

/**
 * Enhanced search function that works across all symbol types
 */
export function searchSymbols(symbols: TradingPair[], searchQuery: string): TradingPair[] {
  if (!searchQuery.trim()) return symbols;

  const query = searchQuery.toLowerCase().trim();
  
  return symbols.filter(symbol => {
    const symbolLower = symbol.symbol.toLowerCase();
    
    // Exact match
    if (symbolLower === query) return true;
    
    // Contains match
    if (symbolLower.includes(query)) return true;
    
    // Check if ASSET_CONFIG has a display name that matches
    const assetInfo = ASSET_CONFIG[symbol.symbol];
    if (assetInfo?.displayName?.toLowerCase().includes(query)) return true;
    
    // Check base and quote currencies
    if (assetInfo?.base?.toLowerCase().includes(query)) return true;
    if (assetInfo?.quote?.toLowerCase().includes(query)) return true;
    
    return false;
  });
}

/**
 * Get display information for a symbol
 */
export function getSymbolDisplayInfo(symbol: string): {
  displayName: string;
  category: TabType | null;
  type: string;
} {
  const assetInfo = ASSET_CONFIG[symbol];
  const category = getSymbolTabCategory(symbol);
  
  return {
    displayName: assetInfo?.displayName || symbol,
    category,
    type: assetInfo?.type || 'unknown'
  };
}

/**
 * Sort symbols with favorites first, then alphabetically
 */
export function sortSymbolsWithFavorites(symbols: TradingPair[], favoriteSymbols: string[]): TradingPair[] {
  return symbols.sort((a, b) => {
    const aIsFavorite = favoriteSymbols.includes(a.symbol);
    const bIsFavorite = favoriteSymbols.includes(b.symbol);
    
    // Favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Then alphabetical
    return a.symbol.localeCompare(b.symbol);
  });
}

/**
 * Get symbols for a tab with all filtering and sorting applied
 */
export function getProcessedSymbolsForTab(
  symbols: TradingPair[],
  tab: TabType,
  favoriteSymbols: string[],
  searchQuery: string = '',
  sortFavoritesFirst: boolean = false
): TradingPair[] {
  // First filter by tab
  let filteredSymbols = filterSymbolsForTab(symbols, tab, favoriteSymbols);
  
  // Then apply search
  if (searchQuery.trim()) {
    filteredSymbols = searchSymbols(filteredSymbols, searchQuery);
  }
  
  // Finally sort
  if (sortFavoritesFirst && tab !== 'favorites') {
    filteredSymbols = sortSymbolsWithFavorites(filteredSymbols, favoriteSymbols);
  } else {
    // Simple alphabetical sort
    filteredSymbols = filteredSymbols.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
  
  return filteredSymbols;
}