import { array } from "zod";
import { DetailedTradingPair, TradingPair } from "../schema/trading-service";
import { CurrencyPair } from "../utils/currency-trade";
import { symbol } from "d3";

export enum MessageType {
    ALL_PRICES = 'ALL_PRICES',
    PRICE_DATA = 'PRICE_DATAA'
}

export function parseWebSocketMessage<T>(
    wsData: string,
    messageType?: MessageType,
): T {
    switch (messageType) {
        case MessageType.ALL_PRICES:
            return parseAllPricesWsData(wsData) as T;
        case MessageType.PRICE_DATA:
            return parsePriceWsData(wsData) as T;
        default:
            try {
                const result = JSON.parse(wsData);
                return result as T;
            } catch (e: unknown) {
                console.log(`Failed to parse: ${messageType}`);
                throw e;
            }
    }
}

function parsePriceWsData(wsData: string): DetailedTradingPair {
    const dataArray = wsData.split('~')
    const bid = parseFloat(dataArray[4]);
    const ask = parseFloat(dataArray[5]);
    const marketPrice = Number(
        ((ask + bid) / 2).toFixed(
            Math.max(ask.toString().length, bid.toString().length),
        )
    )
    return {
        exchange: dataArray[0],
        server: dataArray[1],
        symbol: dataArray[2],
        time: parseInt(dataArray[3]),
        bid,
        ask,
        marketPrice
    }
}

function parseAllPricesWsData(wsData: string): TradingPair[] {
  const dataArray = wsData.split('~');
  return dataArray.slice(3).reduce<TradingPair[]>((acc, _, index, array) => {
    if (
      index % 3 === 0 &&
      array[index + 1] !== undefined &&
      array[index + 2] !== undefined
    ) {
      const bid = parseFloat(array[index + 1]);
      const ask = parseFloat(array[index + 2]);
      const marketPrice = Number(
        ((ask + bid) / 2).toFixed(
          Math.max(ask.toString().length, bid.toString().length),
        ),
      );

      acc.push({
        symbol: array[index] as CurrencyPair,
        bid,
        ask,
        marketPrice,
      });
    }
    return acc;
  }, []);
}