import { createRpcServer } from "./rpc/server.mjs";
import { attachWsRpcTransport } from "./rpc/transports/ws-server.mjs";
import { t as diagnostics } from "./diagnostics-D7wM2cwM.mjs";
import { t as getInternalContext } from "./context-CBg8iRbQ.mjs";
import { createServer } from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import { H3, toNodeHandler } from "h3";
import { isIP } from "node:net";
//#region src/node/utils.ts
function isObject(value) {
	return Object.prototype.toString.call(value) === "[object Object]";
}
const NON_DIALABLE_HOSTS = /* @__PURE__ */ new Set([
	"0.0.0.0",
	"127.0.0.1",
	"::",
	"0000:0000:0000:0000:0000:0000:0000:0000",
	""
]);
/** Map a bind host to a host a client can actually connect to. */
function toDialableHost(host) {
	return NON_DIALABLE_HOSTS.has(host) ? "localhost" : host;
}
/** Format a bind host for use in a URL authority (dialable, IPv6-bracketed). */
function formatHostForUrl(host) {
	const dialable = toDialableHost(host);
	return isIP(dialable) === 6 ? `[${dialable}]` : dialable;
}
function normalizeHttpServerUrl(host, port) {
	return `http://${formatHostForUrl(host)}:${port}`;
}
//#endregion
//#region src/node/server.ts
/**
* Compose an h3 + WebSocket server for a devframe context. The RPC
* group is bound to `context.rpc.functions`; the WS endpoint lives on
* the same port as the HTTP server.
*/
async function startHttpAndWs(options) {
	const { context, port } = options;
	const bindHost = options.host ?? "localhost";
	const app = options.app ?? new H3();
	const ownsHttpServer = !options.server;
	const httpServer = options.server ?? createServer(toNodeHandler(app));
	const rpcHost = context.rpc;
	const asyncStorage = new AsyncLocalStorage();
	const authHandler = typeof options.auth === "object" ? options.auth : void 0;
	const effectiveAuthorize = options.authorize ?? authHandler?.authorize;
	if (authHandler) {
		for (const fn of authHandler.rpcFunctions) if (!rpcHost.definitions.has(fn.name)) rpcHost.register(fn);
	}
	const rpcGroup = createRpcServer(rpcHost.functions, { rpcOptions: {
		onFunctionError: options.rpcOptions?.onFunctionError,
		onGeneralError: options.rpcOptions?.onGeneralError,
		resolver(name, fn) {
			const rpc = this;
			if (!fn) return void 0;
			return async function(...args) {
				const meta = rpc.$meta;
				if (effectiveAuthorize && !effectiveAuthorize(name, {
					meta,
					rpc
				})) throw diagnostics.DF0036({ name });
				return await asyncStorage.run({
					rpc,
					meta
				}, async () => {
					return (await fn).apply(this, args);
				});
			};
		}
	} });
	const separateWsPort = ownsHttpServer && options.wsPort != null && options.wsPort !== port ? options.wsPort : void 0;
	const { ws, close: closeWs } = attachWsRpcTransport(rpcGroup, {
		...separateWsPort != null ? {
			port: separateWsPort,
			host: bindHost
		} : { server: httpServer },
		path: options.path,
		destroyUnmatched: ownsHttpServer,
		allowedOrigins: options.allowedOrigins,
		onConnected: authHandler || options.onPeerConnect ? (peer, meta) => {
			const session = {
				meta,
				rpc: rpcGroup.clients.find((client) => client.$meta === meta)
			};
			authHandler?.onConnect(peer, session);
			options.onPeerConnect?.(peer, session);
		} : void 0,
		onDisconnected: (peer, meta) => {
			options.onPeerDisconnect?.(peer, meta);
			rpcHost._emitSessionDisconnected(meta);
		}
	});
	rpcHost._rpcGroup = rpcGroup;
	rpcHost._asyncStorage = asyncStorage;
	rpcHost._authDisabled = options.auth === false;
	if (options.auth === false && !rpcHost.definitions.has("anonymous:devframe:auth")) rpcHost.register({
		name: "anonymous:devframe:auth",
		type: "action",
		handler: () => {
			const session = rpcHost.getCurrentRpcSession();
			if (session) session.meta.isTrusted = true;
			return { isTrusted: true };
		}
	});
	if (ownsHttpServer) {
		try {
			await new Promise((resolve, reject) => {
				const onError = (error) => reject(error);
				httpServer.once("error", onError);
				httpServer.listen(port, bindHost, () => {
					httpServer.removeListener("error", onError);
					resolve();
				});
			});
		} catch (error) {
			await closeWs().catch(() => {});
			throw diagnostics.DF0052({
				host: bindHost,
				port,
				reason: error instanceof Error ? error.message : String(error),
				cause: error
			});
		}
		if (options.onServerError) httpServer.on("error", options.onServerError);
	}
	const address = httpServer.address();
	const resolvedPort = typeof address === "object" && address ? address.port : port;
	const origin = normalizeHttpServerUrl(bindHost, resolvedPort);
	const internal = getInternalContext(context);
	const wsPortForUrl = separateWsPort ?? resolvedPort;
	const wsUrl = `ws://${formatHostForUrl(bindHost)}:${wsPortForUrl}${options.path ?? ""}`;
	internal.wsEndpoint = { url: wsUrl };
	if (options.onReady) await options.onReady({
		origin,
		port: resolvedPort,
		app
	});
	function connectionMeta() {
		const jsonSerializableMethods = [];
		for (const def of rpcHost.definitions.values()) if (def.jsonSerializable === true) jsonSerializableMethods.push(def.name);
		return {
			backend: "websocket",
			websocket: separateWsPort != null ? {
				port: separateWsPort,
				path: options.path
			} : { path: options.path },
			jsonSerializableMethods
		};
	}
	return {
		origin,
		port: resolvedPort,
		app,
		ws,
		rpcGroup,
		connectionMeta,
		async close() {
			await closeWs();
			if (ownsHttpServer) await new Promise((r) => httpServer.close(() => r()));
			if (getInternalContext(context).wsEndpoint?.url === wsUrl) getInternalContext(context).wsEndpoint = void 0;
		}
	};
}
//#endregion
export { toDialableHost as a, normalizeHttpServerUrl as i, formatHostForUrl as n, isObject as r, startHttpAndWs as t };
