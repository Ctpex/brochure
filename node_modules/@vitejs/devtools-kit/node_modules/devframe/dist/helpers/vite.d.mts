import { d as McpRouteOptions, p as DevframeAuthHandler, r as DevframeDefinition } from "../devframe-mQ4qZAuo.mjs";
//#region src/helpers/vite.d.ts
interface ViteDevBridgeOptions {
  /**
   * Mount base. Defaults to `def.basePath ?? '/__<id>/'` for this hosted
   * adapter — the devframe shares the origin with the host Vite app.
   *
   * Relative spellings like `'./'` (common for base-agnostic Nuxt builds)
   * are normalized to absolute paths so they compose with Vite's connect
   * router.
   */
  base?: string;
  /**
   * Dev-time middleware mode. When set, the host app owns the SPA and
   * devframe spins up a separate RPC + WS server on a resolved port,
   * registering Vite middleware at `<base>__connection.json` so the
   * host-served SPA can discover the WS endpoint.
   *
   *  - `false` (default) — static-mount the SPA at `base` with SPA
   *    fallback. No RPC server is started.
   *  - `true` — bridge mode with all defaults (port from
   *    {@link resolveDevServerPort}, host from `def.cli?.host`).
   *  - object — bridge mode with explicit overrides.
   */
  devMiddleware?: boolean | {
    /** Override the bridge port. Default: {@link resolveDevServerPort}. */
    port?: number;
    /** Override the bridge bind host. Default: `def.cli?.host ?? 'localhost'`. */
    host?: string;
    /** Flag bag forwarded to `def.setup(ctx, { flags })`. */
    flags?: Record<string, unknown>;
  };
  /**
   * Whether the bridged devframe runs its own auth gate. The side-car RPC
   * server is reachable by anything that can open its socket, so it **gates by
   * default**: when unset, authentication resolves through `createDevServer`
   * (devframe's interactive OTP gate unless the definition's `cli.auth` opts
   * out), and the side-car prints its code/link banner to stdout. Pass a
   * {@link DevframeAuthHandler} to install a custom scheme, or `false` to opt
   * out for a single-user localhost host that owns the trust boundary another
   * way. Only applies in bridge mode (`devMiddleware`); the static-mount mode
   * starts no RPC server.
   *
   * @default gated (devframe's interactive OTP, unless `cli.auth` opts out)
   */
  auth?: boolean | DevframeAuthHandler;
  /**
   * Expose the side-car's route-based MCP server (Streamable-HTTP) and
   * advertise it in the bridge's `__connection.json`. Forwarded to
   * {@link createDevServer}: overrides `def.cli?.mcp`, `undefined` falls
   * through to it, `false` disables the route regardless. Only applies in
   * bridge mode (`devMiddleware`); the static-mount mode starts no server.
   *
   * The endpoint lives on the side-car's own port, so the advertised meta
   * carries `{ port, path }` — see `ConnectionMeta['mcp']`.
   *
   * @experimental
   */
  mcp?: boolean | McpRouteOptions;
}
interface DevframeVitePlugin {
  name: string;
  apply: 'serve';
  configureServer: (server: {
    middlewares: {
      use: (path: string, handler: any) => void;
    };
    httpServer?: {
      once: (event: 'close', cb: () => void) => void;
    } | null;
  }) => void | Promise<void>;
  closeBundle?: () => void | Promise<void>;
}
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
declare function viteDevBridge(d: DevframeDefinition, options?: ViteDevBridgeOptions): DevframeVitePlugin;
//#endregion
export { DevframeVitePlugin, ViteDevBridgeOptions, viteDevBridge };