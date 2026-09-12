import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, d as useRouterState, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BdsHrOyG.mjs";
import { Dt as boolean, Et as array, Ft as string, Mt as object, wt as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { i as useCurrentUserState, r as UserButton, t as RedirectToSignIn } from "./gates-DCqWvFS8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-shell-Ct64eJ9k.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("fd703b3fa8cfa6fd331bd0f98a51caa9881d161381a9f593dd9bd2bdd7d5a8d2"));
var postClaimRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ role: _enum(["OPERATOR", "REVIEWER"]) })).handler(createSsrRpc("02050c1717afefe0bad01b26799797ed0386e01ff7cf0834d16272610d426438"));
var fetchHome = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8548084dff2eaed866b8bd8f5597815b4b141335ec3f8565d87dbd0b940274f7"));
var fetchEarnings = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ sessionDate: string().optional() })).handler(createSsrRpc("302cd21071d07675a9fe2f991121a6bd7505d2187f2de3bd5b7e2d9c10aec98c"));
var fetchPredictions = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	manifestId: string().optional(),
	sessionDate: string().optional()
})).handler(createSsrRpc("e89f96a1aaf470a008ac1343d75c55829b73307e7963faab0a8abfefb69a2f68"));
var fetchResults = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("46d21774d2022ef6e8ba437a49e034ea9ef9b8ddbf9cab590a419d7a37129b25"));
var fetchAdmin = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7bdda91b43a11abaa640ec18e32af75ce6ed700094a3e0b1c969f8e8a734f28c"));
var postPause = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ reason: string().min(1).max(500) })).handler(createSsrRpc("66edc67661ea9b37590dc086486fb98a675d106f07ce01e1c733f0f22b1115a1"));
var postResume = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("4c38890dc6c7e11c8e2d3af02ae66fef0a9e00d3496bd2c84cb40165e6841225"));
var postPrintKnowledge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	eventKey: string(),
	securityId: string(),
	reason: string().min(1)
})).handler(createSsrRpc("e8088e70f1bc8126bd1ed26ce4a1ef7bf42dc4a4a8c82dca1906c68fdd1d3901"));
var postFireNote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	hypothesis: _enum([
		"IMPLEMENTATION_BUG",
		"COVERAGE_SHIFT",
		"REGIME_SHIFT"
	]),
	note: string().min(1).max(2e3)
})).handler(createSsrRpc("0778f55c3b44a03b07976243c027b7f33d87b071df3994f46757a30128059372"));
var postRetryDeadlines = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("c8865f430d4b6a90c408d2a4b37c869237574ade65061d953b1a991acf504f5f"));
var postVerifyFreeze = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	manifestId: string(),
	securityId: string()
})).handler(createSsrRpc("100bcb74c9d60bb0150f88d982f760ac0d5ebc9d3eb3331322a7e0976da45bbd"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e4d977053c3c1c28b27350892e9567f8e5001698c9329b1bcf251cfeca864e9b"));
var postAlpacaCredentials = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	apiKeyId: string().min(8).max(80),
	apiSecret: string().min(8).max(120),
	mode: _enum(["PAPER", "LIVE"]),
	confirmLive: boolean().optional()
})).handler(createSsrRpc("ec552bd05083dfbf805065d74e812c1e37ea0ff091c9f3da49bda56f6e2cadc2"));
var postAlpacaDisconnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("1749478d9901533f82125cfd7330b3c3e4965bc78e0eafb0f1f1e14e77bf8d84"));
var postAlpacaWatchlist = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ watchlist: array(string()).min(1).max(24) })).handler(createSsrRpc("5a6335b77a3f3a526ef924528aa843e0863950bf7425998027995179960f6ba3"));
var fetchAlpacaDesk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9b44e62414bb9b40b4225e82a5b9b7c3ff5ce72fd3125baecb07856c8c4603c1"));
var fetchAlpacaOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ status: _enum([
	"open",
	"closed",
	"all"
]).optional() })).handler(createSsrRpc("db16db049bd8330e8950c291bfa61bf46c50023c8949f953ea3f481eeaabb5c5"));
var postAlpacaOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	symbol: string().min(1).max(10),
	side: _enum(["buy", "sell"]),
	type: _enum(["market", "limit"]),
	timeInForce: _enum([
		"day",
		"gtc",
		"ioc"
	]),
	qty: string().optional(),
	notional: string().optional(),
	limitPrice: string().optional(),
	extendedHours: boolean().optional(),
	confirmLive: boolean().optional()
})).handler(createSsrRpc("52a4069c010716827c8d0c774f15b2f9488d16e612ef4c025bd6ed9ea8f98bfd"));
var postAlpacaCancel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ orderId: string().min(1).max(64) })).handler(createSsrRpc("0ebfaa6dae895189bfd671bfa68b5e3ba4343720ce295d59205debdd7eafefca"));
var postAlpacaClose = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ symbol: string().min(1).max(10) })).handler(createSsrRpc("6799f3fcc558d276aa66e54ff472f3ff931ea1a212855c44c5645b8dc34a9c6f"));
var NAV = [
	{
		to: "/",
		label: "Home"
	},
	{
		to: "/earnings",
		label: "Earnings"
	},
	{
		to: "/predictions",
		label: "Predict"
	},
	{
		to: "/results",
		label: "Results"
	},
	{
		to: "/trade",
		label: "Trade"
	},
	{
		to: "/admin",
		label: "Admin"
	}
];
function DeskShell({ children }) {
	const { user, isPending } = useCurrentUserState();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [role, setRole] = (0, import_react.useState)(void 0);
	const [alpacaMode, setAlpacaMode] = (0, import_react.useState)(null);
	const [alpacaOn, setAlpacaOn] = (0, import_react.useState)(false);
	const [claiming, setClaiming] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		fetchMe().then((m) => {
			setRole(m.role);
			setAlpacaOn(Boolean(m.alpaca?.connected));
			setAlpacaMode(m.alpaca?.mode ?? null);
		}).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load desk identity"));
	}, [user]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-bg text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 w-64 animate-pulse rounded-xl bg-surface" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	async function claim(next) {
		setClaiming(true);
		setErr(null);
		try {
			const r = await postClaimRole({ data: { role: next } });
			setRole(r.role);
		} catch (e) {
			setErr(e instanceof Error ? e.message : "Could not assign desk role");
		} finally {
			setClaiming(false);
		}
	}
	if (role === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-bg text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm",
			children: "Loading desk identity…"
		})
	});
	if (role === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-[0.18em] text-muted",
				children: "TRADING APP · PAPER ONLY"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium tracking-tight",
				children: "Choose a desk role"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "This is an information barrier, not a blinded study. Operator runs the session and cannot see labels, marks, or paper P&L until the window is released. Reviewer sees research outcomes and cannot mutate the book. The assignment is permanent for this account."
			}),
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: err
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: claiming,
					onClick: () => void claim("OPERATOR"),
					className: "rounded-lg border border-border bg-surface px-4 py-4 text-left transition hover:border-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-medium",
						children: "Operator"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs leading-relaxed text-muted",
						children: "Pause admission, flatten requests, early-result flags. No hits, bands, or P&L."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: claiming,
					onClick: () => void claim("REVIEWER"),
					className: "rounded-lg border border-border bg-surface px-4 py-4 text-left transition hover:border-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-medium",
						children: "Reviewer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs leading-relaxed text-muted",
						children: "Read labels, bands, and modeled book. Cannot register rules or change admission."
					})]
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg pb-20 text-fg md:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-border bg-bg/95 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium tracking-tight",
								children: "Trading App"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wider " + (alpacaOn && alpacaMode === "LIVE" ? "border-danger text-danger" : alpacaOn ? "border-warn text-warn" : "border-border text-warn"),
								children: alpacaOn && alpacaMode === "LIVE" ? "ALPACA LIVE" : alpacaOn ? "ALPACA PAPER" : "FIXTURE / SYNTHETIC"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[11px] text-muted",
							children: alpacaOn ? alpacaMode === "LIVE" ? "Live Alpaca orders spend real capital · earnings desk remains paper-modeled" : "Alpaca paper venue · earnings research still fixture-modeled" : "Paper only · insert Alpaca keys on Admin to pull quotes and trade"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted sm:inline",
							children: role
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex",
					children: NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: n.to,
						className: "rounded-md px-3 py-1.5 text-sm " + (pathname === n.to ? "bg-surface text-fg" : "text-muted hover:text-fg"),
						children: n.label
					}, n.to))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto max-w-6xl px-4 py-5",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-6",
					children: NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: n.to,
						className: "flex min-h-11 items-center justify-center px-1 text-[11px] " + (pathname === n.to ? "text-fg" : "text-muted"),
						children: n.label
					}, n.to))
				})
			})
		]
	});
}
function Panel({ title, children, aside }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-border bg-surface p-4 md:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium tracking-tight",
				children: title
			}), aside ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-muted",
				children: aside
			}) : null]
		}), children]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-wider text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 font-mono text-lg tabular-nums text-fg",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 text-[11px] text-faint",
				children: hint
			}) : null
		]
	});
}
function Empty({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children
	});
}
function Err({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg border border-danger/40 bg-sunken px-3 py-2 text-sm text-danger",
		role: "alert",
		children
	});
}
function SessionTabs({ sessions, active, to }) {
	if (!sessions.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		children: sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to,
			search: { session: s.session_date },
			className: "min-h-11 rounded-md border px-3 text-sm " + (active === s.session_date ? "border-primary bg-surface text-fg" : "border-border text-muted hover:text-fg"),
			children: s.session_date
		}, s.session_date))
	});
}
//#endregion
export { postResume as C, postPrintKnowledge as S, postVerifyFreeze as T, postAlpacaDisconnect as _, SessionTabs as a, postFireNote as b, fetchAlpacaDesk as c, fetchHome as d, fetchPredictions as f, postAlpacaCredentials as g, postAlpacaClose as h, Panel as i, fetchAlpacaOrders as l, postAlpacaCancel as m, Empty as n, Stat as o, fetchResults as p, Err as r, fetchAdmin as s, DeskShell as t, fetchEarnings as u, postAlpacaOrder as v, postRetryDeadlines as w, postPause as x, postAlpacaWatchlist as y };
