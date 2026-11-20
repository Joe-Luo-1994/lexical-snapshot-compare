import type { ChangeRecord } from "../contracts/model.js";
export { plain, tokens } from "../core/data.js";
export declare function linkDestinationChanged(r: ChangeRecord): boolean;
export declare function linkChangeName(r: ChangeRecord): "連結目的地變更" | "含連結段落變更";
export declare function navigationLabel(r: ChangeRecord): string;
export declare const verificationCategories: {
    whole: {
        label: string;
        help: string;
        action: string;
    };
    media: {
        label: string;
        help: string;
        action: string;
    };
    unsupported: {
        label: string;
        help: string;
        action: string;
    };
    pairing: {
        label: string;
        help: string;
        action: string;
    };
};
export declare function verification(r: ChangeRecord): import("../contracts/model.js").Verification | null;
export declare function changeReason(r: ChangeRecord): string;
export declare const policyNotices: Readonly<Record<string, string>>;
