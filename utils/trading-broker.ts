import { AccountDetails, OpenTradesData } from '@/api/schema';
import { OrderTypeEnum } from '@/shared/enums';

export class CustomBroker {
  private host: any;
  private accountDetails: AccountDetails;
  private openTrades: OpenTradesData | null;

  constructor(host: any, accountDetails: AccountDetails) {
    this.host = host;
    this.accountDetails = accountDetails;
    this.openTrades = null;
  }

  // Update positions when openTrades data changes
  updatePositions(openTrades: OpenTradesData | null) {
    this.openTrades = openTrades;
  }

  // TradingView will call this to get current positions
  positions() {
    return new Promise((resolve) => {
      if (!this.openTrades || !this.openTrades.open_trades) {
        resolve([]);
        return;
      }

      // Convert your open trades to TradingView position format
      const positions = this.openTrades.open_trades
        .filter(trade => trade.symbol === this.getCurrentSymbol())
        .map(trade => ({
          id: trade.order_id,
          symbol: trade.symbol,
          qty: trade.position_type === 'long' ? trade.quantity : -trade.quantity, // Positive for long, negative for short
          side: trade.position_type === 'long' ? 1 : -1, // 1 = buy/long, -1 = sell/short
          avgPrice: trade.entry,
          profit: trade.pl,
          last: trade.entry, // You can update this with current price
          price: trade.entry,
          type: 2, // Position type
        }));

      resolve(positions);
    });
  }

  // TradingView will call this to get orders (we'll return empty for now)
  orders() {
    return new Promise((resolve) => {
      if (!this.openTrades || !this.openTrades.open_orders) {
        resolve([]);
        return;
      }

      // Convert your open orders to TradingView order format
      const orders = this.openTrades.open_orders
        .filter(order => order.symbol === this.getCurrentSymbol())
        .map(order => ({
          id: order.order_id,
          symbol: order.symbol,
          qty: order.position_type === 'long' ? order.quantity : -order.quantity,
          side: order.position_type === 'long' ? 1 : -1,
          price: order.price,
          status: 2, // Pending status
          type: order.order_type === OrderTypeEnum.LIMIT ? 1 : (order.order_type === OrderTypeEnum.STOP ? 3 : 2),
          limitPrice: order.order_type === OrderTypeEnum.LIMIT ? order.price : undefined,
          stopPrice: order.order_type === OrderTypeEnum.STOP ? order.price : undefined,
        }));

      resolve(orders);
    });
  }

  // Get current symbol from chart
  private getCurrentSymbol(): string {
    // You'll need to pass the current symbol from your component
    return this.host?.symbolExt?.()?.symbol || '';
  }

  // Required broker methods (minimal implementation)
  chartContextMenuActions() {
    return Promise.resolve([]);
  }

  isTradable() {
    return Promise.resolve(true);
  }

  accountManagerInfo() {
    return Promise.resolve({
      accountTitle: this.accountDetails.name,
    });
  }
}