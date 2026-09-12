import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as fetchHome, i as Panel, n as Empty, o as Stat, r as Err, t as DeskShell } from "./desk-shell-Ct64eJ9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-qGe1muVc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeLoader, {}) });
}
function HomeLoader() {
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchHome().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load home"));
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: error });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Loading session…" });
	if ("needs_role" in data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Assign a desk role to continue." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeBody, { data });
}
function HomeBody({ data }) {
	const d = data.data;
	const s = d.latest_session;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight",
				children: "Desk"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					"As of ",
					data.as_of,
					" · window ",
					d.window_id,
					" · rule ",
					d.rule_id
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "Cohort",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Sealed",
							value: s?.sealed_member_count ?? "—"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Frozen",
								value: s?.frozen_count ?? "—",
								hint: s?.freeze_resolution
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "Coverage",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Complete cards",
							value: s?.complete_frozen_cards ?? "—"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Research closed",
								value: s?.research_closed ? "yes" : "no"
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "Reserved capital",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Entry notional",
							value: d.reserved_notional,
							hint: `${d.reserved_count} of 3 slots`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Impaired",
								value: d.impaired_count,
								hint: `${d.nonclosed_positions} nonclosed`
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "Admission",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Pause",
							value: d.admission_paused ? "ON" : "off",
							hint: d.pause_reason ?? "New tickets only"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Overdue jobs",
								value: d.overdue_deadlines
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Sessions",
				aside: "research complete ≠ book clear",
				children: d.sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No sealed sessions." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[32rem] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Session"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Manifest"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "N"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Resolution"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "font-mono text-xs",
							children: d.sessions.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											className: "underline-offset-4 hover:underline",
											to: "/earnings",
											search: { session: row.session_date },
											children: row.session_date
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-muted",
										children: row.manifest_id
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: row.sealed_member_count
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: row.freeze_resolution
									})
								]
							}, row.manifest_id))
						})]
					})
				})
			}),
			d.reviewer_book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Priced book (reviewer)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Latest vintage P&L",
					value: d.reviewer_book.latest_paper_pnl ?? "—",
					hint: "ESTIMATED · stress haircut"
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Operator view omits marks, hits, and P&L reconstruction."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Alpaca",
				aside: d.alpaca.connected ? d.alpaca.mode ?? "on" : "off",
				children: d.alpaca.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Venue",
						value: d.alpaca.mode === "LIVE" ? "LIVE" : "PAPER",
						hint: `${d.alpaca.api_key_masked ?? ""} · ${d.alpaca.account_status ?? "connected"}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/trade",
						className: "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm text-primary-fg",
						children: "Trade desk"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No broker keys yet. Operator stores an Alpaca paper key on Admin." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin",
						className: "inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm",
						children: "Add keys"
					})]
				})
			})
		]
	});
}
//#endregion
export { Home as component };
