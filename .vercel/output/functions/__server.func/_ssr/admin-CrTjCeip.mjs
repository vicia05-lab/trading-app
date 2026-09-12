import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as postResume, S as postPrintKnowledge, _ as postAlpacaDisconnect, b as postFireNote, g as postAlpacaCredentials, i as Panel, n as Empty, r as Err, s as fetchAdmin, t as DeskShell, w as postRetryDeadlines, x as postPause } from "./desk-shell-Ct64eJ9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-CrTjCeip.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AlpacaKeysPanel({ status, canMutate, onChanged }) {
	const [keyId, setKeyId] = (0, import_react.useState)("");
	const [secret, setSecret] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)(status.mode ?? "PAPER");
	const [confirmLive, setConfirmLive] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	async function save() {
		setBusy(true);
		setErr(null);
		setNote(null);
		try {
			await postAlpacaCredentials({ data: {
				apiKeyId: keyId.trim(),
				apiSecret: secret.trim(),
				mode,
				confirmLive
			} });
			setSecret("");
			setKeyId("");
			setConfirmLive(false);
			setNote(mode === "LIVE" ? "Live keys stored and verified." : "Paper keys stored and verified.");
		} catch (e) {
			setErr(e instanceof Error ? e.message : "Could not store keys");
		} finally {
			await onChanged();
			setBusy(false);
		}
	}
	async function drop() {
		setBusy(true);
		setErr(null);
		try {
			await postAlpacaDisconnect();
			setNote("Alpaca keys removed from this desk.");
			await onChanged();
		} catch (e) {
			setErr(e instanceof Error ? e.message : "Disconnect failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Alpaca",
		aside: status.connected ? status.mode === "LIVE" ? "LIVE" : "PAPER" : "not connected",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-sm leading-relaxed text-muted",
				children: "Keys stay on the server, encrypted. The secret is never sent back to the browser. Paper trading is the default. Live mode spends real capital at Alpaca — confirm it twice."
			}),
			status.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-muted",
						children: "Key"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-mono text-xs",
						children: status.api_key_masked
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-muted",
						children: "Account"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-mono text-xs",
						children: status.account_number_last4 ? `…${status.account_number_last4}` : "—"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-muted",
						children: "Status"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-mono text-xs",
						children: status.account_status ?? "—"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-muted",
						children: "Last ok"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-mono text-xs",
						children: status.last_ok_at ? status.last_ok_at.slice(0, 19) : "—"
					})] })
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No keys stored. Paste a paper key id and secret from app.alpaca.markets." }),
			status.last_error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: status.last_error })
			}) : null,
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: err })
			}) : null,
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-sm text-muted",
				children: note
			}) : null,
			canMutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3",
				onSubmit: (e) => {
					e.preventDefault();
					save();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: "API key ID"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: keyId,
							onChange: (e) => setKeyId(e.target.value),
							autoComplete: "off",
							spellCheck: false,
							className: "min-h-11 rounded-md border border-border bg-sunken px-3 font-mono text-sm",
							placeholder: "PK…"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: "Secret key"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							value: secret,
							onChange: (e) => setSecret(e.target.value),
							autoComplete: "off",
							className: "min-h-11 rounded-md border border-border bg-sunken px-3 font-mono text-sm",
							placeholder: "Stored encrypted · never re-displayed"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "grid gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: "Venue"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border px-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									name: "alpaca-mode",
									checked: mode === "PAPER",
									onChange: () => {
										setMode("PAPER");
										setConfirmLive(false);
									}
								}), "Paper (paper-api.alpaca.markets)"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-11 flex-1 items-center gap-2 rounded-md border border-danger/40 px-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									name: "alpaca-mode",
									checked: mode === "LIVE",
									onChange: () => setMode("LIVE")
								}), "Live (real capital)"]
							})]
						})]
					}),
					mode === "LIVE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-2 text-sm text-danger",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "mt-1",
							checked: confirmLive,
							onChange: (e) => setConfirmLive(e.target.checked)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "I understand these live keys will send real orders against real money." })]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: busy || keyId.trim().length < 8 || secret.trim().length < 8 || mode === "LIVE" && !confirmLive,
								className: "min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg disabled:opacity-40",
								children: busy ? "Testing…" : status.connected ? "Replace keys" : "Save and test"
							}),
							status.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy,
								className: "min-h-11 rounded-md border border-border px-4 text-sm",
								onClick: () => void drop(),
								children: "Disconnect"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/trade",
								className: "flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm",
								children: "Open trade desk"
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Reviewer can see connection status. Only the operator can store or replace keys." })
		]
	});
}
function Admin() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLoader, {}) });
}
function AdminLoader() {
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	async function reload() {
		const d = await fetchAdmin();
		setData(d);
	}
	(0, import_react.useEffect)(() => {
		reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load admin"));
	}, []);
	async function run(label, fn) {
		setNote(null);
		try {
			await fn();
			setNote(label);
			await reload();
		} catch (e) {
			setNote(e instanceof Error ? e.message : "Action failed");
		}
	}
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Err, { children: error });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-3 text-sm text-muted",
		children: note
	}) : null, !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Loading operations…" }) : "needs_role" in data ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Body, {
		data,
		run,
		reload
	})] });
}
function Body({ data, run, reload }) {
	const d = data.data;
	const [reason, setReason] = (0, import_react.useState)("operational pause");
	const [hyp, setHyp] = (0, import_react.useState)("COVERAGE_SHIFT");
	const [fire, setFire] = (0, import_react.useState)("");
	const [pk, setPk] = (0, import_react.useState)({
		eventKey: "",
		securityId: "",
		reason: ""
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight",
				children: "Admin"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Alpaca keys, then desk operations. No force-trade on the earnings book. Flatten still requests a modeled official mark."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlpacaKeysPanel, {
				status: d.alpaca,
				canMutate: d.can_mutate,
				onChanged: reload
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Admission gate",
				aside: d.admission_paused ? "PAUSED" : "open",
				children: [d.can_mutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: reason,
							onChange: (e) => setReason(e.target.value),
							className: "min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 text-sm",
							placeholder: "Pause reason"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-md border border-border px-4 text-sm",
							onClick: () => run("Paused", () => postPause({ data: { reason } })),
							children: "Pause"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg",
							onClick: () => run("Resumed", () => postResume()),
							children: "Resume"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Reviewer cannot mutate admission." }), d.pause_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: d.pause_reason
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Jobs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border text-sm",
					children: d.jobs.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between py-2 font-mono text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: j.job_name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: j.status
						})]
					}, j.job_name))
				}), d.can_mutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-3 min-h-11 rounded-md border border-border px-4 text-sm",
					onClick: () => run("Deadlines retried", () => postRetryDeadlines()),
					children: "Retry due deadlines"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Deadlines",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[28rem] text-left text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-[11px] uppercase tracking-wider text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Kind"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Scheduled"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Applied"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "font-mono",
							children: d.deadlines.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: x.kind
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: x.scheduled_at
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: x.applied_at ?? (x.overdue ? "OVERDUE" : "pending")
									})
								]
							}, i))
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Alarms",
				children: d.alarms.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No open operational alarms." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: d.alarms.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-md border border-border px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: a.code
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-muted",
								children: a.status
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [a.component, a.blocks_new_admission ? " · blocks new admission" : ""]
						})]
					}, i))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Early-result knowledge",
				children: d.can_mutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
							placeholder: "Event key",
							value: pk.eventKey,
							onChange: (e) => setPk({
								...pk,
								eventKey: e.target.value
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
							placeholder: "Permanent security id",
							value: pk.securityId,
							onChange: (e) => setPk({
								...pk,
								securityId: e.target.value
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
							placeholder: "Reason",
							value: pk.reason,
							onChange: (e) => setPk({
								...pk,
								reason: e.target.value
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-md border border-border text-sm",
							onClick: () => run("Knowledge recorded", () => postPrintKnowledge({ data: pk })),
							children: "Append knowledge"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Operator only." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Fire-rate note",
				children: [d.can_mutate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "min-h-11 rounded-md border border-border bg-sunken px-3 text-sm",
							value: hyp,
							onChange: (e) => setHyp(e.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "IMPLEMENTATION_BUG",
									children: "IMPLEMENTATION_BUG"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "COVERAGE_SHIFT",
									children: "COVERAGE_SHIFT"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "REGIME_SHIFT",
									children: "REGIME_SHIFT"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "rounded-md border border-border bg-sunken px-3 py-2 text-sm",
							rows: 3,
							value: fire,
							onChange: (e) => setFire(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-md border border-border text-sm",
							onClick: () => run("Note stored", () => postFireNote({ data: {
								hypothesis: hyp,
								note: fire
							} })),
							children: "Append note"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Operator only." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-xs text-muted",
					children: d.fire_rate_notes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: n.hypothesis
						}),
						" — ",
						n.note
					] }, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Data ports",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
					className: "grid grid-cols-2 gap-2 text-xs md:grid-cols-3",
					children: Object.entries(d.ports).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted",
						children: k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "font-mono",
						children: v
					})] }, k))
				})
			})
		]
	});
}
//#endregion
export { Admin as component };
