export enum AccountTypeEnum {
  DEMO = 'demo',
  LIVE = 'broker',
  FUNDED = 'funded',
  EVALUATION = 'evaluation',
  COMPETITION = 'competition',
}

export enum AccountStatusEnum {
  ACTIVE = 'active',
  PASSED = 'passed',
  FAILED = 'failed',
  DISCONNECTED = 'disconnected',
  SUBSCRIPTION_ENDED = 'subscription ended',
}

export enum OrderTypeEnum {
  MARKET = 'Market',
  LIMIT = 'Limit',
  STOP = 'Stop',
}

export enum PositionTypeEnum {
  LONG = 'long',
  SHORT = 'short',
}

export enum TakeProfitSlTypeEnum {
  PRICE = 'price',
  PIPS = 'pips',
}

export enum ExchangeTypeEnum {
  MT5 = 'MT5',
  DXTrade = 'DXTrade',
  CTrader = 'CTrader',
}

export enum InstrumentTypeEnum {
  FOREX = 'Forex',
  CRYPTO = 'Crypto',
  INDICES = 'Indices',
  STOCKS = 'Stocks',
  ENERGIES = 'Energies',
  METALS = 'Metals',
}

export enum BugReportTypeEnum {
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  BUG = 'bug',
  TRADING = 'trading',
}