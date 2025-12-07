export enum QueryKeys {
  GET_CURRENT_PRICES = 'get-current-prices',
  GET_ALL_PRICES = 'get-all-prices',
  GET_CURRENT_USER = 'get-current-user',

  GET_ACCOUNT_DETAILS = 'get-account-details',
  GET_LEADERBOARD_METRICS = 'get-leaderboard-metrics',

  GET_USERS = 'get-users',

  GET_ACCOUNTS = 'get-accounts',
  GET_METRICS = 'get-metrics',
  GET_CALENDAR_OVERVIEW = 'get-calendar-overview',
  GET_SYMBOL_INFO = 'get-symbol-info',

  // Overview page
  FETCH_PROP_FIRM_ACCOUNTS_OVERVIEW = 'FETCH_PROP_FIRM_ACCOUNTS_OVERVIEW',
  FETCH_BROKER_ACCOUNTS_OVERVIEW = 'FETCH_BROKER_ACCOUNTS_OVERVIEW',
  FETCH_ACCOUNTS_OVERVIEW_DETAILS = 'FETCH_ACCOUNTS_OVERVIEW_DETAILS',
  PROP_FIRM_ACCOUNTS = 'PROP_FIRM_ACCOUNTS',
  BROKER_ACCOUNTS = 'BROKER_ACCOUNTS',
  COPIER_ACCOUNTS = 'COPIER_ACCOUNTS',
  GET_COPIER_LOGS = 'get-copier-logs',

  // Trade Service
  GET_OPEN_TRADES = 'get-open-trades',
  SYNC_TRADES = 'sync-trades',
  SYNC_ALL_TRADES = 'sync-all-trades',
  CLOSE_ALL_TRADES = 'close-all-trades',
  CLOSE_TRADE = 'close-trade',
  UPDATE_TP = 'update-take-profit',
  UPDATE_SL = 'update-stop-loss',
  UPDATE_PARTIAL_TP = 'update-partial-tp',
  UPDATE_TRAILING_SL = 'update-trailing-sl',
  CANCEL_ORDER = 'cancel-order',
  DELETE_BT_TRADE = 'delete-bt-trade',
  DELETE_BT_TRADES = 'delete-bt-trades',
  OPEN_TRADE = 'open-trade',
  UPDATE_ORDER = 'update-order',

  // Journal Service
  GET_JOURNAL_TAGS = 'get-journal-tags',
  GET_JOURNAL_ENTRY = 'get-journal-entry',

  // trading notes
  GET_NOTES = 'get-notes',

  // Trade History Service
  GET_TRADE_HISTORY = 'get-trade-history',
  GET_BT_TRADE_HISTORY = 'get-bt-trade-history',

  // MFA
  MFA = 'mfa',

  // Calculator
  CALCULATE_POSITION_SIZE = 'calculate-position-size',
  CALCULATE_STOP_LOSS = 'calculate-stop-loss',
  CALCULATE_LIQUIDATION_PRICE = 'calculate-liquidation-price',
  CALCULATE_PROFIT_LOSS = 'calculate-profit-loss',

  // Analytics
  GET_EQUITY_BANKROLL = 'get-equity-bankroll',
  GET_ANALYTICS_ACCOUNT_DETAILS = 'get-analytics-account-details',
  GET_ANALYTICS_STATS = 'get-analytics-stats',
  GET_ANALYTICS_OVERVIEW = 'get-analytics-overview',
  GET_ANALYTICS_ALL_ACCOUNTS = 'get-analytics-all-accounts',
  GET_ANALYTICS_CHALLENGE_ACCOUNTS = 'get-analytics-challenge-accounts',
  GET_ANALYTICS_FUNDED_ACCOUNTS = 'get-analytics-funded-accounts',

  // Admin
  FETCH_ADMIN_LEADERBOARD_METRICS = 'fetch_admin_leaderboard_metrics',
  FETCH_PLATFORM_METRICS = 'fetch_platform_metrics',
  ADMIN_PLATFORM = 'admin_platform',
  ADMIN_PLATFORMS = 'admin_platforms',
  ADMIN_BROKERS = 'admin_brokers',
  ADMIN_BROKER = 'admin_broker',
  ADMIN_BROKER_PLATFORMS = 'admin_broker_platforms',
  ADMIN_BROKER_PLATFORM = 'admin_broker_platform',
  ADMIN_BROKER_MAPPINGS = 'admin_broker_mappings',
  ADMIN_BROKER_MAPPING = 'admin_broker_mapping',
  ADMIN_SYMBOL_MAPPINGS = 'admin_symbol_mappings',
  ADMIN_SYMBOL_MAPPING = 'admin_symbol_mapping',
  ADMIN_BROKER_SYMBOL_MAPPINGS = 'admin_broker_symbol_mappings',
  ADMIN_BROKER_SYMBOL_MAPPING = 'admin_broker_symbol_mapping',
  ADMIN_FIX_CONFIGURATIONS = 'admin_fix_configurations',
  ADMIN_FIX_CONFIGURATION = 'admin_fix_configuration',
  ADMIN_FIX_HOSTS = 'admin_fix_hosts',
  ADMIN_FIX_HOST = 'admin_fix_host',
  ADMIN_FIX_SENDER_COMP_IDS = 'admin_fix_sender_comp_ids',
  ADMIN_FIX_SENDER_COMP_ID = 'admin_fix_sender_comp_id',
  ADMIN_MT5_FILLING_TYPES = 'admin_mt5_filling_types',
  ADMIN_MT5_FILLING_TYPE = 'admin_mt5_filling_type',
  ADMIN_MT5_VOLUME_STEPS = 'admin_mt5_volume_steps',
  ADMIN_MT5_VOLUME_STEP = 'admin_mt5_volume_step',
  ADMIN_MARKETS = 'admin_markets',
  ADMIN_MARKET = 'admin_market',

  // User
  USER_PLATFORMS = 'user-platforms',
  USER_PLATFORM = 'user-platform',
  USER_FAVORITES = 'user-favorites',

  // Competition
  GET_COMPETITIONS = 'get-competitions',
  GET_COMPETITION = 'get-competition',
  GET_COMPETITION_ACCOUNTS = 'get-competition-accounts',
  GET_COMPETITION_ACCOUNTS_LEADERBOARD = 'get-competition-accounts-leaderboard',
  CREATE_COMPETITION = 'create-competition',
  UPDATE_COMPETITION = 'update-competition',
  ADD_COMPETITION_ACCOUNT = 'add-competition-account',
  START_COMPETITION = 'start-competition',
  END_COMPETITION = 'end-competition',
  DELETE_COMPETITION = 'delete-competition',
}

