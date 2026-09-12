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
