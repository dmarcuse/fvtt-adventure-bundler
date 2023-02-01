import fields = foundry.data.fields;
import abstract = foundry.abstract;

interface VisitedField {
    descriptor: fields.DataField;
    value?: unknown;
}

function visitFieldsRecursive<T = unknown>(
    fieldDescriptorOrDoc: fields.DataField | typeof abstract.Document,
    fieldValue: T,
    visitor: (field: VisitedField) => unknown
): T {
    if (fieldValue == null) {
        return fieldValue;
    }

    let fieldDescriptor: fields.DataField = fieldDescriptorOrDoc;
    if ("prototype" in fieldDescriptorOrDoc) {
        if (fieldDescriptorOrDoc.prototype instanceof abstract.Document || fieldDescriptorOrDoc === abstract.Document) {
            fieldDescriptor = fieldDescriptorOrDoc.schema;
        }
    }

    if (fieldDescriptor instanceof fields.SchemaField) {
        const data = fieldValue as Record<string, unknown>;
        for (const [key, descriptor] of Object.entries(fieldDescriptor.fields)) {
            if (key in data) {
                data[key] = visitFieldsRecursive(descriptor, data[key], visitor);
            }
        }
        return fieldValue;
    } else if (fieldDescriptor instanceof fields.ArrayField) {
        const data = fieldValue as Record<string, unknown>[];
        for (let i = 0; i < data.length; i++) {
            data[i] = visitFieldsRecursive(fieldDescriptor.element, data[i], visitor);
        }
        return fieldValue;
    } else {
        return visitor({
            descriptor: fieldDescriptor,
            value: fieldValue
        }) as T;
    }
}

export function identifyAssetPaths(data: abstract.DataModel): Set<string> {
    const assets = new Set<string>();
    visitFieldsRecursive(data.schema, data.toObject(false), ({ descriptor, value }) => {
        if (descriptor instanceof fields.FilePathField && value != null) {
            assets.add(value as string);
        }
    });
    return assets;
}
