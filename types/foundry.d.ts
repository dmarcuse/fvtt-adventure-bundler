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

declare class Adventure extends foundry.documents.BaseAdventure { }

declare class SceneNavigation {
    static displayProgressBar(options: { label: string, pct: number }): void;
}

interface SettingConfig<T> {
    key: string;
    namespace: string;
    name: string;
    hint: string;
    scope: "World" | "Client";
    config: boolean;
    type: (...args: any[]) => T;
    default: T;
}

declare class ClientSettings {
    register<T>(
        namespace: string,
        key: string,
        data: Omit<SettingConfig<T>, "key" | "namespace">
    ): void;
}

declare const Hooks: any;
declare const CONFIG: any;
declare const game: {
    user: any;
    packs: any;
    settings: ClientSettings;
};
