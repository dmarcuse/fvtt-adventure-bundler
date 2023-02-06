declare module foundry {
    module data {
        module fields {
            abstract class DataField {
                name: string;
                parent?: SchemaField;
            }

            class SchemaField extends DataField {
                fields: foundry.abstract.DataSchema;
            }

            class StringField extends DataField { }
            class FilePathField extends StringField { }

            class ArrayField extends DataField {
                element: DataField
            }
        }
    }

    module abstract {
        type DataSchema = Record<string, foundry.data.fields.DataField>;

        abstract class DataModel {
            static schema: foundry.data.fields.SchemaField;
            schema: foundry.data.fields.SchemaField;

            toObject(source?: boolean): {};
        }

        abstract class Document extends DataModel {
            clone(data?: {}): this | Promise<this>;
        }
    }

    module documents {
        abstract class BaseAdventure extends foundry.abstract.Document {
            name: string;
        }
        abstract class BaseJournalEntryPage extends foundry.abstract.Document { }
    }

    module utils {
        function isSubclass(cls: Function, parent: Function): boolean;

        function fetchWithTimeout(
            url: string,
            data?: RequestInit,
            options?: { timeoutMs: number, onTimeout: () => void }
        ): Promise<Response>;
    }
}

declare module ui {
    const notifications: Notifications;
}

declare class Application { }

declare class FormApplication extends Application { }

interface NotifyOptions {
    permanent: boolean;
    localize: boolean;
    console: boolean;
}

declare class Notifications extends Application {
    notify(message: string, type?: "info" | "warning" | "error", options?: Partial<NotifyOptions>): void;
    info(message: string, options?: Partial<NotifyOptions>): void;
    warning(message: string, options?: Partial<NotifyOptions>): void;
    error(message: string, options?: Partial<NotifyOptions>): void;
}

declare class Adventure extends foundry.documents.BaseAdventure { }

declare class SceneNavigation extends Application {
    static displayProgressBar(options: { label: string, pct: number }): void;
}

interface SettingConfig<T> {
    key: string;
    namespace: string;
    name: string;
    hint: string;
    scope: "world" | "client";
    config: boolean;
    requiresReload?: boolean;
    type: (...args: any[]) => T;
    default: T;
    choices?: unknown;
    range?: unknown;
    onChange?: (value: T) => unknown;
}

interface SettingSubmenuConfig {
    name: string;
    label: string;
    hint: string;
    icon: string;
    type: typeof FormApplication;
    restricted: boolean;
}

declare class ClientSettings {
    register<T>(
        namespace: string,
        key: string,
        data: Omit<SettingConfig<T>, "key" | "namespace">
    ): void;

    registerMenu(namespace: string, key: string, data: SettingSubmenuConfig): void;

    get<T>(namespace: string, key: string): T;

    set<T>(namespace: string, key: string, value: T, options?: any): Promise<any>;
}

declare class Localization {
    localize(stringId: string): string;
    format(stringId: string, data?: any): string;
}

declare const Hooks: any;
declare const CONFIG: any;
declare const game: {
    user: any;
    packs: any;
    settings: ClientSettings;
    i18n: Localization;
};
