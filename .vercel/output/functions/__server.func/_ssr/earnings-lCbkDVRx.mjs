import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SessionTabs, i as Panel, n as Empty, r as Err, t as DeskShell, u as fetchEarnings } from "./desk-shell-Ct64eJ9k.mjs";
import { r as Route$6 } from "./router-BW0tBZ7D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/earnings-lCbkDVRx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Earnings() {
	const { session } = Route$6.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EarningsLoader, { session }) });
}
function EarningsLoader({ session }) {
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setData(null);
		fetchEarnings({ data: { sessionDate: session } }).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load earnings"));
	}, [session]);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: error });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Loading candidates…" });
	if ("needs_role" in data) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Body, { data });
}
function Body({ data }) {
	const d = data.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight",
				children: "Earnings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					"Session ",
					d.session_date,
					" · sealed snapshot only · post-seal quotes are not used for the card"
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionTabs, {
				sessions: d.sessions ?? [],
				active: d.session_date,
				to: "/earnings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: d.members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl border border-border bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							title: m.permanent_security_id,
							children: m.ticker
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[11px] text-muted",
							children: m.permanent_security_id
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted",
							children: m.timing_quality === "ISSUER_CONFIRMED" ? "issuer AMC" : m.timing_quality
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-3 grid grid-cols-2 gap-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Card"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono",
								children: m.card_complete ? "complete" : "incomplete"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Options"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono",
								children: m.options_valid ? "valid" : "missing / invalid"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Implied move"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono",
								children: m.implied_move ?? "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Pins"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono",
								children: m.pin_count
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Rel 5d"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono",
								children: m.benchmark_relative_5d ?? "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Rel 63d"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono",
								children: m.benchmark_relative_63d ?? "—"
							})] })
						]
					})]
				}, m.permanent_security_id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Exclusions",
				children: d.exclusions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No excluded candidates on this sealed session." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: d.exclusions.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between gap-3 border-b border-border py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							e.ticker,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] text-muted",
								children: e.permanent_security_id
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-muted",
							children: e.reason_codes.join(", ")
						})]
					}, e.permanent_security_id))
				})
			})
		]
	});
}
//#endregion
export { Earnings as component };
