import { n as JsonRenderView, t as DevframeJsonRenderSpec } from "../types-CC2-FD2H.mjs";
import { Diagnostic } from "nostics";
import { DevframeNodeContext, DevframeScopedNodeContext } from "devframe/types";
//#region src/node/create-view.d.ts
/** Options for {@link createJsonRenderView}. */
interface CreateJsonRenderViewOptions {
  /**
   * Stable, author-supplied id, unique within the view's scope. Forms the
   * shared-state key `devframe:json-render:<scope>:<id>` and never changes
   * across updates, so a client keeps its subscription across reconnects.
   */
  id: string;
  /** The initial spec. */
  spec: DevframeJsonRenderSpec;
  /**
   * Override the scope segment of the view's stable id. Defaults to the
   * context's namespace when created from a scoped context, otherwise
   * `'global'`.
   */
  scope?: string;
  /**
   * Human-facing label published in the view index and used by a multi-view
   * frontend (e.g. the standalone SPA's view switcher) to name this view.
   * Defaults to {@link CreateJsonRenderViewOptions.id}.
   */
  title?: string;
}
type AnyContext = DevframeNodeContext | DevframeScopedNodeContext<string>;
/**
 * Create a JSON-render view bound to a devframe context. Registers a
 * server-side shared state (patches enabled) carrying the live spec + state,
 * validates element props at ingress against the base catalog, and returns a
 * handle plus the serializable {@link JsonRenderView.ref} a client subscribes
 * through.
 *
 * @example
 * ```ts
 * const view = createJsonRenderView(ctx, { id: 'metrics', spec })
 * view.update(nextSpec)
 * view.patchState([{ op: 'replace', path: '/count', value: 3 }])
 * view.dispose()
 * ```
 */
declare function createJsonRenderView(ctx: AnyContext, options: CreateJsonRenderViewOptions): JsonRenderView;
//#endregion
//#region src/node/diagnostics.d.ts
interface ReporterOptions {
  method?: 'log' | 'warn' | 'error';
}
declare function jsonRenderReporter(d: Diagnostic, { method }?: ReporterOptions): void;
declare const diagnostics: import("nostics").Diagnostics<{
  readonly DF0038: {
    readonly why: (p: {
      id: string;
      key: string;
      issues: string;
    }) => string;
    readonly fix: "Match the element props to the base catalog's prop schema for that component. See the component reference for the expected shape.";
  };
  readonly DF0039: {
    readonly why: (p: {
      id: string;
      scope: string;
    }) => string;
    readonly fix: "Give each view a stable id unique within its scope, or dispose the previous view before recreating it.";
  };
  readonly DF0040: {
    readonly why: (p: {
      id: string;
    }) => string;
    readonly fix: "Create a fresh view with `createJsonRenderView` instead of reusing a disposed handle.";
  };
  readonly DF0041: {
    readonly why: (p: {
      id: string;
      reason: string;
    }) => string;
    readonly fix: "Specs and state travel as strict JSON — remove functions, symbols, class instances, Map/Set, or circular references.";
  };
}, readonly [typeof jsonRenderReporter]>;
//#endregion
export { type CreateJsonRenderViewOptions, createJsonRenderView, diagnostics as jsonRenderDiagnostics };