export enum ApiRoutes {
  GET_USERS = '/users',
  GET_CURRENT_USER = '/user_authenticated',
  GET_CURRENT_PRICES = '/current_prices',
  GET_ALL_PRICES = '/all_prices',
  GET_PRICES = '/get_prices',
  GET_ACCOUNT_DETAILS = '/get_account_details',
  GET_ACCOUNTS = '/accounts',
  GET_METRICS = '/fetch_metrics',
  GET_SYMBOL_INFO = '/get_symbol_info',
  GET_CALENDAR_OVERVIEW = '/fetch_calendar_overview',
  GET_LEADERBOARD_METRICS = '/fetch_leaderboard_metrics',
  UPDATE_ACCOUNT_DETAILS = '/update_account_details',
  UPDATE_SYMBOLS = '/update_symbols',
  UPDATE_MAX_LOT_SIZE = '/update_max_lot_size',
  UPDATE_COMMISSION = '/update_commission',
  UPDATE_SYMBOL_MAPPINGS = '/update_symbol_mappings',
  UPDATE_ACCOUNT_PARAMS = '/update_account_params',
  CREATE_PORTAL_SESSION = '/create-portal-session',

  // Overview
  FETCH_PROP_FIRM_ACCOUNTS_OVERVIEW = '/fetch_prop_firm_accounts_overview',
  FETCH_BROKER_ACCOUNTS_OVERVIEW = '/fetch_broker_accounts_overview',
  FETCH_ACCOUNTS_OVERVIEW_DETAILS = '/fetch_accounts_overview_details',
  FETCH_ACCOUNT_TRADES = '/fetch_account_trades',
  PROP_FIRM_ACCOUNTS = '/prop_firm_accounts',
  BROKER_ACCOUNTS = '/broker_accounts',
  COPIER_ACCOUNTS = '/copier_accounts',
  COPIER_LOGS = '/copier_logs',

