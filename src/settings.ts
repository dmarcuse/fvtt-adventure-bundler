import { id as namespace } from "../module/module.json";

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

export function registerSettings() {
    IMPORT_ASSET_DIR.register();
}