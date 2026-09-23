import "../../constants.mjs";
import { n as strictJsonStringify } from "../../serialization-C8Mnw9hK.mjs";
import { n as structuredCloneStringify, t as structuredCloneParse } from "../../structured-clone-CbAV5rFI.mjs";
import { n as randomToken, r as timingSafeEqual } from "../../crypto-token-XCqTSMg9.mjs";
import { createServer } from "node:http";
import { createServer as createServer$1 } from "node:https";
import crossws from "crossws/adapters/node";
//#region src/rpc/transports/ws-server.ts
/**
* Create a live, token-protected origin allowlist for external browser
* viewers. Pass it to {@link WsRpcTransportOptions.allowedOrigins}, then use
* `registerFromUrl()` in the connection metadata handler to authorize a
* viewer without sharing a mutable array or disabling DNS-rebinding protection.
*/
function createWsOriginRegistry(options = {}) {
	const token = randomToken();
	const origins = new Set(options.allowedOrigins ?? []);
	function normalizeOrigin(origin) {
		if (!origin) return;
		try {
			const url = new URL(origin);
			const normalized = url.origin === "null" ? `${url.protocol}//${url.host}` : url.origin;
			return origin === normalized ? normalized : void 0;
		} catch {}
	}
	function registerOrigin(origin, candidateToken) {
		const normalized = normalizeOrigin(origin);
		if (!normalized || !candidateToken || !timingSafeEqual(token, candidateToken)) return false;
		if (options.validateOrigin && !options.validateOrigin(normalized)) return false;
		origins.add(normalized);
		return true;
	}
	return {
		token,
		registerFromUrl(url) {
			let parsed;
			try {
				parsed = new URL(url, "http://localhost");
			} catch {
				return;
			}
			const origin = parsed.searchParams.get("devframe_viewer_origin") ?? void 0;
			return registerOrigin(origin, parsed.searchParams.get("devframe_viewer_origin_token") ?? void 0) ? origin : void 0;
		},
		isAllowed(origin) {
			return isAllowedOrigin(origin, [...origins]);
		}
	};
}
let sessionId = 0;
const EMPTY_DEFS = /* @__PURE__ */ new Map();
function NOOP() {}
function listen(server, port, host) {
	return new Promise((resolve, reject) => {
		const onError = (error) => reject(error);
		server.once("error", onError);
		try {
			server.listen(port, host, () => {
				server.off("error", onError);
				resolve();
			});
		} catch (error) {
			server.off("error", onError);
			reject(error);
		}
	});
}
/** Compare two URL paths ignoring a trailing slash. */
function pathMatches(a, b) {
	const strip = (p) => p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
	return strip(a) === strip(b);
}
function isLoopbackHostname(hostname) {
	const h = hostname.replace(/^\[|\]$/g, "");
	return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".localhost") || h.startsWith("127.");
}
/**
* Default origin policy for a localhost dev tool: allow requests with no
* `Origin` header (native, non-browser clients), allow any loopback origin
* (so cross-port localhost dev setups keep working), and allow explicitly
* configured origins. Everything else — a real remote page in the dev's
* browser — is rejected.
*/
function isAllowedOrigin(origin, allowedOrigins) {
	if (!origin) return true;
	if (allowedOrigins.includes(origin)) return true;
	try {
		return isLoopbackHostname(new URL(origin).hostname);
	} catch {
		return false;
	}
}
function isWsOriginRegistry(value) {
	return !!value && !Array.isArray(value);
}
/**
* Route `upgrade` events on a server to the crossws adapter, optionally
* filtered to a single `path`. Non-matching requests are left untouched so
* other upgrade listeners (e.g. a Vite dev server's HMR socket) can claim
* them, unless `destroyUnmatched` is set. Returns a detach function that
* removes the listener.
*/
function routeUpgrades(server, ws, path, destroyUnmatched, allowedOrigins) {
	const listener = (req, socket, head) => {
		socket.on("error", () => {});
		if (path) {
			let pathname = req.url ?? "/";
			try {
				pathname = new URL(req.url ?? "/", "http://localhost").pathname;
			} catch {}
			if (!pathMatches(pathname, path)) {
				if (destroyUnmatched) {
					socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
					socket.destroy();
				}
				return;
			}
		}
		const originAllowed = isWsOriginRegistry(allowedOrigins) ? allowedOrigins.isAllowed(req.headers.origin) : isAllowedOrigin(req.headers.origin, allowedOrigins || []);
		if (allowedOrigins !== false && !originAllowed) {
			socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
			socket.destroy();
			return;
		}
		ws.handleUpgrade(req, socket, head);
	};
	server.on("upgrade", listener);
	return () => server.off("upgrade", listener);
}
/**
* Attach a WebSocket transport to an existing RPC group, powered by
* [crossws](https://crossws.h3.dev). Either attach to an existing HTTP(S)
* `server` (sharing its port, optionally scoped to a `path`), or let this
* helper create a standalone server from `port` / `host` / `https`.
*
* Returns the crossws node adapter, standalone-server readiness/address
* accessors, `detach` (remove the upgrade listener from a shared `server`),
* and `close` (full deterministic teardown).
*/
function attachWsRpcTransport(rpcGroup, options = {}) {
	const { server, port, host = "localhost", path, destroyUnmatched = false, https, allowedOrigins, onConnected = NOOP, onDisconnected = NOOP, definitions = EMPTY_DEFS, serialize: serializeOverride, deserialize: deserializeOverride } = options;
	const states = /* @__PURE__ */ new WeakMap();
	const ws = crossws({ hooks: {
		open: (peer) => {
			const meta = {
				id: sessionId++,
				peer,
				subscribedStates: /* @__PURE__ */ new Set()
			};
			const pendingRequestMethods = /* @__PURE__ */ new Map();
			const state = {
				meta,
				channel: void 0
			};
			const channel = {
				post: (data) => {
					peer.send(data);
				},
				on: (fn) => {
					state.onMessage = fn;
				},
				serialize: serializeOverride ?? ((msg) => {
					let method;
					if (msg.t === "q") method = msg.m;
					else {
						method = pendingRequestMethods.get(msg.i);
						pendingRequestMethods.delete(msg.i);
					}
					if (!(msg.t === "s" && "e" in msg) && !!method && definitions.get(method)?.jsonSerializable === true) return strictJsonStringify(msg, method ?? "");
					return `s:${structuredCloneStringify(msg)}`;
				}),
				deserialize: deserializeOverride ?? ((raw) => {
					const msg = raw.startsWith("s:") ? structuredCloneParse(raw.slice(2)) : JSON.parse(raw);
					if (msg.t === "q" && msg.i && msg.m) pendingRequestMethods.set(msg.i, msg.m);
					return msg;
				}),
				meta
			};
			state.channel = channel;
			states.set(peer, state);
			rpcGroup.updateChannels((channels) => {
				channels.push(channel);
			});
			onConnected(peer, meta);
		},
		message: (peer, message) => {
			states.get(peer)?.onMessage?.(message.text());
		},
		close: (peer) => {
			const state = states.get(peer);
			if (!state) return;
			states.delete(peer);
			rpcGroup.updateChannels((channels) => {
				const index = channels.indexOf(state.channel);
				if (index >= 0) channels.splice(index, 1);
			});
			onDisconnected(peer, state.meta);
		}
	} });
	let detach = NOOP;
	let ready = Promise.resolve();
	let ownedServer;
	if (server) detach = routeUpgrades(server, ws, path, destroyUnmatched, allowedOrigins);
	else if (https) {
		ownedServer = createServer$1(https);
		detach = routeUpgrades(ownedServer, ws, path, true, allowedOrigins);
		ready = listen(ownedServer, port ?? 0, host);
	} else {
		ownedServer = createServer((_req, res) => {
			res.writeHead(426, { "content-type": "text/plain" });
			res.end("Upgrade Required");
		});
		detach = routeUpgrades(ownedServer, ws, path, true, allowedOrigins);
		ready = listen(ownedServer, port ?? 0, host);
	}
	const activeServer = server ?? ownedServer;
	return {
		ws,
		ready,
		address: () => activeServer?.address() ?? null,
		detach,
		async close() {
			detach();
			ws.closeAll(void 0, void 0, true);
			if (ownedServer) {
				const srv = ownedServer;
				await ready.catch(() => {});
				if (!srv.listening) return;
				await new Promise((r) => srv.close(() => r()));
			}
		}
	};
}
//#endregion
export { attachWsRpcTransport, createWsOriginRegistry, isAllowedOrigin, isLoopbackHostname };
