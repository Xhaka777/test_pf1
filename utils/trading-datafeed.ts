import {
 Bar,
  DatafeedConfiguration,
  DatafeedErrorCallback,
  HistoryCallback,
  IDatafeedChartApi,
  LibrarySymbolInfo,
  ResolutionString,
  SearchSymbolResultItem,
  SubscribeBarsCallback,
} from '../types/charting_library';
import { getWSSBaseUrl, useAuthenticatedApi } from '@/api/services/api';
import { ApiRoutes, WssRoutes } from '@/api/types';
import {
    DetailedTradingPair,
    GetPricesData,
    SymbolsData
} from '../api/schema';
import {
    MessageType,
    parseWebSocketMessage
} from '../api/services/web-socket-parser';

export type ExtendedLibrarySymbolInfo = LibrarySymbolInfo & {
    full_name: string;
    symbol: string;
}

export const supportedResolutions = [
  '1',
  '3',
  '5',
  '15',
  '30',
  '60',
  '240',
  '1D',
  '1W',
  '1M',
] as ResolutionString[];

export const symbolTypes = [
  {
    name: 'Crypto',
    value: 'Crypto',
  },
  {
    name: 'Forex',
    value: 'Forex',
  },
];

export class DatafeedChartApi implements IDatafeedChartApi {
  private lastBarsCache: Map<string, Bar> = new Map();
  private resetCache: Map<string, () => void> = new Map();
  private subscribers: Map<string, WebSocket> = new Map();
  private symbols: Map<string, ExtendedLibrarySymbolInfo> = new Map();
  private configurationData: DatafeedConfiguration = {
    supported_resolutions: supportedResolutions,
    exchanges: [],
    symbols_types: symbolTypes,
  };
  private lastBid: number | null = null;
  private lastAsk: number | null = null;
  private onBidAskUpdate: (
    bid: number | null,
    ask: number | null,
    symbolName: string,
    resolution: ResolutionString,
  ) => void;

