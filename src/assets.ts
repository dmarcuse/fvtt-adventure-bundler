import { simplifyPath, VisitedField, visitFieldsRecursive } from "./util";
import fields = foundry.data.fields;

export enum AssetType {
    ExternalUrl = "ExternalUrl",
    DataUrl = "DataUrl",
    SystemFile = "SystemFile",
    ModuleFile = "ModuleFile",
    DataFile = "DataFile",
    CoreFile = "CoreFile",
}

// From FilePicker#_inferCurrentDirectory()
const CORE_FILE_DIRS = new Set(["cards", "css", "fonts", "icons", "lang", "scripts", "sounds", "ui"]);
const EXTERNAL_URL_SCHEMES = new Set(["http", "https"]);

export function classifyAsset(source: string): AssetType {
    if (EXTERNAL_URL_SCHEMES.has(source.split(":")[0])) {
        return AssetType.ExternalUrl;
    } else if (source.startsWith("data:")) {
        return AssetType.DataUrl;
    } else {
        const path = simplifyPath(source);
        if (path.startsWith("modules/")) {
            return AssetType.ModuleFile;
        } else if (path.startsWith("systems/")) {
            return AssetType.SystemFile;
        } else if (CORE_FILE_DIRS.has(path.split("/")[0])) {
            return AssetType.CoreFile;
        } else {
            return AssetType.DataFile;
        }
    }
}

export function shouldBundleAsset(type: AssetType): boolean {
    return type === AssetType.DataFile;
}

/**
 * A record where keys are asset paths and values are arrays of arrays
 * representing the paths within the data where the asset was referenced, e.g:
 * 
 * @example
 * {
 *   "my-world/my-actor.webp": [
 *     ["actors", "0", "img"],
 *     ["actors", "0", "prototypeToken", "texture", "src"]
 *   ],
 *   "my-world/cover.webp": [
 *     ["img"]
 *   ]
 * }
 */
export type AssetReferences = Record<string, string[][]>;

/** Extract referenced assets from the given Foundry data, recursively */
export function findAssetReferences(
    data: foundry.abstract.DataModel
): AssetReferences {
    const assetReferences: AssetReferences = {};
    const insertAsset = (assetSource: string, usedBy: string[]) => {
        if (!(assetSource in assetReferences)) {
            assetReferences[assetSource] = [];
        }
        assetReferences[assetSource].push(usedBy);
    };

    visitFieldsRecursive(
        data.schema,
        data.toObject(false),
        ({ pathStack, descriptor, value }) => {
            if (value == null || value === "") {
                return;
            } else if (descriptor instanceof fields.FilePathField) {
                insertAsset(value as string, pathStack);
            } else if (descriptor instanceof fields.StringField
                && descriptor.parent === foundry.documents.BaseJournalEntryPage.schema
                && descriptor.name === "src") {
                insertAsset(value as string, pathStack);
            }
        }
    );

    return assetReferences;
}
