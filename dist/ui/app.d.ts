import type { NodeRenderer } from "./nodes.js";
export type { NodeRenderer } from "./nodes.js";
import type { Engine, Scenario } from "../contracts/model.js";
export declare function mountComparison({ scenarios, defaultScenario, engine, renderers, }: {
    scenarios: readonly Scenario[];
    defaultScenario: Scenario;
    engine: Engine;
    renderers?: Readonly<Record<string, NodeRenderer>>;
}): () => void;