  constructor(
    onBidAskUpdate: (
      bid: number | null,
      ask: number | null,
      symbolName: string,
      resolution: ResolutionString,
    ) => void,
  ) {
    this.onBidAskUpdate = onBidAskUpdate;
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this),
    );
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    console.log('[onReady]: Method call');
    setTimeout(() => callback(this.configurationData), 0);
  }

  private async getAllSymbols(): Promise<
    Map<string, ExtendedLibrarySymbolInfo>
  > {
    if (this.symbols.size) {
      return this.symbols;
    }

    const data = await fetchFromApi<SymbolsData>(ApiRoutes.GET_SYMBOLS);
    const temporaryMap = new Map<string, ExtendedLibrarySymbolInfo>();

    for (let i = 0; i < data.exchange.length; i++) {
      const [exchangeName, serverName] = data.exchange[i].split('_');
      for (const symbol of data.symbols[i]) {
        const fullName = `${exchangeName}:${serverName}:${symbol}`;
        const isCryptoSymbol = !!symbol
          .slice(0, 3)
          .match(/BTC|ETH|DOT|ADA|XRP|LTC|NEO|XMR|DOG|DAS/);
        const symbolType =
          ['MT5', 'DXTrade', 'CTrader'].includes(exchangeName) &&
          !isCryptoSymbol
            ? 'Forex'
            : 'Crypto';
        const pricescale = symbol.slice(0, 3).match(/BTC|ETH/) ? 100 : 100000;

        const symbolInfo: ExtendedLibrarySymbolInfo = {
          symbol,
          ticker: fullName,
          full_name: fullName,
          name: symbol,
          description: symbol,
          exchange: `${exchangeName}:${serverName}`,
          listed_exchange: exchangeName,
          type: symbolType,
          session:
            symbolType === 'Forex'
              ? '2200-0000:1|0000-0000:2345|0000-2100:6'
              : '24x7',
          timezone: 'Etc/UTC',
          minmov: 1,
          pricescale: pricescale,
          has_intraday: true,
          intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
          has_weekly_and_monthly: false,
          format: 'price',
          supported_resolutions: this.configurationData.supported_resolutions,
          volume_precision: 8,
          data_status: 'streaming',
          visible_plots_set: 'ohlcv',
        };

        temporaryMap.set(symbolInfo.full_name, symbolInfo);
      }
    }

    this.symbols = new Map(temporaryMap);
    return this.symbols;
  }

  async searchSymbols(
    ...args: [
      string,
      string,
      string,
      (symbols: SearchSymbolResultItem[]) => void,
    ]
  ): Promise<void> {
    console.log('[searchSymbols]: Method call');
    const userInput = args[0];
    const symbolType = args[2];
    const onResultReadyCallback = args[3];
    const symbols = await this.getAllSymbols();
    const newSymbols = [...symbols.values()].filter((symbol) => {
      const isExchangeValid = symbolType === symbol.type;
      const isFullSymbolContainsInput = symbol.full_name
        .toLowerCase()
        .includes(userInput.toLowerCase());
      return isExchangeValid && isFullSymbolContainsInput;
    });
    onResultReadyCallback(newSymbols);
  }

  async resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: ExtendedLibrarySymbolInfo) => void,
    onResolveErrorCallback: (reason: string) => void,
  ): Promise<void> {
    console.log('[resolveSymbol]: Method call', symbolName);
    const symbols = await this.getAllSymbols();
    const symbolItem = symbols.get(symbolName);
    if (!symbolItem) {
      console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
      onResolveErrorCallback('Cannot resolve symbol');
      return;
    }
    console.log('[resolveSymbol]: Symbol resolved', symbolName);
    onSymbolResolvedCallback(symbolItem);
  }

  async getBars(
    symbolInfo: ExtendedLibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: {
      from: number;
      to: number;
      firstDataRequest: boolean;
      countBack?: number;
    },
    onHistoryCallback: HistoryCallback,
    onErrorCallback: DatafeedErrorCallback,
  ): Promise<void> {
    const { from, to, firstDataRequest, countBack } = periodParams;
    console.log('[getBars]: Method call', symbolInfo, resolution, from, to);

    const urlParameters: { [key: string]: string } = {
      symbol: symbolInfo.name,
      exchange: symbolInfo.exchange.split(':')[0],
      server: symbolInfo.exchange.split(':')[1],
      tf: resolution,
      from: (from * 1000).toString(),
      to: (to * 1000).toString(),
      limit: '2000',
    };

    if (countBack !== undefined) {
      urlParameters.requestedBars = countBack.toString();
    }

    const query = Object.keys(urlParameters)
      .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
      .join('&');

    try {
      const data = await fetchFromApi<GetPricesData>(
        `${ApiRoutes.GET_PRICES}?${query}`,
      );
      if ((data.status && data.status === 'error') || data.Data.length === 0) {
        onHistoryCallback([], { noData: true });
        return;
      }
      const bars: Bar[] = data.Data.map((bar) => ({
        time: bar.time * 1000,
        low: bar.low,
        high: bar.high,
        open: bar.open,
        close: bar.close,
        volume: bar.volume,
      }));

      if (firstDataRequest) {
        this.lastBarsCache.set(symbolInfo.full_name + '_' + resolution, {
          ...bars[bars.length - 1],
        });
      }
      console.log(`[getBars]: returned ${bars.length} bar(s)`);
      onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (error) {
      console.log('[getBars]: Get error', error);
      onErrorCallback((error as Error).message);
    }
  }

  subscribeBars(
    symbolInfo: ExtendedLibrarySymbolInfo,
    resolution: ResolutionString,
    onRealtimeCallback: SubscribeBarsCallback,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void,
  ): void {
    console.log(
      '[subscribeBars]: Method call with subscriberUID:',
      subscriberUID,
    );

    // Store onResetCacheNeededCallback in case we need to call it
    this.resetCache.set(
      symbolInfo.full_name + '_' + resolution,
      onResetCacheNeededCallback,
    );

    const socket = new WebSocket(getWSSBaseUrl() + WssRoutes.GET_PRICES);

    socket.onopen = () => {
      console.log('WebSocket connection opened for', subscriberUID);
      // Send subscription message
      const [exchange, server, name] = symbolInfo.full_name.split(':');
      const subscribeMessage = `SubAdd:0~${exchange}~${server}~${name}`;
      socket.send(subscribeMessage);
    };

    socket.onmessage = (event: MessageEvent) => {
      const symbolData = parseWebSocketMessage<DetailedTradingPair>(
        event.data,
        MessageType.PRICE_DATA,
      );

      if (symbolData) {
        const lastBar = this.lastBarsCache.get(
          symbolInfo.full_name + '_' + resolution,
        );

        // Store bid/ask prices
        this.lastBid = symbolData.bid ?? this.lastBid;
        this.lastAsk = symbolData.ask ?? this.lastAsk;
        const tradeTime = symbolData.time ?? Date.now();

        // Update bid/ask as custom lines
        this.onBidAskUpdate(
          this.lastBid,
          this.lastAsk,
          symbolData.symbol,
          resolution,
        );

        let nextBarTime: number;

        if (resolution === '1D') {
          nextBarTime = this.getNextDailyBarTime(lastBar?.time ?? tradeTime);
        } else if (parseInt(resolution) >= 60) {
          // Hourly intervals
          nextBarTime = this.getNextHourlyBarTime(
            lastBar?.time ?? tradeTime,
            parseInt(resolution) / 60,
          );
        } else {
          // Minute intervals
          nextBarTime = this.getNextMinutesBarTime(
            lastBar?.time ?? tradeTime,
            parseInt(resolution),
          );
        }

        let bar: Bar;
        if (tradeTime >= nextBarTime) {
          // Start a new bar
          bar = {
            time: nextBarTime,
            open: symbolData.bid,
            high: symbolData.bid,
            low: symbolData.bid,
            close: symbolData.bid,
          };
          console.log('[subscribeBars]: Generate new bar', bar);
          // Optionally reset cache
          // const resetCallback = this.resetCache.get(
          //   symbolInfo.full_name + '_' + resolution
          // );
          // if (resetCallback) {
          //   resetCallback();
          //   this.resetCache.delete(symbolInfo.full_name + '_' + resolution);
          // }
        } else {
          // Update the last bar
          if (!lastBar) {
            // If there's no last bar, create one
            bar = {
              time: nextBarTime,
              open: symbolData.bid,
              high: symbolData.bid,
              low: symbolData.bid,
              close: symbolData.bid,
            };
          } else {
            bar = {
              ...lastBar,
              high: Math.max(lastBar.high, symbolData.bid),
              low: Math.min(lastBar.low, symbolData.bid),
              close: symbolData.bid,
            };
          }
        }

        onRealtimeCallback(bar);
        this.lastBarsCache.set(symbolInfo.full_name + '_' + resolution, bar);
      }
    };

    socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket closed for', subscriberUID);
    };

    this.subscribers.set(subscriberUID, socket);
  }

  unsubscribeBars(subscriberUID: string): void {
    console.log(
      '[unsubscribeBars]: Method call with subscriberUID:',
      subscriberUID,
    );
    const socket = this.subscribers.get(subscriberUID);
    if (socket) {
      // Send unsubscribe message if necessary
      socket.close();
      this.subscribers.delete(subscriberUID);
    }
  }

  private handleVisibilityChange(): void {
    if (!document.hidden) {
      // Handle reset cache or reconnection if needed
      if (this.resetCache.size > 0) {
        for (const resetCallback of this.resetCache.values()) {
          resetCallback();
        }
        this.resetCache.clear();
      }
    }
  }

  // Helper functions to calculate next bar times

  private getNextDailyBarTime(barTime: number): number {
    const date = new Date(barTime);
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime();
  }

  private getNextHourlyBarTime(barTime: number, intervalHours: number): number {
    const date = new Date(barTime);
    const hoursToAdd = this.hoursToAdd(date.getUTCHours(), intervalHours);
    date.setUTCHours(date.getUTCHours() + hoursToAdd);
    date.setUTCMinutes(0, 0, 0);
    return date.getTime();
  }

  private getNextMinutesBarTime(
    barTime: number,
    intervalMinutes: number,
  ): number {
    const date = new Date(barTime);
    const minutesToAdd = this.minutesToAdd(
      date.getUTCMinutes(),
      intervalMinutes,
    );
    date.setUTCMinutes(date.getUTCMinutes() + minutesToAdd);
    date.setUTCSeconds(0, 0);
    return date.getTime();
  }

  private minutesToAdd(currentMinute: number, interval: number): number {
    const remainder = currentMinute % interval;
    return remainder === 0 ? interval : interval - remainder;
  }

  private hoursToAdd(currentHour: number, interval: number): number {
    const remainder = currentHour % interval;
    return remainder === 0 ? interval : interval - remainder;
  }
}