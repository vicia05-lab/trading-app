import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as fetchAlpacaDesk, h as postAlpacaClose, i as Panel, l as fetchAlpacaOrders, m as postAlpacaCancel, n as Empty, o as Stat, r as Err, t as DeskShell, v as postAlpacaOrder, y as postAlpacaWatchlist } from "./desk-shell-Ct64eJ9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trade-_yLZVBlF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Trade() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeLoader, {}) });
}
function TradeLoader() {
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	async function reload() {
		const d = await fetchAlpacaDesk();
		setData(d);
	}
	(0, import_react.useEffect)(() => {
		reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load Alpaca desk"));
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: error });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Connecting to Alpaca…" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeBody, {
		data,
		reload
	});
}
function TradeBody({ data, reload }) {
	const [note, setNote] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [history, setHistory] = (0, import_react.useState)(null);
	const [watchText, setWatchText] = (0, import_react.useState)(data.status.watchlist.join(", "));
	const symbolDefault = data.status.watchlist[0] ?? "SPY";
	const [symbol, setSymbol] = (0, import_react.useState)(symbolDefault);
	const [side, setSide] = (0, import_react.useState)("buy");
	const [type, setType] = (0, import_react.useState)("market");
	const [tif, setTif] = (0, import_react.useState)("day");
	const [sizeMode, setSizeMode] = (0, import_react.useState)("notional");
	const [qty, setQty] = (0, import_react.useState)("1");
	const [notional, setNotional] = (0, import_react.useState)("1000.00");
	const [limitPrice, setLimitPrice] = (0, import_react.useState)("");
	const [extended, setExtended] = (0, import_react.useState)(false);
	const [confirmLive, setConfirmLive] = (0, import_react.useState)(false);
	async function run(label, fn) {
		setBusy(true);
		setErr(null);
		setNote(null);
		try {
			await fn();
			setNote(label);
			await reload();
		} catch (e) {
			setErr(e instanceof Error ? e.message : "Action failed");
		} finally {
			setBusy(false);
		}
	}
	if (!data.status.connected) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-xl font-medium tracking-tight",
			children: "Trade"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Alpaca is the market-data and order venue. Keys go on Admin."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: "Not connected",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No Alpaca keys stored. Operator pastes key id and secret on Admin, then returns here." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin",
				className: "mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-primary-fg",
				children: "Open Admin"
			})]
		})]
	});
	const live = data.status.mode === "LIVE";
	const quotes = "quotes" in data && data.quotes ? data.quotes : [];
	const positions = "positions" in data && data.positions ? data.positions : [];
	const orders = "orders" in data && data.orders ? data.orders : [];
	const account = "account" in data && data.account ? data.account : null;
	const clock = "clock" in data && data.clock ? data.clock : null;
	const loadErr = "error" in data ? data.error : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight",
				children: "Trade"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					live ? "Live Alpaca — orders spend real capital." : "Alpaca paper account — simulated fills, real market data.",
					" ",
					"Key ",
					data.status.api_key_masked
				]
			})] }),
			live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-lg border border-danger/40 bg-sunken px-3 py-2 text-sm text-danger",
				role: "status",
				children: "LIVE mode. A market order is not undoable. Confirm the checkbox on the ticket before sending."
			}) : null,
			loadErr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: loadErr }) : null,
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: err }) : null,
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: note
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Clock",
						aside: clock?.is_open === true || clock?.is_open === "true" ? "OPEN" : "closed",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Next open",
							value: fmtTs(clock?.next_open)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Equity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Portfolio",
							value: money(account?.portfolio_value),
							hint: money(account?.equity)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Cash",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Buying power",
							value: money(account?.buying_power),
							hint: money(account?.cash)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Account",
						aside: String(account?.status ?? "—"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Number",
							value: account?.account_number ? maskAcct(String(account.account_number)) : "—",
							hint: live ? "LIVE" : "PAPER"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Quotes",
				aside: "IEX / Alpaca data",
				children: [quotes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No snapshots. Save keys, then refresh." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[36rem] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Symbol"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Last"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Bid"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Ask"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Day %"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "font-mono text-xs",
							children: quotes.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "cursor-pointer border-t border-border hover:bg-sunken",
								onClick: () => setSymbol(q.symbol),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 font-medium text-fg",
										children: q.symbol
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: q.last ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: q.bid ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: q.ask ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 " + ((Number(q.change_pct) || 0) < 0 ? "text-danger" : ""),
										children: q.change_pct == null ? "—" : `${q.change_pct}%`
									})
								]
							}, q.symbol))
						})]
					})
				}), data.can_mutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 flex flex-col gap-2 sm:flex-row",
					onSubmit: (e) => {
						e.preventDefault();
						run("Watchlist saved", () => postAlpacaWatchlist({ data: { watchlist: watchText.split(/[\s,]+/).filter(Boolean) } }));
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: watchText,
						onChange: (e) => setWatchText(e.target.value),
						className: "min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm",
						placeholder: "SPY, QQQ, NVDA"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: busy,
						className: "min-h-11 rounded-md border border-border px-4 text-sm",
						children: "Save watchlist"
					})]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Order ticket",
				aside: data.can_mutate ? void 0 : "operator only",
				children: !data.can_mutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Reviewer can read the book. Operator sends orders." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3",
					onSubmit: (e) => {
						e.preventDefault();
						run(`Order ${side} ${symbol}`, () => postAlpacaOrder({ data: {
							symbol,
							side,
							type,
							timeInForce: tif,
							qty: sizeMode === "qty" ? qty : void 0,
							notional: sizeMode === "notional" ? notional : void 0,
							limitPrice: type === "limit" ? limitPrice : void 0,
							extendedHours: extended,
							confirmLive
						} }));
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2 md:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] uppercase tracking-wider text-muted",
										children: "Symbol"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: symbol,
										onChange: (e) => setSymbol(e.target.value.toUpperCase()),
										className: "min-h-11 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] uppercase tracking-wider text-muted",
										children: "Side"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: side,
										onChange: (e) => setSide(e.target.value),
										className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "buy",
											children: "Buy"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "sell",
											children: "Sell"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] uppercase tracking-wider text-muted",
										children: "Type"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: type,
										onChange: (e) => setType(e.target.value),
										className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "market",
											children: "Market"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "limit",
											children: "Limit"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] uppercase tracking-wider text-muted",
										children: "TIF"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: tif,
										onChange: (e) => setTif(e.target.value),
										className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "day",
												children: "Day"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "gtc",
												children: "GTC"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "ioc",
												children: "IOC"
											})
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "radio",
										checked: sizeMode === "notional",
										onChange: () => setSizeMode("notional")
									}), "Dollars"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "radio",
										checked: sizeMode === "qty",
										onChange: () => setSizeMode("qty")
									}), "Shares"]
								}),
								sizeMode === "notional" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: notional,
									onChange: (e) => setNotional(e.target.value),
									className: "min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm",
									inputMode: "decimal"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: qty,
									onChange: (e) => setQty(e.target.value),
									className: "min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm",
									inputMode: "decimal"
								}),
								type === "limit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: limitPrice,
									onChange: (e) => setLimitPrice(e.target.value),
									placeholder: "Limit",
									className: "min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm",
									inputMode: "decimal"
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-sm text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: extended,
								onChange: (e) => setExtended(e.target.checked)
							}), "Extended hours (limit only on most sessions)"]
						}),
						live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-2 text-sm text-danger",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "mt-1",
								checked: confirmLive,
								onChange: (e) => setConfirmLive(e.target.checked)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Send this as a live order. I accept the fill risk." })]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy || live && !confirmLive,
							className: "min-h-11 rounded-md px-4 text-sm " + (side === "sell" ? "border border-danger text-danger" : "bg-primary text-primary-fg") + " disabled:opacity-40",
							children: busy ? "Sending…" : `${side === "buy" ? "Buy" : "Sell"} ${symbol}`
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Positions",
				aside: `${positions.length} open`,
				children: positions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No open Alpaca positions." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[40rem] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Symbol"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Qty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Avg"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Last"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Mkt"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "uP/L"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "pb-2 font-medium" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "font-mono text-xs",
							children: positions.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-fg",
										children: p.symbol
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: p.qty
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: p.avg_entry_price
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: p.current_price
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: p.market_value
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 " + ((Number(p.unrealized_pl) || 0) < 0 ? "text-danger" : ""),
										children: p.unrealized_pl
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: data.can_mutate && p.symbol ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy,
											className: "min-h-11 rounded-md border border-border px-3 text-xs",
											onClick: () => void run(`Closed ${p.symbol}`, () => postAlpacaClose({ data: { symbol: p.symbol } })),
											children: "Close"
										}) : null
									})
								]
							}, p.symbol ?? Math.random()))
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Open orders",
				aside: `${orders.length}`,
				children: [
					orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No working orders." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[36rem] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "text-[11px] uppercase tracking-wider text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Symbol"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Side"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Qty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Type"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "pb-2 font-medium" })
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "font-mono text-xs",
								children: orders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: o.symbol
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: o.side
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: o.qty ?? o.notional
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: o.type
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: o.status
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: data.can_mutate && o.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: busy,
												className: "min-h-11 rounded-md border border-border px-3 text-xs",
												onClick: () => void run("Canceled", () => postAlpacaCancel({ data: { orderId: o.id } })),
												children: "Cancel"
											}) : null
										})
									]
								}, o.id ?? o.client_order_id ?? Math.random()))
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-3 min-h-11 rounded-md border border-border px-4 text-sm",
						onClick: () => void fetchAlpacaOrders({ data: { status: "all" } }).then((r) => setHistory(r.orders)).catch((e) => setErr(e instanceof Error ? e.message : "History failed")),
						children: "Load recent history"
					}),
					history ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1 font-mono text-xs text-muted",
						children: history.slice(0, 20).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							o.submitted_at?.slice(0, 19),
							" ",
							o.side,
							" ",
							o.symbol,
							" ",
							o.qty ?? o.notional,
							" ",
							o.status
						] }, o.id ?? o.client_order_id ?? Math.random()))
					}) : null
				]
			})
		]
	});
}
function money(v) {
	if (v == null || typeof v === "boolean") return "—";
	const n = Number(v);
	if (!Number.isFinite(n)) return v;
	return n.toLocaleString("en-US", {
		style: "currency",
		currency: "USD"
	});
}
function fmtTs(v) {
	if (typeof v !== "string" || !v) return "—";
	return v.replace("T", " ").slice(0, 16);
}
function maskAcct(n) {
	return n.length <= 4 ? n : `…${n.slice(-4)}`;
}
//#endregion
export { Trade as component };