  // Account
  ADD_ACCOUNT = '/add_account',
  ACTIVATE_ACCOUNT = '/activate_account',
  ARCHIVE_ACCOUNT = '/archive_account',
  ADD_CTRADER_ACCOUNT = '/add_ctrader_account',
  CONNECT_TO_BROKER = '/connect_to_broker',
  ADD_COPY_ACCOUNT = '/add_copy_account',
  UPDATE_COPY_ACCOUNT = '/update_copy_account',
  DELETE_COPY_ACCOUNT = '/delete_copy_account',
  ENABLE_COPY_ACCOUNT = '/enable_copy_account',
  DISABLE_COPY_ACCOUNT = '/disable_copy_account',

  // Trade Service
  GET_OPEN_TRADES = '/get_open_trades',
  SYNC_TRADES = '/sync_trades',
  SYNC_ALL_TRADES = '/sync_all_trades',
  CLOSE_ALL_TRADE = '/close_all_trades',
  CLOSE_TRADE = '/close_trade',
  UPDATE_TP = '/update_tp',
  UPDATE_SL = '/update_sl',
  UPDATE_PARTIAL_TP = '/update_partial_tp',
  UPDATE_TRAILING_SL = '/update_trailing_sl',
  CANCEL_ORDER = '/cancel_order',
  UPDATE_ORDER = '/update_order',
  DELETE_BT_TRADE = '/delete_bt_trade',
  DELETE_BT_TRADES = '/delete_bt_trades',
  FETCH_PL_SS = '/fetch_pl_screenshot',
  OPEN_TRADE = '/open_trade',
  GET_SYMBOLS = '/get_symbols',

  // Journal Service
  GET_JOURNAL_TAGS = '/get_journal_tags',
  ADD_JOURNAL_TAG = '/add_journal_tag',
  DELETE_JOURNAL_TAG = '/delete_journal_tag',
  ASSIGN_JOURNAL_TAG = '/assign_journal_tag',
  GET_JOURNAL_ENTRY = '/get_journal_entry',
  UPDATE_JOURNAL_ENTRY = '/update_journal_entry',
  REMOVE_JOURNAL_SS = '/remove_journal_screenshot',
  UPLOAD_JOURNAL_SS = '/upload_journal_screenshot',
  FETCH_JOURNAL_SS = '/fetch_journal_screenshot',

  // Trading notes
  GET_NOTES = '/get_notes',
  ADD_NOTES = '/add_notes',
  UPDATE_NOTES = '/update_notes',
  DELETE_NOTES = '/delete_notes',

  // Trade History Service
  GET_TRADE_HISTORY = '/get_trade_history',
  GET_BT_TRADE_HISTORY = '/get_bt_trade_history',

  // MFA
  MFA = '/mfa',

  // Subscription
  CREATE_CHECKOUT_SESSION = '/create-checkout-session',
  CHECK_TRIAL_CODE = '/check_trial_code',

  // Calculator
  CALCULATE_POSITION_SIZE = '/get_position_size',
  CALCULATE_STOP_LOSS = '/get_stop_loss',
  CALCULATE_LIQUIDATION_PRICE = '/get_liquidation_price',
  CALCULATE_PROFIT_LOSS = '/get_pl',

