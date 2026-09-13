export type AlpacaMode = "PAPER" | "LIVE";

export type AlpacaPublicStatus = {
  connected: boolean;
  mode: AlpacaMode | null;
  api_key_masked: string | null;
  account_number_last4: string | null;
  account_status: string | null;
  last_ok_at: string | null;
  last_error: string | null;
  watchlist: string[];
  trading_host: string | null;
};

export type TapeBar = { t: string; o: number; h: number; l: number; c: number; v: number };

export type TapeNews = {
  id: string;
  headline: string;
  source: string | null;
  created_at: string;
  url: string | null;
  summary: string | null;
};

export type TickerDetail = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  tradable: boolean;
  last: string | null;
  bid: string | null;
  ask: string | null;
  bid_size: string | null;
  ask_size: string | null;
  change: string | null;
  change_pct: string | null;
  open: string | null;
  high: string | null;
  low: string | null;
  prev_close: string | null;
  volume: string | null;
  vwap: string | null;
  week52_high: string | null;
  week52_low: string | null;
  trade_at: string | null;
  quote_at: string | null;
  bars_intraday: TapeBar[];
  bars_daily: TapeBar[];
  news: TapeNews[];
};
