import { DEVFRAME_CONNECTION_META_FILENAME, DEVFRAME_WS_ROUTE } from "../constants.mjs";
import { t as diagnostics } from "../diagnostics-D7wM2cwM.mjs";
import { n as resolveBasePath, t as normalizeBasePath } from "../_shared-bWRzeSa0.mjs";
import { serveStaticNodeMiddleware } from "../utils/serve-static.mjs";
import { n as resolveDevServerPort, r as resolveMcpConnectionMeta, t as createDevServer } from "../dev-Bc49u3qg.mjs";
import { resolve } from "pathe";
//#region src/helpers/vite.ts
/**
* Bridge a devframe into an existing Vite dev server. Returns a Vite
* plugin with two modes, picked via `options.devMiddleware`:
*
*   - **static-mount mode** (default) — mounts `def.cli.distDir` at
*     `options.base` with SPA fallback enabled. No RPC server is started.
*
*   - **bridge mode** (`devMiddleware: true | {…}`) — skips the static
*     mount; the host app owns the SPA. Devframe starts a separate
*     RPC + WS dev server (via {@link createDevServer} in bridge mode)
*     and registers Vite middleware at `<base>__connection.json` so the
*     host-served SPA can discover the WS endpoint via
*     {@link connectDevframe}.
*
* The side-car RPC server **gates by default** (devframe's interactive OTP
* unless the definition's `cli.auth` opts out), printing its code/link banner
* to stdout, so a bridged devframe isn't silently reachable by anything that
* can open its socket. Pass `options.auth: false` to opt out for a single-user
* localhost host, or a {@link DevframeAuthHandler} for a custom scheme.
*
* Use bridge mode when integrating with frameworks that own the SPA
* (Nuxt, Astro, SolidStart, plain Vite apps). For the all-in-one
* `dev` / `build` / `mcp` shell, reach for {@link createCac} instead.
*/
function viteDevBridge(d, options = {}) {
	const base = normalizeMountBase(options.base ?? resolveBasePath(d, "hosted"));
	if (!options.devMiddleware) {
		const distDir = d.cli?.distDir;
		return {
			name: `devframe:${d.id}`,
			apply: "serve",
			configureServer(server) {
				if (!distDir) return;
				server.middlewares.use(base, serveStaticNodeMiddleware(resolve(distDir)));
			}
		};
	}
	const mw = options.devMiddleware === true ? {} : options.devMiddleware;
	let started;
	return {
		name: `devframe:${d.id}`,
		apply: "serve",
		async configureServer(server) {
			await started?.close().catch(() => {});
			started = void 0;
			let port;
			try {
				port = mw.port ?? await resolveDevServerPort(d, { host: mw.host });
				started = await createDevServer(d, {
					host: mw.host,
					port,
					flags: mw.flags,
					openBrowser: false,
					auth: options.auth,
					mcp: options.mcp
				});
			} catch (e) {
				diagnostics.DF0033({
					id: d.id,
					reason: String(e),
					cause: e
				}, { method: "warn" });
				return;
			}
			const mcpMeta = resolveMcpConnectionMeta(d, options.mcp, port);
			const metaPath = `${base}${DEVFRAME_CONNECTION_META_FILENAME}`;
			server.middlewares.use(metaPath, (_req, res) => {
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({
					backend: "websocket",
					websocket: {
						port,
						path: `/${DEVFRAME_WS_ROUTE}`
					},
					...mcpMeta ? { mcp: mcpMeta } : {}
				}));
			});
			server.httpServer?.once("close", () => {
				started?.close().catch(() => {});
			});
		},
		async closeBundle() {
			await started?.close().catch(() => {});
			started = void 0;
		}
	};
}
/**
* Make `base` safe for `server.middlewares.use(path, …)`. Vite's connect
* router matches by absolute URL prefix, so relative spellings like
* `'./'` (commonly used for base-agnostic Nuxt builds) collapse to the
* origin root before the shared leading/trailing-slash normalization.
*/
function normalizeMountBase(base) {
	return normalizeBasePath(base.replace(/^\.\/?/, "/"));
}
//#endregion
export { viteDevBridge };
