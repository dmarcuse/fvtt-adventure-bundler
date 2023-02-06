import { AssetReferences } from "../assets";
import { fileExtension } from "../util";
import { downloadBundle } from "./";
import JSZip from "jszip";
import _ from "lodash-es";

import fetchWithTimeout = foundry.utils.fetchWithTimeout;

export interface BundleV1 {
    bundleVersion: 1;
    adventureData: any;
    bundledAssets: AssetReferences;
}

export function isBundleV1(data: unknown): data is BundleV1 {
    if (typeof data !== "object" || data == null) return false;
    const maybeBundle = data as Partial<BundleV1>;
    return maybeBundle.bundleVersion === 1
        && maybeBundle.adventureData != null
        && maybeBundle.bundledAssets != null;
}

export async function exportBundleV1(
    originalAdventure: foundry.documents.BaseAdventure,
    assetReferences: AssetReferences
) {
    const remappedAssets = new Map(
        Object.keys(assetReferences).map((originalSource, i) => {
            const ext = fileExtension(originalSource);
            return [originalSource, `asset_${i}.${ext}`];
        })
    );
    console.log("Bundled asset mapping table created", remappedAssets);

    const bundleData = originalAdventure.toObject(false);
    for (const [originalSource, newSource] of remappedAssets.entries()) {
        console.log("Updating all paths", originalSource, newSource);
        for (const ref of assetReferences[originalSource]) {
            console.log("Updating path", originalSource, newSource, ref);
            _.set(bundleData, ref, newSource);
        }
    }
    console.log("Updated adventure asset references");

    console.log("Bundling adventure into zip...");
    const zip = new JSZip();
    const json: BundleV1 = {
        bundleVersion: 1,
        adventureData: bundleData,
        bundledAssets: _.mapKeys(
            assetReferences,
            (_, old) => remappedAssets.get(old)
        )
    };
    zip.file("adventure.json", JSON.stringify(json));

    const assetFolder = zip.folder("assets")!;
    const toPack = [...remappedAssets.entries()];
    for (let i = 0; i < toPack.length; i++) {
        const [originalPath, remappedPath] = toPack[i];
        SceneNavigation.displayProgressBar({
            label: `Zipping ${originalPath}...`,
            pct: i / toPack.length
        });
        const assetResponse = await fetchWithTimeout(originalPath);
        assetFolder.file(remappedPath, await assetResponse.blob());
    }
    SceneNavigation.displayProgressBar({ label: "Done!", pct: 100 });

    await downloadBundle(`${originalAdventure.name}.zip`, zip);
}