  // Analytics
  GET_EQUITY_BANKROLL = '/get_equity_bankroll',
  GET_ANALYTICS_ACCOUNT_DETAILS = '/get_analytics_account_details',
  GET_ANALYTICS_STATS = '/get_analytics_stats',
  GET_ANALYTICS_OVERVIEW = '/get_analytics_overview',
  GET_ANALYTICS_ALL_ACCOUNTS = '/get_analytics_all_accounts',
  GET_ANALYTICS_CHALLENGE_ACCOUNTS = '/get_analytics_challenge_accounts',
  GET_ANALYTICS_FUNDED_ACCOUNTS = '/get_analytics_funded_accounts',

  // Admin
  FETCH_ADMIN_LEADERBOARD_METRICS = '/fetch_admin_leaderboard_metrics',
  FETCH_PLATFORM_METRICS = '/fetch_platform_metrics',
  ADMIN_PLATFORMS = '/admin/platforms',
  ADMIN_PLATFORM = '/admin/platform',
  ADMIN_BROKERS = '/admin/brokers',
  ADMIN_BROKER = '/admin/broker',
  ADMIN_BROKER_PLATFORMS = '/admin/broker_platforms',
  ADMIN_BROKER_PLATFORM = '/admin/broker_platform',
  ADMIN_BROKER_MAPPINGS = '/admin/broker_mappings',
  ADMIN_BROKER_MAPPING = '/admin/broker_mapping',
  ADMIN_SYMBOL_MAPPINGS = '/admin/symbol_mappings',
  ADMIN_SYMBOL_MAPPING = '/admin/symbol_mapping',
  ADMIN_BROKER_SYMBOL_MAPPINGS = '/admin/broker_symbol_mappings',
  ADMIN_BROKER_SYMBOL_MAPPING = '/admin/broker_symbol_mapping',
  ADMIN_FIX_CONFIGURATIONS = '/admin/fix_configurations',
  ADMIN_FIX_CONFIGURATION = '/admin/fix_configuration',
  ADMIN_FIX_HOSTS = '/admin/fix_hosts',
  ADMIN_FIX_HOST = '/admin/fix_host',
  ADMIN_FIX_SENDER_COMP_IDS = '/admin/fix_sender_comp_ids',
  ADMIN_FIX_SENDER_COMP_ID = '/admin/fix_sender_comp_id',
  ADMIN_MT5_FILLING_TYPES = '/admin/mt5_filling_types',
  ADMIN_MT5_FILLING_TYPE = '/admin/mt5_filling_type',
  ADMIN_MT5_VOLUME_STEPS = '/admin/mt5_volume_steps',
  ADMIN_MT5_VOLUME_STEP = '/admin/mt5_volume_step',
  ADMIN_MARKETS = '/admin/markets',
  ADMIN_MARKET = '/admin/market',

  // User
  USER_PLATFORMS = '/user/platforms',
  USER_PLATFORM = '/user/platform',
  USER_FAVORITES = '/user/favorites',

  // Competition
  GET_COMPETITIONS = '/get_competitions',
  GET_COMPETITION = '/get_competition',
  GET_COMPETITION_ACCOUNTS = '/get_competition_accounts',
  GET_COMPETITION_ACCOUNTS_LEADERBOARD = '/get_competition_accounts_leaderboard',
  CREATE_COMPETITION = '/create_competition',
  UPDATE_COMPETITION = '/update_competition',
  START_COMPETITION = '/start_competition',
  END_COMPETITION = '/end_competition',
  DELETE_COMPETITION = '/delete_competition',
  ADD_COMPETITION_ACCOUNT = '/add_competition_account',
}

export enum WssRoutes {
  GET_ALL_PRICES = '/all_prices',
  GET_PRICES = '/prices',
  GET_OPEN_TRADES = '/get_open_trades',
}

export interface TrialCodeResponse {
  status: 'success' | 'error';
  message: string;
}
