import _ from "lodash-es";

import fields = foundry.data.fields;
import abstract = foundry.abstract;

/** Simplify the given file path, handling .. and . segments */
export function simplifyPath(path: string): string {
    return path.split("/").reduce((segments, current) => {
        if (current === "..") {
            segments.pop();
        } else if (current !== ".") {
            segments.push(current);
        }
        return segments;
    }, [] as string[]).join("/")
}

/** Get the extension of the given file path, and strip query parameters */
export function fileExtension(path: string): string | null {
    const match = path.match(/\.([^\?\n\.\\/]+?)(?:\?.+)?$/);
    const ext = match?.[1];
    if (ext == null || ext == "") {
        throw new Error(`couldn't determine file extension for '${path}'`);
    }
    return ext;
}

export function joinPaths(first: string, second: string): string {
    return first.endsWith("/") ? first + second : first + "/" + second;
}

export interface VisitedField {
    pathStack: string[];
    descriptor: fields.DataField;
    value?: unknown;
}

export function visitFieldsRecursive<T = unknown>(
    fieldDescriptorOrDoc: fields.DataField | typeof abstract.Document,
    fieldValue: T,
    visitor: (field: VisitedField) => void,
    pathStack: string[] = []
) {
    if (fieldValue == null) {
        return fieldValue;
    }

    let fieldDescriptor: fields.DataField = fieldDescriptorOrDoc;
    if ("prototype" in fieldDescriptorOrDoc) {
        if (foundry.utils.isSubclass(fieldDescriptorOrDoc, abstract.Document)) {
            fieldDescriptor = fieldDescriptorOrDoc.schema;
        }
    }

    if (fieldDescriptor instanceof fields.SchemaField) {
        const data = fieldValue as Record<string, unknown>;
        for (const [key, descriptor] of Object.entries(fieldDescriptor.fields)) {
            if (key in data) {
                visitFieldsRecursive(
                    descriptor,
                    data[key],
                    visitor,
                    new Array(...pathStack, key)
                );
            }
        }
        fieldValue;
    } else if (fieldDescriptor instanceof fields.ArrayField) {
        const data = fieldValue as Record<string, unknown>[];
        for (let i = 0; i < data.length; i++) {
            visitFieldsRecursive(
                fieldDescriptor.element,
                data[i],
                visitor,
                new Array(...pathStack, i.toString())
            );
        }
        fieldValue;
    } else {
        visitor({
            pathStack: _.clone(pathStack),
            descriptor: fieldDescriptor,
            value: fieldValue
        }) as T;
    }
}

export async function createDirs(source: string, fullDir: string) {
    let dirs = _.chain(simplifyPath(fullDir).split("/"))
        .filter(segment => segment != "")
        .reduce(
            (parents, segment) => {
                return [
                    ...parents,
                    parents.length == 0 ? segment : joinPaths(parents[parents.length - 1], segment)
                ];
            },
            [] as string[]
        )
        .value();

    for (const dir of dirs) {
        try {
            await FilePicker.createDirectory(source, dir);
        } catch (e) {
            console.error("Error creating directory", e);
        }
    }
}