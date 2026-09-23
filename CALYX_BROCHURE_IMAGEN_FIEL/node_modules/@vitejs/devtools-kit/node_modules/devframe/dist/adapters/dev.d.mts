import { W as DevframeNodeRpcSession, _ as ConnectionMeta, d as McpRouteOptions, p as DevframeAuthHandler, r as DevframeDefinition, u as DevframeWsOptions } from "../devframe-mQ4qZAuo.mjs";
import { n as DevframeNodeRpcSessionMeta } from "../ws-server-uKQcClcJ.mjs";
import { n as StartedServer } from "../server-UHWae43Q.mjs";
import { Peer } from "crossws";
import { H3 } from "h3";
//#region src/adapters/dev.d.ts
interface CreateDevServerOptions {
  /** Bind host. Default: `def.cli?.host ?? 'localhost'`. */
  host?: string;
  /**
   * Port to listen on. When omitted, falls back to
   * {@link resolveDevServerPort}, which respects `def.cli?.port` /
   * `portRange` / `random`.
   */
  port?: number;
  /**
   * Parsed flag bag forwarded to `setup(ctx, { flags })`. The dev
   * server itself only reads `flags.open` from this bag, and only when
   * {@link CreateDevServerOptions.openBrowser} is left undefined.
   */
  flags?: Record<string, unknown>;
  /**
   * Override `def.cli?.distDir`. When neither this option nor
   * `def.cli?.distDir` is set, the dev server runs in **bridge mode** —
   * only `__connection.json` and the WS endpoint are mounted; the SPA
   * is expected to be hosted elsewhere (e.g. by a parent Vite/Nuxt
   * dev server via `viteDevBridge({ devMiddleware })`).
   */
  distDir?: string;
  /**
   * Override the SPA mount path. Defaults to
   * `resolveBasePath(def, 'standalone')` (i.e. `def.basePath` or `/`).
   */
  basePath?: string;
  /**
   * Override how the browser reaches the RPC WebSocket (`def.cli?.ws`).
   * See {@link DevframeWsOptions}: same-server route (default), a dedicated
   * port, or a remote origin.
   */
  ws?: DevframeWsOptions;
  /**
   * h3 app to mount the SPA + connection-meta routes on. When omitted
   * a fresh app is created. Pass a pre-configured app to attach custom
   * middleware (auth, logging, extra static assets) before devframe's
   * own handlers.
   */
  app?: H3;
  /**
   * Auto-open the browser. When `undefined` the resolution falls
   * through to `flags.open` (incl. string path) and finally
   * `def.cli?.open`. `false` disables the open regardless of the other
   * sources; a string opens that relative path.
   */
  openBrowser?: boolean | string;
  /**
   * Override how authentication resolves, taking precedence over
   * `def.cli?.auth`. Pass `false` to skip the gate entirely (the standard
   * choice for a **hosted** deployment where the host manages auth — see
   * {@link viteDevBridge}); a {@link DevframeAuthHandler} to install a custom
   * scheme; or `true` to force devframe's interactive OTP gate on. When
   * omitted, auth resolves from `flags.auth` / `def.cli?.auth` (the standalone
   * default: gated). The `--no-auth` flag (`flags.auth === false`) still forces
   * the gate off regardless of this option.
   */
  auth?: boolean | DevframeAuthHandler;
  /**
   * Expose a route-based MCP server on the dev server (Streamable-HTTP).
   * Overrides `def.cli?.mcp`; `undefined` falls through to it. `false`
   * disables the route regardless of the definition default. See
   * {@link McpRouteOptions}.
   */
  mcp?: boolean | McpRouteOptions;
  /**
   * Called once per new WS connection, right after its session is created.
   * Forwarded verbatim to the underlying `startHttpAndWs`.
   */
  onPeerConnect?: (peer: Peer, session: DevframeNodeRpcSession) => void;
  /**
   * Called once per closed WS connection, right after its session's
   * disconnect bookkeeping runs. Forwarded verbatim to the underlying
   * `startHttpAndWs`.
   */
  onPeerDisconnect?: (peer: Peer, meta: DevframeNodeRpcSessionMeta) => void;
  /**
   * Called once the WS server is bound. Devframe stays headless
   * otherwise — wire this if you want a startup banner.
   */
  onReady?: (info: {
    origin: string;
    port: number;
    app: H3;
  }) => void | Promise<void>;
}
interface ResolveDevServerPortOptions {
  /** Bind host (passed to `get-port-please` for in-use detection). */
  host?: string;
  /** Override the preferred port. Default: `def.cli?.port ?? 9999`. */
  defaultPort?: number;
}
/**
 * Resolve the listening port for {@link createDevServer}, honoring the
 * definition's `cli.port` / `cli.portRange` / `cli.random` settings.
 * Exposed separately so authors who run their own argv parsing can
 * resolve a port up-front (to print it, log it, etc.) before starting
 * the server.
 */
declare function resolveDevServerPort(def: DevframeDefinition, options?: ResolveDevServerPortOptions): Promise<number>;
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
declare function createDevServer(def: DevframeDefinition, options?: CreateDevServerOptions): Promise<StartedServer>;
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
declare function resolveMcpConnectionMeta(def: DevframeDefinition, mcp: boolean | McpRouteOptions | undefined, port?: number): ConnectionMeta['mcp'];
//#endregion
export { CreateDevServerOptions, ResolveDevServerPortOptions, createDevServer, resolveDevServerPort, resolveMcpConnectionMeta };