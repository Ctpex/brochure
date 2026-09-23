import { b as DevframeNodeContext, r as DevframeDefinition } from "../devframe-mQ4qZAuo.mjs";
import "@modelcontextprotocol/server";
//#region src/adapters/mcp/build-server.d.ts
interface CreateMcpServerOptions {
  /**
   * Transport to use. `createMcpServer` itself runs `'stdio'` (a standalone
   * process with its own host context); the Streamable-HTTP transport is
   * served route-based by the dev server instead — see `mountMcpHttp` and
   * the `mcp` option on `createDevServer` / `createCac`'s `--mcp` flag.
   */
  transport?: 'stdio';
  /**
   * Expose shared-state keys as MCP resources.
   * - `true` (default) — every key the host publishes
   * - `false` — none
   * - `(key) => boolean` — filter
   */
  exposeSharedState?: boolean | ((key: string) => boolean);
  /** Override the name reported in the MCP handshake. */
  serverName?: string;
  /** Override the version reported in the MCP handshake. Defaults to `definition.version ?? '0.0.0'`. */
  serverVersion?: string;
  /** Called once the transport is connected. */
  onReady?: (info: {
    transport: 'stdio';
  }) => void;
}
interface McpServerHandle {
  stop: () => Promise<void>;
}
/**
 * Build an MCP server over the agent surface of a devframe definition.
 * Currently supports `stdio` transport only.
 *
 * @experimental The agent-native surface is experimental and may change
 * without a major version bump until it stabilizes.
 */
declare function createMcpServer(definition: DevframeDefinition, options?: CreateMcpServerOptions): Promise<McpServerHandle>;
//#endregion
//#region src/adapters/mcp/fetch.d.ts
interface CreateMcpFetchHandlerOptions {
  /** Name reported in the MCP handshake. */
  serverName: string;
  /** Version reported in the MCP handshake. */
  serverVersion: string;
  /** Expose shared-state keys as MCP resources — see `buildMcpServerFromContext`. */
  exposeSharedState: boolean | ((key: string) => boolean);
  /**
   * Origin allow-list beyond the loopback default. `false` disables the
   * origin gate entirely. Default: loopback-only.
   *
   * Unlike the WS transport, the MCP route does **not** allow `Origin`-less
   * requests: a route-based endpoint is reachable by any local process, so a
   * request must carry an `Origin` that passes the gate. Native clients
   * (e.g. `devframe connect`) send their loopback origin explicitly.
   */
  allowedOrigins?: readonly string[] | false;
}
interface McpFetchHandler {
  /**
   * WHATWG-`fetch` handler for the MCP Streamable-HTTP endpoint. Hand every
   * method (POST/GET/DELETE) on the endpoint's path to it — routing by path
   * is the host's job.
   */
  fetch: (request: Request) => Promise<Response>;
  /** Tear down every live MCP session (closes servers, drops subscriptions). */
  dispose: () => Promise<void>;
}
/**
 * Build a framework-agnostic MCP Streamable-HTTP endpoint over a devframe
 * context: a web-standard `Request → Response` handler any host can mount —
 * h3 (see `mountMcpHttp`), a Next.js App Router route, or any other
 * fetch-shaped server.
 *
 * Each MCP session gets its own {@link WebStandardStreamableHTTPServerTransport}
 * and MCP server (built from the shared, live `ctx` via
 * `buildMcpServerFromContext`), correlated by the `Mcp-Session-Id` header: an
 * `initialize` POST spins up a session; later requests route to it; a `DELETE`
 * (or client disconnect) tears it down. The origin gate guards every request:
 * loopback-default DNS-rebinding protection that — unlike the WS upgrade's
 * `isAllowedOrigin` — also rejects `Origin`-less requests, so a route-based
 * endpoint isn't reachable by an arbitrary local process.
 *
 * @experimental
 */
declare function createMcpFetchHandler(ctx: DevframeNodeContext, options: CreateMcpFetchHandlerOptions): McpFetchHandler;
//#endregion
export { type CreateMcpFetchHandlerOptions, type CreateMcpServerOptions, type McpFetchHandler, type McpServerHandle, createMcpFetchHandler, createMcpServer };