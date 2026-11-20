import type { Pair, RuntimeResult, SessionState, Snapshot } from "../contracts/model.js";
export interface ControllerPorts {
    loadSnapshot(request: {
        documentId: string;
        revision: string;
        signal: AbortSignal;
    }): Promise<Snapshot>;
    compare(a: Snapshot, b: Snapshot): RuntimeResult;
    onState(state: SessionState): void;
}
export declare function createController(ports: ControllerPorts): {
    select(pair: Pair): Promise<void>;
    dispose(): void;
};
