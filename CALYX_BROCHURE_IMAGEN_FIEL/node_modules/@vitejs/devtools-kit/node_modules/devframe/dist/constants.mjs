//#region src/constants.ts
const DEVFRAME_MOUNT_PATH = "/__devframe/";
const DEVFRAME_MOUNT_PATH_NO_TRAILING_SLASH = "/__devframe";
const DEVFRAME_DIRNAME = "__devframe";
const DEVFRAME_CONNECTION_META_FILENAME = "__connection.json";
/**
* Global key holding the serializable connection prepared by
* `setupDevframeConnection()`. External viewers can use this key to read the
* connection from another JavaScript realm.
*/
const DEVFRAME_CONNECTION_KEY = "__DEVFRAME_CONNECTION__";
/**
* Route the WebSocket RPC endpoint is bound to, relative to a devframe's
* base path. Sits next to `__connection.json` so the deployed SPA can reach
* it on the same origin it loaded from — the dev server shares one port for
* both HTTP and WS, and a host server (Vite, etc.) can mount the WS upgrade
* handler here without colliding with its own routes (HMR, asset serving).
*/
const DEVFRAME_WS_ROUTE = "__devframe_ws";
/**
* Route the Streamable-HTTP MCP endpoint is bound to, relative to a
* devframe's base path. Sits next to `__connection.json` and the WS route
* so an MCP client reaches it on the same origin the SPA loaded from — the
* dev server shares one port for HTTP, WS, and MCP. Opt-in via `cli.mcp`.
*/
const DEVFRAME_MCP_ROUTE = "__mcp";
const DEVFRAME_RPC_DUMP_MANIFEST_FILENAME = "__rpc-dump/index.json";
const DEVFRAME_DOCK_IMPORTS_FILENAME = "__client-imports.js";
const DEVFRAME_DOCK_IMPORTS_VIRTUAL_ID = "/__devframe-client-imports.js";
const DEVFRAME_RPC_DUMP_DIRNAME = "__rpc-dump";
/**
* URL fragment / query parameter name carrying the remote dock
* connection descriptor (defined as `RemoteConnectionInfo` in
* `@vitejs/devtools-kit`) injected into remote-UI iframe dock URLs.
*/
const REMOTE_CONNECTION_KEY = "devframe-remote-connection";
/**
* Page-URL **fragment** parameter carrying a one-time authentication code (OTP)
* for "magic link" auth. A host can print a link like
* `<origin>/#devframe_otp=<code>`; the client reads the code, exchanges it for a
* token, and strips the parameter from the URL. The code rides the fragment
* (never the query string) so the browser never transmits it to the server,
* keeping it out of access logs and `Referer` headers. See `buildOtpAuthUrl`
* (node) and the `authenticateWithUrlOtp` / `consumeOtpFromUrl` client utilities
* (or `connectDevframe`'s `otpParam`).
*/
const DEVFRAME_OTP_URL_PARAM = "devframe_otp";
/**
* WS upgrade-URL query parameter carrying a previously-issued bearer token.
* Set by `createWsRpcChannel` (browser transport) whenever `authToken` is
* passed; read at connect time by a host's connect-time trust hook (see
* `recipes/interactive-auth`'s `onConnect`) so a returning client can be
* trusted before its own `anonymous:devframe:auth` handshake call arrives.
*/
const DEVFRAME_AUTH_TOKEN_QUERY_PARAM = "devframe_auth_token";
/** External viewer origin requested during connection bootstrap. */
const DEVFRAME_VIEWER_ORIGIN_QUERY_PARAM = "devframe_viewer_origin";
/** Token that authorizes an external viewer origin registration. */
const DEVFRAME_VIEWER_ORIGIN_TOKEN_QUERY_PARAM = "devframe_viewer_origin_token";
/**
* Prefix that marks an RPC method as callable before a connection is
* trusted. This is the *only* rule the pre-trust gate applies — there is no
* per-method allowlist. Any handshake method a host adapter needs to reach
* before authentication must be named `anonymous:<rest>` (e.g.
* `anonymous:devframe:auth`).
*/
const ANONYMOUS_RPC_PREFIX = "anonymous:";
/**
* Whether `name` is callable before a connection is trusted, i.e. it starts
* with {@link ANONYMOUS_RPC_PREFIX}. Used by the resolver gate in
* `startHttpAndWs` (via an `authorize` function) and by host adapters that
* implement their own transport.
*/
function isAnonymousRpcMethod(name) {
	return name.startsWith(ANONYMOUS_RPC_PREFIX);
}
//#endregion
export { ANONYMOUS_RPC_PREFIX, DEVFRAME_AUTH_TOKEN_QUERY_PARAM, DEVFRAME_CONNECTION_KEY, DEVFRAME_CONNECTION_META_FILENAME, DEVFRAME_DIRNAME, DEVFRAME_DOCK_IMPORTS_FILENAME, DEVFRAME_DOCK_IMPORTS_VIRTUAL_ID, DEVFRAME_MCP_ROUTE, DEVFRAME_MOUNT_PATH, DEVFRAME_MOUNT_PATH_NO_TRAILING_SLASH, DEVFRAME_OTP_URL_PARAM, DEVFRAME_RPC_DUMP_DIRNAME, DEVFRAME_RPC_DUMP_MANIFEST_FILENAME, DEVFRAME_VIEWER_ORIGIN_QUERY_PARAM, DEVFRAME_VIEWER_ORIGIN_TOKEN_QUERY_PARAM, DEVFRAME_WS_ROUTE, REMOTE_CONNECTION_KEY, isAnonymousRpcMethod };
