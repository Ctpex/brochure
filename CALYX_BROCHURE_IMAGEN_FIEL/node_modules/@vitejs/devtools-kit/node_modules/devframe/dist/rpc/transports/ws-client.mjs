import { DEVFRAME_AUTH_TOKEN_QUERY_PARAM } from "../../constants.mjs";
import { n as strictJsonStringify } from "../../serialization-C8Mnw9hK.mjs";
import { n as structuredCloneStringify, t as structuredCloneParse } from "../../structured-clone-CbAV5rFI.mjs";
//#region src/rpc/transports/ws-client.ts
function NOOP() {}
const EMPTY_DEFS = /* @__PURE__ */ new Map();
/**
* Build a birpc `ChannelOptions` object backed by a browser `WebSocket`.
* Pass the result straight to `createRpcClient`'s `channel` option.
*/
function createWsRpcChannel(options) {
	let url = options.url;
	if (options.authToken) url = `${url}?${DEVFRAME_AUTH_TOKEN_QUERY_PARAM}=${encodeURIComponent(options.authToken)}`;
	const ws = new WebSocket(url);
	const { onConnected = NOOP, onError = NOOP, onDisconnected = NOOP, definitions = EMPTY_DEFS } = options;
	ws.addEventListener("open", (e) => {
		onConnected(e);
	});
	ws.addEventListener("error", (e) => {
		const _e = e instanceof Error ? e : new Error(e.type);
		onError(_e);
	});
	ws.addEventListener("close", (e) => {
		onDisconnected(e);
	});
	const pendingRequestMethods = /* @__PURE__ */ new Map();
	return {
		on: (handler) => {
			ws.addEventListener("message", (e) => {
				handler(e.data);
			});
		},
		post: (data) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(data);
				return;
			}
			if (ws.readyState === WebSocket.CONNECTING) {
				const onOpen = () => {
					cleanup();
					if (ws.readyState === WebSocket.OPEN) ws.send(data);
				};
				const onClose = () => cleanup();
				function cleanup() {
					ws.removeEventListener("open", onOpen);
					ws.removeEventListener("close", onClose);
				}
				ws.addEventListener("open", onOpen);
				ws.addEventListener("close", onClose);
				return;
			}
			onError(/* @__PURE__ */ new Error("Devframe WebSocket is not open; message dropped"));
		},
		serialize: (msg) => {
			let method;
			if (msg.t === "q") method = msg.m;
			else {
				method = pendingRequestMethods.get(msg.i);
				pendingRequestMethods.delete(msg.i);
			}
			if (!(msg.t === "s" && "e" in msg) && !!method && definitions.get(method)?.jsonSerializable === true) return strictJsonStringify(msg, method ?? "");
			return `s:${structuredCloneStringify(msg)}`;
		},
		deserialize: (raw) => {
			const msg = raw.startsWith("s:") ? structuredCloneParse(raw.slice(2)) : JSON.parse(raw);
			if (msg.t === "q" && msg.i && msg.m) pendingRequestMethods.set(msg.i, msg.m);
			return msg;
		}
	};
}
//#endregion
export { createWsRpcChannel };
