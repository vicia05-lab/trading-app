# Trading App — Admin Alpaca secret dialog

## User workflow
Open **Admin → Alpaca market-data secrets → Add Alpaca keys**. Enter the API key ID and secret in the masked dialog and select **Save secret**. Only the last four characters of the saved key ID are shown afterward. The stored secret cannot be revealed from this interface. **Test connection** makes a read-only IEX market-data request. Replace requires both keys. Remove deletes the application’s saved pair; it does not revoke keys at Alpaca.

## Scope and safety
This change replaces the legacy inline credentials form on **Admin only**. It does not change the pre-existing `/keys` and `/trade` pages, their credentials or routing. Those legacy paths are NOT security-certified by this change. The new per-user `alpaca_data_secret` store is deliberately not read by the legacy order adapter. No new order submission, trading-mode switch, account access, or automatic real-data pipeline activation is implemented.

Both API key ID and API secret are encrypted together using AES-256-GCM. Each save generates a new random nonce and version; authenticated associated data binds the ciphertext to the signed-in owner and that version. No credentials, request bodies, or raw provider errors are written to the new audit table. The API returns only safe status, version, and key-ID suffix. JavaScript strings cannot be securely erased from process memory; the interface clears references/state but does not claim forensic memory erasure.

The backend takes the owner from verified authentication. Mutations require an existing OPERATOR role; these endpoints never promote roles. Existing same-site authentication middleware is retained. All SQL is parameterized and owner-scoped. Save/remove plus safe audit events are single SQL transactions. Version comparisons prevent stale windows from overwriting another save. A slow connection test cannot certify replacement credentials. Connection tests are rate-limited to one start per credential version per ten seconds.

## Required server-secret contract
Before enabling real-key storage, provide `ALPACA_CREDENTIALS_MASTER_KEY` as a **server-only secret**, containing the canonical base64 encoding of 32 cryptographically random bytes. Keep this master key outside the application database and repository. Never prefix it with `VITE_`, never put it in a browser bundle, and never paste it into chat. Preserve it across application restarts. Replacing it without re-encrypting records makes previously stored pairs unreadable. Rotation/migration of existing encrypted records is not implemented by this patch.

Apply `migrations/0005_alpaca_data_secrets.sql` with the normal migration mechanism. Real saves require the repository’s durable PostgreSQL mode (`dbSource === "neon"`); the in-memory PGlite preview is intentionally refused for real secrets. Missing durable storage or missing master key produces a visible disabled-state explanation, not a pretend successful save. No master key or real Alpaca key is bundled or provisioned by this change.

The connection-check destination and method are fixed in server code:
`GET https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=SPY&feed=iex`
Credentials are transmitted in the provider’s required authentication headers. Redirects are rejected, the request times out after eight seconds, and provider response bodies are discarded. A successful result establishes only access to this endpoint, not official-auction coverage, options entitlement, source quality or full research readiness.

Official API contract: https://docs.alpaca.markets/us/reference/stocklatestquotes-1

## Tests
`npm run test:alpaca-secrets` executes the isolated core/storage tests with synthetic credentials and embedded PGlite. All external HTTP responses in those tests are mocked. Tests cover encryption/tamper detection, per-user isolation, stale writes, redacted responses, save/audit atomic rollback, nonpersistent-storage rejection, connection-result mapping, throttling and replacement races.

A separate visual interaction check uses an injected fake transport, not an authenticated real account. This is not a live-provider, hosted-PostgreSQL, or deployed-site verification. See the accompanying implementation report for actual executed results.

## Remaining integration boundary
The new store provides safe save/status/test/remove behavior. Wiring its credentials into broader ingestion workers requires explicit per-user ownership and authorization design. It must not be connected to order-routing functions or automatically promoted into research readiness. Persistent storage, the master secret, and publication of the updated application remain necessary before the public site can use this UI.
