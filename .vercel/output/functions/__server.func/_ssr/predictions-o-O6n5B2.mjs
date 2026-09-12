import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { T as postVerifyFreeze, a as SessionTabs, f as fetchPredictions, i as Panel, n as Empty, r as Err, t as DeskShell } from "./desk-shell-Ct64eJ9k.mjs";
import { n as Route$4 } from "./router-BW0tBZ7D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/predictions-o-O6n5B2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Predictions() {
	const { session } = Route$4.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PredictionsLoader, { session }) });
}
function PredictionsLoader({ session }) {
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setData(null);
		fetchPredictions({ data: { sessionDate: session } }).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load predictions"));
	}, [session]);
	async function verify(manifestId, securityId) {
		setNote(null);
		try {
			const r = await postVerifyFreeze({ data: {
				manifestId,
				securityId
			} });
			setNote(`Verified ${securityId}: ${r.decision ?? "ok"} (duplicate=${Boolean(r.duplicate)})`);
		} catch (e) {
			setNote(e instanceof Error ? e.message : "Verify failed");
		}
	}
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: error });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-3 text-sm text-muted",
		children: note
	}) : null, !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Loading freeze ledger…" }) : "needs_role" in data ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Body, {
		data,
		onVerify: verify
	})] });
}
function Body({ data, onVerify }) {
	const d = data.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight",
				children: "Predictions"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					d.session_date,
					" · resolution ",
					d.freeze_resolution,
					" · NO_FREEZE is missing prediction, not stand-down"
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionTabs, {
				sessions: d.sessions ?? [],
				active: d.session_date,
				to: "/predictions"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Freeze ledger",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[40rem] text-left text-sm",
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
									children: "Execution"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Verify"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: d.rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border align-top",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-medium",
											children: r.ticker
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-mono text-[10px] text-muted",
											children: r.permanent_security_id
										}),
										r.input_hash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 max-w-[14rem] truncate font-mono text-[10px] text-faint",
											children: r.input_hash
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2 font-mono text-xs",
									children: [
										r.status,
										r.direction ? ` / ${r.direction}` : r.status === "NO_FREEZE" ? "" : " / —",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 text-[10px] text-muted",
											children: r.verification_level ?? ""
										}),
										r.magnitude_low ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-muted",
											children: [
												"band ",
												r.magnitude_low,
												"–",
												r.magnitude_high
											]
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-xs",
									children: r.execution === "PAPER_COMMITTED" ? "PREDICT / PAPER COMMITTED" : r.status === "PREDICT" ? "PREDICT / NOT TRADED" : r.execution
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: r.status !== "NO_FREEZE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "min-h-11 rounded-md border border-border px-3 text-xs hover:border-primary",
										onClick: () => onVerify(d.manifest_id, r.permanent_security_id),
										children: "Verify"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "no artifact"
									})
								})
							]
						}, r.permanent_security_id)) })]
					})
				})
			})
		]
	});
}
//#endregion
export { Predictions as component };
