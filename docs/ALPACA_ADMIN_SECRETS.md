# Trading App — Admin Alpaca secret dialog

Open Admin → Alpaca market-data secrets → Add Alpaca keys. The popup masks both fields. Save secret stores the pair; later only the key-ID suffix is displayed. Replace requires both keys. Test connection makes a read-only IEX request. Remove deletes this application's copy, not the key at Alpaca.

## Scope
The new owner-scoped store is separate from the legacy order-routing keys. Only the Admin form is replaced. Existing /keys and /trade routes are unchanged and are not security-certified by this patch. Saving here never enables order routing, changes trading modes, starts real-data ingestion, or changes the research kernel.

Both values are encrypted together with AES-256-GCM and a fresh nonce. Authenticated associated data binds owner and credential version. The backend derives owner and Operator capability from authentication, never request fields. Safe status and audit records contain no raw credentials, ciphertext or provider bodies. Save/remove plus audit commit atomically. Version checks prevent stale overwrites and old connection tests certifying replacement keys. Each saved version permits one test start per ten seconds.

## Required server configuration
Provide ALPACA_CREDENTIALS_MASTER_KEY as a server-only secret: canonical base64 encoding of 32 cryptographically random bytes. Keep it outside the database, repository and browser; never prefix it with VITE_. Preserve it across restarts. Changing it without re-encrypting existing records makes those records unreadable. Automated master-key rotation is outside this patch.

Apply migrations/0005_alpaca_data_secrets.sql through the normal migration mechanism. Real-key saves require durable PostgreSQL mode (dbSource === neon); the in-memory PGlite preview is intentionally refused. Missing master key or durable storage disables Add/Replace and displays the reason. No real credentials or master secret have been provisioned by this change. JavaScript state is cleared after save/cancel; forensic memory erasure is not promised.

## Provider boundary
Only GET https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=SPY&feed=iex is allowed by the new connection test. It uses APCA-API-KEY-ID and APCA-API-SECRET-KEY headers, rejects redirects, times out after eight seconds and discards response bodies. Success verifies access to that endpoint, not official-auction coverage, options entitlement or full strategy readiness.
Official endpoint contract: https://docs.alpaca.markets/us/reference/stocklatestquotes-1

## Verification
npm run test:alpaca-secrets runs 18 core/storage tests with generated encryption keys, fake provider credentials, mocked HTTP and isolated embedded PGlite. The suite covers tamper detection, account isolation, stale writes, redaction, atomic audit rollback, rate limiting and replacement races. The isolated browser component check passes 12 assertions at desktop and 375-pixel mobile widths, including masking, clear-on-cancel/save, connection status, confirmation before removal, reviewer restriction and storage-error retry.

These checks do not establish hosted PostgreSQL permissions, live Alpaca connectivity, published-site behavior or end-to-end authenticated integration. No live provider request was made. A public-site update still requires publishing the reviewed application changes and provisioning the server-secret contract.
