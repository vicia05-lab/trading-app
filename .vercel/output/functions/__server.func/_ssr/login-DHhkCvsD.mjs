import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { t as GROK_PROVIDERS } from "./server-Dcx2H4yf.mjs";
import { n as SignedIn } from "./gates-DCqWvFS8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DHhkCvsD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("in");
	const [err, setErr] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onEmail(e) {
		e.preventDefault();
		setBusy(true);
		setErr(null);
		try {
			if (mode === "up") {
				const { error } = await authClient.signUp.email({
					email,
					password,
					name: email.split("@")[0] ?? "desk"
				});
				if (error) throw new Error(error.message);
			} else {
				const { error } = await authClient.signIn.email({
					email,
					password
				});
				if (error) throw new Error(error.message);
			}
			window.location.href = "/";
		} catch (ex) {
			setErr(ex instanceof Error ? ex.message : "Sign-in failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.18em] text-muted",
					children: "TRADING APP"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-2xl font-medium tracking-tight",
					children: "Sign in"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Paper-only earnings research desk. No live routing."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void signIn(p.providerId, { callbackURL: "/" }),
						className: "min-h-11 w-full rounded-md border border-border bg-surface px-4 text-sm hover:border-primary",
						children: ["Continue with ", p.label]
					}, p.providerId)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-faint",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
							"email",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: onEmail,
						className: "flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								htmlFor: "email",
								className: "text-xs text-muted",
								children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "email",
									type: "email",
									required: true,
									autoComplete: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									className: "mt-1 min-h-11 w-full rounded-md border border-border bg-sunken px-3 text-sm text-fg outline-none focus:border-primary"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								htmlFor: "password",
								className: "text-xs text-muted",
								children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "password",
									type: "password",
									required: true,
									minLength: 8,
									autoComplete: "current-password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									className: "mt-1 min-h-11 w-full rounded-md border border-border bg-sunken px-3 text-sm text-fg outline-none focus:border-primary"
								})]
							}),
							err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-danger",
								children: err
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: busy,
								className: "min-h-11 rounded-md bg-primary text-sm font-medium text-primary-fg disabled:opacity-60",
								children: busy ? "Working…" : mode === "up" ? "Create account" : "Sign in with email"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-xs text-muted underline-offset-4 hover:underline",
								onClick: () => setMode(mode === "up" ? "in" : "up"),
								children: mode === "up" ? "Have an account? Sign in" : "Need an account? Create one"
							})
						]
					})
				]
			})
		]
	});
}
//#endregion
export { Login as component };
