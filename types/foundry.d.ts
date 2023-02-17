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
                element: DataField;
            }

            interface DocumentStats {
                coreVersion: string;
                systemId: string;
                systemVersion: string;
                createdTime: number;
                modifiedTime: number;
                lastModifiedBy: string;
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

            static create(
                data: any,
                context?: DocumentModificationContext
            ): Promise<Document>;

            delete(context?: DocumentModificationContext): Promise<this>;

            get id(): string | null;

            _stats: foundry.data.fields.DocumentStats;
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

        function randomID(length?: number): string;
    }

    module packages {
        class BasePackage extends foundry.abstract.DataModel { }
        class BaseModule extends BasePackage {
            protected?: boolean;
            packs?: Set<{ path: string }>
        }
    }
}

declare module ui {
    const notifications: Notifications;
}

declare class Application { }

declare class FilePicker extends Application {
    static upload(
        source: string,
        path: string,
        file: File,
        body?: any,
        options?: { notify: boolean }
    ): Promise<any>;

    static createDirectory(
        source: string,
        target: string,
        options?: any
    ): Promise<any>;
}

declare class FormApplication extends Application { }

interface NotifyOptions {
    permanent: boolean;
    localize: boolean;
    console: boolean;
}

declare class Notifications extends Application {
    notify(message: string, type?: "info" | "warning" | "error", options?: Partial<NotifyOptions>): void;
    info(message: string, options?: Partial<NotifyOptions>): void;
    warn(message: string, options?: Partial<NotifyOptions>): void;
    error(message: string, options?: Partial<NotifyOptions>): void;
}

declare class Adventure extends foundry.documents.BaseAdventure { }

declare class SceneNavigation extends Application {
    static displayProgressBar(options: { label: string, pct: number }): void;
}

declare class Compendium<V extends foundry.abstract.Document> extends Application {
    collection: CompendiumCollection<V>
}

declare type DialogButton = {
    icon?: string,
    label: string,
    callback?: () => void
};

declare type DialogData = {
    title: string;
    content: string;
    buttons: Partial<Record<string, DialogButton>>;
    default?: string;
    render?: (html: HTMLElement) => void,
    close?: (html: HTMLElement) => void,
};

declare class Dialog extends Application {
    constructor(data: DialogData, options?: any);

    render(
        force: boolean,
        options?: {
            left: number,
            top: number,
            width: number,
            height: number,
            scale: number,
            focus: boolean,
            renderContext: string,
            renderData: any
        }
    ): Application;

    static confirm(config?: Partial<DialogData>): Promise<boolean>;
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
    type: new () => FormApplication;
    restricted: boolean;
}

interface DocumentModificationContext {
    parent?: foundry.abstract.Document;
    pack?: string;
    noHook?: boolean;
    index?: boolean;
    indexFields?: string[];
    keepId?: boolean;
    keepEmbeddedIds?: boolean;
    temporary?: boolean;
    render?: boolean;
    renderSheet?: boolean;
    diff?: boolean;
    recursive?: boolean;
    isUndo?: boolean;
    deleteAll?: boolean;
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

declare class Collection<K, V> extends Map<K, V> { }

declare class DocumentCollection<V extends foundry.abstract.Document> extends Collection<string, V> {
    get documentClass(): new () => V;
    getDocument(id: string): Promise<V>;

    collection: string;
}

declare class CompendiumCollection<V extends foundry.abstract.Document> extends DocumentCollection<V> {
    get locked(): boolean;
    metadata: any;
}

declare class Module extends foundry.packages.BaseModule { }

declare const Hooks: any;
declare const CONFIG: any;
declare const game: {
    user: any;
    packs: Collection<string, CompendiumCollection<foundry.abstract.Document>>;
    settings: ClientSettings;
    i18n: Localization;
    modules: Collection<string, Module>;
    version: string;
    system: { id: string, version: string };
};
