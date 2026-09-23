import { DEVFRAME_CONNECTION_META_FILENAME } from "./constants.mjs";
import { n as createHostContext, t as createH3DevframeHost } from "./host-h3-D2hYZvDK.mjs";
import { t as diagnostics } from "./diagnostics-D7wM2cwM.mjs";
import { r as registerDevframeInstance } from "./instance-registry-BnnA2Eoh.mjs";
import { i as normalizeHttpServerUrl, t as startHttpAndWs } from "./server-CD8XmBXl.mjs";
import { n as resolveBasePath, t as normalizeBasePath } from "./_shared-bWRzeSa0.mjs";
import { t as open } from "./open-Deb5xmIT.mjs";
import { mountStaticHandler } from "./utils/serve-static.mjs";
import { createInteractiveAuth } from "./recipes/interactive-auth.mjs";
import { resolve } from "pathe";
import process$1 from "node:process";
import { networkInterfaces } from "node:os";
import { H3 } from "h3";
import { createServer } from "node:net";
import { joinURL, withBase, withLeadingSlash, withoutLeadingSlash } from "ufo";
//#region ../../node_modules/.pnpm/get-port-please@3.2.0/node_modules/get-port-please/dist/index.mjs
const unsafePorts = /* @__PURE__ */ new Set([
	1,
	7,
	9,
	11,
	13,
	15,
	17,
	19,
	20,
	21,
	22,
	23,
	25,
	37,
	42,
	43,
	53,
	69,
	77,
	79,
	87,
	95,
	101,
	102,
	103,
	104,
	109,
	110,
	111,
	113,
	115,
	117,
	119,
	123,
	135,
	137,
	139,
	143,
	161,
	179,
	389,
	427,
	465,
	512,
	513,
	514,
	515,
	526,
	530,
	531,
	532,
	540,
	548,
	554,
	556,
	563,
	587,
	601,
	636,
	989,
	990,
	993,
	995,
	1719,
	1720,
	1723,
	2049,
	3659,
	4045,
	5060,
	5061,
	6e3,
	6566,
	6665,
	6666,
	6667,
	6668,
	6669,
	6697,
	10080
]);
function isUnsafePort(port) {
	return unsafePorts.has(port);
}
function isSafePort(port) {
	return !isUnsafePort(port);
}
var GetPortError = class extends Error {
	constructor(message, opts) {
		super(message, opts);
		this.message = message;
	}
	name = "GetPortError";
};
function _log(verbose, message) {
	if (verbose) console.log(`[get-port] ${message}`);
}
function _generateRange(from, to) {
	if (to < from) return [];
	const r = [];
	for (let index = from; index <= to; index++) r.push(index);
	return r;
}
function _tryPort(port, host) {
	return new Promise((resolve) => {
		const server = createServer();
		server.unref();
		server.on("error", () => {
			resolve(false);
		});
		server.listen({
			port,
			host
		}, () => {
			const { port: port2 } = server.address();
			server.close(() => {
				resolve(isSafePort(port2) && port2);
			});
		});
	});
}
function _getLocalHosts(additional) {
	const hosts = new Set(additional);
	for (const _interface of Object.values(networkInterfaces())) for (const config of _interface || []) if (config.address && !config.internal && !config.address.startsWith("fe80::") && !config.address.startsWith("169.254")) hosts.add(config.address);
	return [...hosts];
}
async function _findPort(ports, host) {
	for (const port of ports) {
		const r = await _tryPort(port, host);
		if (r) return r;
	}
}
function _fmtOnHost(hostname) {
	return hostname ? `on host ${JSON.stringify(hostname)}` : "on any host";
}
const HOSTNAME_RE = /^(?!-)[\d.:A-Za-z-]{1,63}(?<!-)$/;
function _validateHostname(hostname, _public, verbose) {
	if (hostname && !HOSTNAME_RE.test(hostname)) {
		const fallbackHost = _public ? "0.0.0.0" : "127.0.0.1";
		_log(verbose, `Invalid hostname: ${JSON.stringify(hostname)}. Using ${JSON.stringify(fallbackHost)} as fallback.`);
		return fallbackHost;
	}
	return hostname;
}
async function getPort(_userOptions = {}) {
	if (typeof _userOptions === "number" || typeof _userOptions === "string") _userOptions = { port: Number.parseInt(_userOptions + "") || 0 };
	const _port = Number(_userOptions.port ?? process.env.PORT);
	const _userSpecifiedAnyPort = Boolean(_userOptions.port || _userOptions.ports?.length || _userOptions.portRange?.length);
	const options = {
		random: _port === 0,
		ports: [],
		portRange: [],
		alternativePortRange: _userSpecifiedAnyPort ? [] : [3e3, 3100],
		verbose: false,
		..._userOptions,
		port: _port,
		host: _validateHostname(_userOptions.host ?? process.env.HOST, _userOptions.public, _userOptions.verbose)
	};
	if (options.random && !_userSpecifiedAnyPort) return getRandomPort(options.host);
	const portsToCheck = [
		options.port,
		...options.ports,
		..._generateRange(...options.portRange)
	].filter((port) => {
		if (!port) return false;
		if (!isSafePort(port)) {
			_log(options.verbose, `Ignoring unsafe port: ${port}`);
			return false;
		}
		return true;
	});
	if (portsToCheck.length === 0) portsToCheck.push(3e3);
	let availablePort = await _findPort(portsToCheck, options.host);
	if (!availablePort && options.alternativePortRange.length > 0) {
		availablePort = await _findPort(_generateRange(...options.alternativePortRange), options.host);
		if (portsToCheck.length > 0) {
			let message = `Unable to find an available port (tried ${portsToCheck.join("-")} ${_fmtOnHost(options.host)}).`;
			if (availablePort) message += ` Using alternative port ${availablePort}.`;
			_log(options.verbose, message);
		}
	}
	if (!availablePort && _userOptions.random !== false) {
		availablePort = await getRandomPort(options.host);
		if (availablePort) _log(options.verbose, `Using random port ${availablePort}`);
	}
	if (!availablePort) {
		const triedRanges = [
			options.port,
			options.portRange.join("-"),
			options.alternativePortRange.join("-")
		].filter(Boolean).join(", ");
		throw new GetPortError(`Unable to find an available port ${_fmtOnHost(options.host)} (tried ${triedRanges})`);
	}
	return availablePort;
}
async function getRandomPort(host) {
	const port = await checkPort(0, host);
	if (port === false) throw new GetPortError(`Unable to find a random port ${_fmtOnHost(host)}`);
	return port;
}
async function checkPort(port, host = process.env.HOST, verbose) {
	if (!host) host = _getLocalHosts([void 0, "0.0.0.0"]);
	if (!Array.isArray(host)) return _tryPort(port, host);
	for (const _host of host) {
		const _port = await _tryPort(port, _host);
		if (_port === false) {
			if (port < 1024 && verbose) _log(verbose, `Unable to listen to the privileged port ${port} ${_fmtOnHost(_host)}`);
			return false;
		}
		if (port === 0 && _port !== 0) port = _port;
	}
	return port;
}
//#endregion
//#region src/adapters/dev.ts
const DEFAULT_PORT = 9999;
/**
* Resolve the listening port for {@link createDevServer}, honoring the
* definition's `cli.port` / `cli.portRange` / `cli.random` settings.
* Exposed separately so authors who run their own argv parsing can
* resolve a port up-front (to print it, log it, etc.) before starting
* the server.
*/
async function resolveDevServerPort(def, options = {}) {
	const host = options.host ?? def.cli?.host ?? "localhost";
	const portOptions = {
		port: options.defaultPort ?? def.cli?.port ?? DEFAULT_PORT,
		host
	};
	if (def.cli?.portRange) portOptions.portRange = def.cli.portRange;
	if (def.cli?.random) portOptions.random = def.cli.random;
	return getPort(portOptions);
}
/**
* Start a devframe dev server for a {@link DevframeDefinition} —
* h3 + WebSocket RPC + (optionally) the author's SPA mounted at the
* resolved base path.
*
* When `distDir` is omitted (and `def.cli?.distDir` is unset) the
* server runs in **bridge mode**: only `__connection.json` and the WS
* endpoint are mounted, with no SPA mount. The SPA is expected to be
* hosted elsewhere (e.g. by a parent Vite/Nuxt dev server) — see
* `viteDevBridge({ devMiddleware })`.
*
* Returns the underlying {@link StartedServer} handle so callers can
* close it gracefully (SIGINT, hot-reload, test teardown).
*
* Use this directly when integrating devframe into an existing CLI
* framework (commander, yargs, hand-rolled CAC). For the all-in-one
* `dev` / `build` / `mcp` shell, reach for {@link createCac} instead.
*/
async function createDevServer(def, options = {}) {
	const distDir = options.distDir ?? def.cli?.distDir;
	const host = options.host ?? def.cli?.host ?? "localhost";
	const port = options.port ?? await resolveDevServerPort(def, { host });
	const flags = options.flags ?? {};
	const basePath = options.basePath ? normalizeBasePath(options.basePath) : resolveBasePath(def, "standalone");
	const app = options.app ?? new H3();
	const h3Host = createH3DevframeHost({
		origin: normalizeHttpServerUrl(host, port),
		appName: def.id,
		mount: (base, dir) => {
			mountStaticHandler(app, base, dir);
		}
	});
	const ctx = await createHostContext({
		cwd: process$1.cwd(),
		mode: "dev",
		host: h3Host
	});
	const setupInfo = { flags };
	await def.setup(ctx, setupInfo);
	const mcpConfig = resolveMcpConfig(options.mcp ?? def.cli?.mcp);
	let mcpDispose;
	let mcpMeta;
	if (mcpConfig) {
		const mcpRoute = withoutLeadingSlash(mcpConfig.path ?? "__mcp");
		const mcpPath = joinURL(basePath, mcpRoute);
		let mountMcpHttp;
		try {
			({mountMcpHttp} = await import("./http-C4T68YV6.mjs"));
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			throw diagnostics.DF0017({
				transport: "http",
				reason,
				cause: error
			});
		}
		mcpDispose = mountMcpHttp(app, ctx, mcpPath, {
			serverName: `${def.id} (devframe)`,
			serverVersion: def.version ?? "0.0.0",
			exposeSharedState: true,
			allowedOrigins: mcpConfig.allowedOrigins
		}).dispose;
		mcpMeta = { path: mcpRoute };
	}
	const { bindPath, wsPort, meta } = resolveWsConnection(def, options, basePath);
	const connectionMetaPath = joinURL(basePath, DEVFRAME_CONNECTION_META_FILENAME);
	app.use(connectionMetaPath, () => ({
		backend: "websocket",
		websocket: meta,
		...mcpMeta ? { mcp: mcpMeta } : {}
	}));
	if (distDir) mountStaticHandler(app, basePath, resolve(distDir));
	const authOption = flags.auth === false ? false : options.auth !== void 0 ? options.auth : def.cli?.auth;
	let authHandler;
	let resolvedAuth;
	if (authOption === false) resolvedAuth = false;
	else if (typeof authOption === "object") {
		authHandler = authOption;
		resolvedAuth = authOption;
	} else {
		authHandler = createInteractiveAuth(ctx);
		resolvedAuth = authHandler;
	}
	const started = await startHttpAndWs({
		context: ctx,
		host,
		port,
		app,
		path: bindPath,
		wsPort,
		auth: resolvedAuth,
		onPeerConnect: options.onPeerConnect,
		onPeerDisconnect: options.onPeerDisconnect,
		onReady: async (info) => {
			authHandler?.printBanner();
			await options.onReady?.(info);
			await maybeOpenBrowser(def, flags, `${info.origin}${basePath}`, options.openBrowser, authHandler);
		}
	});
	const registration = registerDevframeInstance({
		pid: process$1.pid,
		port: started.port,
		origin: normalizeHttpServerUrl(host, started.port),
		basePath,
		id: def.id,
		name: def.name,
		rootDir: process$1.cwd(),
		mcp: mcpConfig ? { path: joinURL(basePath, withoutLeadingSlash(mcpConfig.path ?? "__mcp")) } : null,
		startedAt: Date.now()
	});
	const closeServer = started.close;
	started.close = async () => {
		registration.unregister();
		await mcpDispose?.();
		await closeServer();
	};
	return started;
}
/**
* Normalize the `cli.mcp` / `mcp` option (`boolean | McpRouteOptions`) into
* concrete options, or `undefined` when the MCP route is disabled.
*/
function resolveMcpConfig(mcp) {
	if (!mcp) return void 0;
	return mcp === true ? {} : mcp;
}
/**
* Resolve the `mcp` entry a `__connection.json` should advertise for a dev
* server started with the given `mcp` option (falling back to `def.cli?.mcp`,
* exactly like {@link createDevServer}), or `undefined` when the route is
* disabled.
*
* Hosted bridges that hand-roll their connection meta (`viteDevBridge`,
* `@devframes/next`'s handler) pass the side-car `port`: the advertised path
* becomes absolute (the side-car mounts at `/`) and the client dials
* `<page-host>:<port><path>`. Without `port` the path stays relative, resolved
* against `__connection.json`'s own location (the same-server default).
*
* @experimental
*/
function resolveMcpConnectionMeta(def, mcp, port) {
	const config = resolveMcpConfig(mcp ?? def.cli?.mcp);
	if (!config) return void 0;
	const route = withoutLeadingSlash(config.path ?? "__mcp");
	return port != null ? {
		path: withLeadingSlash(route),
		port
	} : { path: route };
}
/**
* Resolve the three WS connection scenarios from the definition / call-site
* config into a concrete server bind path, optional dedicated port, and the
* `__connection.json` descriptor the browser resolves.
*/
function resolveWsConnection(def, options, basePath) {
	const ws = options.ws ?? def.cli?.ws ?? {};
	const route = withoutLeadingSlash(ws.route ?? "__devframe_ws");
	if (ws.url) return {
		bindPath: joinURL(basePath, route),
		wsPort: void 0,
		meta: ws.url
	};
	if (ws.port != null) return {
		bindPath: withLeadingSlash(route),
		wsPort: ws.port,
		meta: {
			port: ws.port,
			path: route
		}
	};
	return {
		bindPath: joinURL(basePath, route),
		wsPort: void 0,
		meta: { path: route }
	};
}
async function maybeOpenBrowser(def, flags, origin, override, authHandler) {
	const flagsOpen = flags.open;
	const cliOpen = def.cli?.open;
	const resolved = override ?? flagsOpen ?? cliOpen;
	if (resolved === void 0 || resolved === false) return;
	const target = typeof resolved === "string" ? withBase(resolved, origin) : origin;
	const authorizedTarget = authHandler?.buildOpenUrl?.(target) ?? target;
	try {
		await open(authorizedTarget);
	} catch {}
}
//#endregion
export { resolveDevServerPort as n, resolveMcpConnectionMeta as r, createDevServer as t };
