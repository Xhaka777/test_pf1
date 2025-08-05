import { OpenTradeDataSchemaType, OpenOrderDataSchemaType } from "@/api/schema";

function safeParseFloat(value: string | number | null | undefined, fallback: number = 0): number {
    if (value === null || value === undefined) {
        return fallback;
    }
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely converts a value to an integer, handling undefined/null cases
 */
function safeParseInt(value: string | number | null | undefined, fallback: number = 0): number {
    if (value === null || value === undefined) {
      return fallback;
    }
    const parsed = parseInt(value.toString(), 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  
  export function parseTradeData(trade: OpenTradeDataSchemaType): OpenTradeDataSchemaType {
    return {
      ...trade,
      quantity: safeParseFloat(trade.quantity),
      tp: safeParseFloat(trade.tp),
      sl: safeParseFloat(trade.sl),
      entry: safeParseFloat(trade.entry),
      pl: safeParseFloat(trade.pl),
      fees: safeParseFloat(trade.fees),
      balance: safeParseFloat(trade.balance),
      roi: safeParseFloat(trade.roi),
      trade_loss: safeParseFloat(trade.trade_loss),
      trade_profit: safeParseFloat(trade.trade_profit),
      contract_size: safeParseFloat(trade.contract_size),
      initial_margin: safeParseFloat(trade.initial_margin),
      liquidation: safeParseFloat(trade.liquidation),
      partial_tp_level: safeParseFloat(trade.partial_tp_level),
      // Parse optional fields with proper handling
      risk_percent: trade.risk_percent !== undefined ? safeParseFloat(trade.risk_percent) : trade.risk_percent,
      risk_value: trade.risk_value !== undefined ? safeParseFloat(trade.risk_value) : trade.risk_value,
    };
  }
  
  export function parseOrderData(order: OpenOrderDataSchemaType): OpenOrderDataSchemaType {
    return {
      ...order,
      quantity: safeParseFloat(order.quantity),
      tp: safeParseFloat(order.tp),
      sl: safeParseFloat(order.sl),
      price: safeParseFloat(order.price),
      id: safeParseInt(order.id),
    };
  }
  
  export function parseTradesArray(trades: OpenTradeDataSchemaType[]): OpenTradeDataSchemaType[] {
    if (!trades || !Array.isArray(trades)) {
      return [];
    }
    return trades.map(parseTradeData);
  }
  
  export function parseOrdersArray(orders: OpenOrderDataSchemaType[]): OpenOrderDataSchemaType[] {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    return orders.map(parseOrderData);
  } 