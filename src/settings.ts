import { id as namespace } from "../module/module.json";
import { AssetType } from "./assets";

export class ModuleSetting<T> {
    readonly config: Readonly<SettingConfig<T>>;

    constructor(config: SettingConfig<T>) {
        this.config = config;
    }

    register() {
        game.settings.register(
            this.config.namespace,
            this.config.key,
            this.config
        );
    }

    getValue(): T {
        return game.settings.get(this.config.namespace, this.config.key);
    }
}

export const IMPORT_ASSET_DIR = new ModuleSetting({
    namespace,
    key: "importAssetDir",
    name: "ADVENTUREBUNDLER.SettingImportAssetDirName",
    hint: "ADVENTUREBUNDLER.SettingImportAssetDirHint",
    scope: "world",
    config: true,
    type: String,
    default: "imported-adventures/assets",
    requiresReload: false,
});

function makeBundleAssetSetting(
    type: AssetType,
    defaultValue: boolean,
    config: boolean = true
): ModuleSetting<boolean> {
    return new ModuleSetting({
        namespace,
        default: defaultValue,
        key: `bundleAsset${type}`,
        name: `ADVENTUREBUNDLER.SettingBundle${type}Name`,
        hint: `ADVENTUREBUNDLER.SettingBundle${type}Hint`,
        scope: "world",
        config,
        type: Boolean,
        requiresReload: false,
    });
}

export const BUNDLE_CORE_ASSETS = makeBundleAssetSetting(AssetType.CoreFile, false, false);
export const BUNDLE_SYSTEM_ASSETS = makeBundleAssetSetting(AssetType.SystemFile, false, false);
export const BUNDLE_MODULE_ASSETS = makeBundleAssetSetting(AssetType.ModuleFile, false);
export const BUNDLE_DATA_ASSETS = makeBundleAssetSetting(AssetType.DataFile, true);
export const BUNDLE_EXTERNAL_URL_ASSETS = makeBundleAssetSetting(AssetType.ExternalUrl, false, false);
export const BUNDLE_DATA_URL_ASSETS = makeBundleAssetSetting(AssetType.DataUrl, false, false);

export function registerSettings() {
    IMPORT_ASSET_DIR.register();

    BUNDLE_DATA_ASSETS.register();
    BUNDLE_MODULE_ASSETS.register();
    BUNDLE_SYSTEM_ASSETS.register();
    BUNDLE_CORE_ASSETS.register();
    BUNDLE_EXTERNAL_URL_ASSETS.register();
    BUNDLE_DATA_URL_ASSETS.register();
}