import { isAssetField } from "./assets";
import { fileExtension } from "./util";
import JSZip from "jszip";
import MODULE_JSON from "../module/module.json";

import fields = foundry.data.fields;
import abstract = foundry.abstract;
import fetchWithTimeout = foundry.utils.fetchWithTimeout;

export interface VisitedField {
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
        if (foundry.utils.isSubclass(fieldDescriptorOrDoc, abstract.Document)) {
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

export function identifyAssetSources(data: abstract.DataModel): Set<string> {
    const assets = new Set<string>();
    visitFieldsRecursive(data.schema, data.toObject(false), ({ descriptor, value }) => {
        if (isAssetField(descriptor) && value != null && value !== "") {
            assets.add(value as string);
        }
    });
    return assets;
}

const README_CONTENTS = `This zip was generated via the ${MODULE_JSON.title} module for Foundry (v${MODULE_JSON.version}).
Importing it requires you to install and activate the module.
`;

export interface BundlerOptions {
    /** The assets to be included in the bundle. */
    bundleAssets: string[]
}

export async function bundleAdventure(
    originalAdventure: foundry.documents.BaseAdventure,
    { bundleAssets }: BundlerOptions
) {
    const remappedAssets = new Map(
        bundleAssets.map((originalPath, i) => {
            const ext = fileExtension(originalPath);
            return [originalPath, `asset_${i}.${ext}`];
        })
    );
    console.log("Bundled asset mapping table created", remappedAssets);
    const data = originalAdventure.toObject(false);
    visitFieldsRecursive(originalAdventure.schema, data, ({ descriptor, value }) => {
        if (isAssetField(descriptor)) {
            return remappedAssets.get(value as string) ?? value;
        } else {
            return value;
        }
    });

    console.log("Bundling adventure into zip...");
    const zip = new JSZip();
    zip.file("README.txt", README_CONTENTS);
    zip.file("adventure.json", JSON.stringify(data));
    zip.file("assets.json", JSON.stringify(bundleAssets));

    const assetFolder = zip.folder("assets")!;
    for (let i = 0; i < bundleAssets.length; i++) {
        const assetPath = bundleAssets[i];
        SceneNavigation.displayProgressBar({
            label: `Zipping ${assetPath}...`,
            pct: i / bundleAssets.length
        });
        const assetResponse = await fetchWithTimeout(assetPath);
        assetFolder.file(
            remappedAssets.get(assetPath)!,
            await assetResponse.blob()
        );
    }
    SceneNavigation.displayProgressBar({ label: "Done!", pct: 100 });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    console.log("Adventure bundling complete, downloading");
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${originalAdventure.name}.adventure.zip`;
    downloadLink.click();
    console.log("Revoking blob url");
    URL.revokeObjectURL(downloadLink.href);
}
