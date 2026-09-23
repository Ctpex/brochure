import { b as DevframeNodeContext, p as DevframeAuthHandler } from "../devframe-mQ4qZAuo.mjs";
import "../index-b64Uuhy2.mjs";
//#region src/recipes/interactive-auth.d.ts
interface CreateInteractiveAuthOptions {
  /**
   * Static, pre-shared bearer tokens that are always trusted — for CI runs
   * or shared machines where the interactive code prompt would only get in
   * the way. Checked in both the handshake handler and the connect-time
   * hook, alongside tokens minted by a real code exchange.
   */
  clientAuthTokens?: string[];
  /**
   * Print the current code + magic-link URL. Devframe stays headless, so
   * there is no default banner printed automatically — call
   * `auth.printBanner()` yourself once the server is listening. Override
   * this to customize the format; defaults to a small boxed message on
   * stdout.
   */
  banner?: (info: {
    code: string;
    url: string;
  }) => void;
  /**
   * The base URL the magic link should point at. Defaults to
   * `context.host.resolveOrigin()`.
   */
  serverUrl?: () => string;
}
/**
 * Package the interactive OTP auth protocol devframe's primitives
 * (`exchangeTempAuthCode`, `verifyAuthToken`, `revokeAuthToken`,
 * `getTempAuthCode`, `buildOtpAuthUrl`) implement into a ready-made
 * {@link DevframeAuthHandler} — the handshake RPC functions, the resolver
 * gate, the connect-time trust hook, and the startup banner.
 *
 * The auth storage stays internal to this handler — callers never reach into
 * `devframe/node/hub-internals` themselves.
 *
 * ```ts
 * import { createInteractiveAuth } from 'devframe/recipes/interactive-auth'
 *
 * const auth = createInteractiveAuth(ctx)
 * auth.rpcFunctions.forEach(fn => ctx.rpc.register(fn))
 * auth.printBanner()
 *
 * // wire `auth.authorize` / `auth.onConnect` into your transport, or pass
 * // the whole handler to `startHttpAndWs({ auth, ... })`.
 * ```
 */
declare function createInteractiveAuth(context: DevframeNodeContext, options?: CreateInteractiveAuthOptions): DevframeAuthHandler;
//#endregion
export { CreateInteractiveAuthOptions, createInteractiveAuth };