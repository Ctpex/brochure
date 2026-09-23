import { v as RpcFunctionDefinitionAny } from "./types-CnJSgRVa.mjs";
import { Peer } from "crossws";
import { BirpcGroup, ChannelOptions } from "birpc";
import { NodeAdapter } from "crossws/adapters/node";
import { Server } from "node:http";
import { Server as Server$1, ServerOptions } from "node:https";
import { AddressInfo } from "node:net";
//#region src/rpc/transports/ws-server.d.ts
interface DevframeNodeRpcSessionMeta {
  id: number;
  /** The crossws peer backing this session's socket. */
  peer?: Peer;
  clientAuthToken?: string;
  isTrusted?: boolean;
  subscribedStates: Set<string>;
  /**
   * Streams this session has subscribed to via
   * `rpc.streaming.subscribe(channel, id)`. Tracked here for O(1) cleanup
   * on disconnect; the wire format is `${channel}\x1F${id}`.
   */
  subscribedStreams?: Set<string>;
  /**
   * Inbound streams this session is currently uploading to (via
   * `rpc.streaming.upload(channel, id)`). Tracked for cleanup on
   * disconnect; same wire format as `subscribedStreams`.
   */
  uploadingStreams?: Set<string>;
}
interface WsRpcTransportOptions {
  /**
   * Attach to an existing HTTP(S) server, sharing its port. Combine with
   * `path` to bind the WS endpoint to a single route so it coexists with
   * other upgrade handlers on the same server (e.g. a Vite dev server's HMR
   * socket). The shared server's lifecycle is owned by the caller — closing
   * this transport detaches the upgrade listener without closing the server.
   */
  server?: Server | Server$1;
  /**
   * Port for the standalone WebSocket server. Defaults to `0`, which lets the
   * operating system assign an available port.
   */
  port?: number;
  /** Host for the standalone WebSocket server. Defaults to `localhost`. */
  host?: string;
  /**
   * Restrict the WS endpoint to a single upgrade route (e.g. `/__devframe_ws`). When
   * sharing a `server`, non-matching upgrade requests are left untouched for
   * other listeners to handle, so devframe's socket can sit alongside
   * framework sockets (Vite HMR, etc.).
   */
  path?: string;
  /**
   * Destroy upgrade requests that don't match `path` instead of leaving them
   * for other listeners. Enable this when devframe owns the shared server
   * outright (nothing else handles its upgrades), so an off-route client is
   * rejected promptly rather than left hanging. Default: `false`
   * (coexist-friendly); servers this transport creates itself always
   * destroy unmatched upgrades.
   */
  destroyUnmatched?: boolean;
  /** When set, a new https.Server is created and the WS endpoint is attached to it. */
  https?: ServerOptions;
  /**
   * Extra origins to accept on the WS upgrade beyond the loopback default.
   * Add your LAN/tunnel origin here when reaching the tool from another host.
   * Pass `false` to disable origin checking entirely (not recommended).
   * Default: loopback-only.
   */
  allowedOrigins?: readonly string[] | WsOriginRegistry | false;
  /**
   * RPC function definitions, used by the per-call wire serializer to
   * dispatch between strict-JSON and structured-clone encoding based
   * on each function's `jsonSerializable` flag.
   *
   * When omitted, all messages fall back to structured-clone — safe but
   * loses dev-time validation for `jsonSerializable: true` declarations.
   */
  definitions?: ReadonlyMap<string, Pick<RpcFunctionDefinitionAny, 'jsonSerializable'>>;
  onConnected?: (peer: Peer, meta: DevframeNodeRpcSessionMeta) => void;
  onDisconnected?: (peer: Peer, meta: DevframeNodeRpcSessionMeta) => void;
  /** Override the default per-call serializer. Most callers should leave this unset. */
  serialize?: ChannelOptions['serialize'];
  /** Override the default per-call deserializer. Most callers should leave this unset. */
  deserialize?: ChannelOptions['deserialize'];
}
interface CreateWsOriginRegistryOptions {
  /** Origins allowed before any external viewers are registered. */
  allowedOrigins?: readonly string[];
  /** Additional validation to run after the registration token is verified. */
  validateOrigin?: (origin: string) => boolean;
}
interface WsOriginRegistry {
  /** Registration token to include in connection metadata. */
  readonly token: string;
  /** Read and register an origin from a connection bootstrap URL. */
  registerFromUrl: (url: string) => string | undefined;
  /** Check whether an origin is currently allowed. */
  isAllowed: (origin: string | undefined) => boolean;
}
/**
 * Create a live, token-protected origin allowlist for external browser
 * viewers. Pass it to {@link WsRpcTransportOptions.allowedOrigins}, then use
 * `registerFromUrl()` in the connection metadata handler to authorize a
 * viewer without sharing a mutable array or disabling DNS-rebinding protection.
 */
declare function createWsOriginRegistry(options?: CreateWsOriginRegistryOptions): WsOriginRegistry;
interface WsRpcTransport {
  /**
   * The crossws node adapter driving the socket — exposes the connected
   * `peers` and pub/sub. See https://crossws.h3.dev.
   */
  ws: NodeAdapter;
  /** Resolves when the transport-owned server is listening. */
  ready: Promise<void>;
  /** Returns the bound address, or `null` when the server is not listening. */
  address: () => AddressInfo | string | null;
  /** Remove the upgrade listener from a shared `server` (a no-op otherwise). */
  detach: () => void;
  /**
   * Tear the transport down deterministically: detach from a shared server,
   * force-terminate every connected peer, and close any server this
   * transport created itself (`port` / `https` modes).
   */
  close: () => Promise<void>;
}
declare function isLoopbackHostname(hostname: string): boolean;
/**
 * Default origin policy for a localhost dev tool: allow requests with no
 * `Origin` header (native, non-browser clients), allow any loopback origin
 * (so cross-port localhost dev setups keep working), and allow explicitly
 * configured origins. Everything else — a real remote page in the dev's
 * browser — is rejected.
 */
declare function isAllowedOrigin(origin: string | undefined, allowedOrigins: readonly string[]): boolean;
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
declare function attachWsRpcTransport<ClientFunctions extends object, ServerFunctions extends object>(rpcGroup: BirpcGroup<ClientFunctions, ServerFunctions, false>, options?: WsRpcTransportOptions): WsRpcTransport;
//#endregion
export { WsRpcTransportOptions as a, isAllowedOrigin as c, WsRpcTransport as i, isLoopbackHostname as l, DevframeNodeRpcSessionMeta as n, attachWsRpcTransport as o, WsOriginRegistry as r, createWsOriginRegistry as s, CreateWsOriginRegistryOptions as t };