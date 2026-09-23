import { Nt as EventsMap, jt as EventEmitter } from "../devframe-mQ4qZAuo.mjs";
//#region src/utils/events.d.ts
/**
 * Create event emitter.
 */
declare function createEventEmitter<Events extends EventsMap>(): EventEmitter<Events>;
//#endregion
export { createEventEmitter };