import { Ft as InferCliFlags, It as defineCliFlags, Lt as parseCliFlags, Pt as CliFlagsSchema } from "../devframe-mQ4qZAuo.mjs";
import { CacHandle, CreateCacOptions, createCac } from "./cac.mjs";
//#region src/adapters/cli.d.ts
/** @deprecated Use `createCac` from `devframe/adapters/cac` instead. */
declare const createCli: typeof createCac;
/** @deprecated Use `CreateCacOptions` from `devframe/adapters/cac` instead. */
type CreateCliOptions = CreateCacOptions;
/** @deprecated Use `CacHandle` from `devframe/adapters/cac` instead. */
type CliHandle = CacHandle;
//#endregion
export { type CliFlagsSchema, CliHandle, CreateCliOptions, type InferCliFlags, createCli, defineCliFlags, parseCliFlags };