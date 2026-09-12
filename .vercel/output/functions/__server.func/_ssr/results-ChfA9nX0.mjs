import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Panel, n as Empty, o as Stat, p as fetchResults, r as Err, t as DeskShell } from "./desk-shell-Ct64eJ9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results-ChfA9nX0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Results() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultsLoader, {}) });
}
function ResultsLoader() {
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchResults().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load results"));
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: error });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Loading report…" });
	if ("needs_role" in data) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Body, { data });
}
function Body({ data }) {
	const d = data.data;
	const p = d.process;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight",
				children: "Results"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Process coverage first. Denominators sit next to rates. Zero never substitutes for missing."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-warn/40 bg-sunken px-4 py-3 text-sm leading-relaxed text-fg",
				children: d.banner
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Process coverage",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3 md:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Sealed N",
							value: p.sealed
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Frozen",
							value: p.frozen,
							hint: `rate ${p.freeze_rate.value ?? p.freeze_rate.reason}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "NO_FREEZE",
							value: p.no_freeze,
							hint: `rate ${p.no_freeze_rate.value ?? p.no_freeze_rate.reason}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "PREDICT",
							value: p.predict
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "STAND_DOWN",
							value: p.stand_down,
							hint: `of frozen ${p.stand_down_rate.value ?? p.stand_down_rate.reason}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Complete cards",
							value: p.complete_frozen_cards
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Partial manifests",
							value: p.partial_manifest_rate.value ?? p.partial_manifest_rate.reason ?? "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "UNGRADEABLE",
							value: p.outcomes.UNGRADEABLE ?? "0"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Research labels",
				children: "restricted" in d.research && d.research.restricted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: d.research.message }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Research, { r: d.research })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Paper book",
				children: "restricted" in d.book && d.book.restricted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Operator cannot reconstruct P&L from this surface." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Book, { b: d.book })
			})
		]
	});
}
function Research({ r }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-2 gap-3 md:grid-cols-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Clean PREDICT n",
				value: r.clean_predict_n
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Direction hits",
				value: r.direction_hits
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Hit rate",
				value: r.point_estimate_suppressed ? "suppressed" : r.hit_rate?.value ?? r.hit_rate?.reason ?? "—",
				hint: r.point_estimate_suppressed ? "interval includes 0.5" : void 0
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Attrition interval",
				value: `${r.attrition_lower.value ?? "—"} – ${r.attrition_upper.value ?? "—"}`,
				hint: r.interval_label
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[40rem] text-left text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-[11px] uppercase tracking-wider text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Decision"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Outcome"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Hit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Evidence"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "font-mono",
				children: r.grades.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-2",
							children: [String(g.ticker), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted",
								children: String(g.session_date)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: String(g.decision ?? "—")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: String(g.outcome)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: g.direction_hit == null ? "—" : g.direction_hit ? "hit" : "miss"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: g.in_evidence_set ? "clean" : "excluded"
						})
					]
				}, String(g.id) + String(g.session_date)))
			})]
		})
	})] });
}
function Book({ b }) {
	if (!b.positions.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No paper positions." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[36rem] text-left text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-[11px] uppercase tracking-wider text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "State"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Reserved"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "P&L"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pb-2 font-medium",
						children: "Basis"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "font-mono",
				children: b.positions.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: p.ticker
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: p.state
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: p.original_reserved_notional
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2",
							children: p.paper_pnl ?? "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-2",
							children: [p.basis ?? "—", p.strategy_pnl_eligible === false ? " · ineligible" : ""]
						})
					]
				}, p.ticker + p.state))
			})]
		})
	});
}
//#endregion
export { Results as component };
