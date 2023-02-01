import { simplifyPath } from "./util";
import fields = foundry.data.fields;

export function isAssetField(descriptor: fields.DataField): boolean {
    if (descriptor instanceof fields.FilePathField) {
        return true;
    }

    if (descriptor instanceof fields.StringField
        && descriptor.parent === foundry.documents.BaseJournalEntryPage.schema
        && descriptor.name === "src") {
        return true;
    }

    return false;
}

export const enum AssetType {
    ExternalUrl,
    DataUrl,
    SystemFile,
    ModuleFile,
    DataFile,
    CoreFile,
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