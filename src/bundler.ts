import { AssetLocations, identifyAssetLocations } from "./assets";
import { fileExtension } from "./util";
import JSZip from "jszip";
import MODULE_JSON from "../module/module.json";
import _ from "lodash-es";

import fetchWithTimeout = foundry.utils.fetchWithTimeout;

const README_CONTENTS = `This zip was generated via the ${MODULE_JSON.title} module for Foundry (v${MODULE_JSON.version}).
Importing it requires you to install and activate the module.
`;

export interface BundlerOptions {
    /** The assets to be included in the bundle. */
    assetLocations: AssetLocations
}

export async function bundleAndDownload(
    originalAdventure: foundry.documents.BaseAdventure,
    { assetLocations }: BundlerOptions
) {
    const remappedAssets = new Map(
        Object.keys(assetLocations).map((originalSource, i) => {
            const ext = fileExtension(originalSource);
            return [originalSource, `asset_${i}.${ext}`];
        })
    );
    console.log("Bundled asset mapping table created", remappedAssets);

    const bundleData = originalAdventure.toObject(false);
    for (const [originalSource, newSource] of remappedAssets.entries()) {
        console.log("Updating all paths", originalSource, newSource);
        for (const ref of assetLocations[originalSource]) {
            console.log("Updating path", originalSource, newSource, ref);
            _.set(bundleData, ref, newSource);
        }
    }
    console.log("Updated adventure asset references");

    console.log("Bundling adventure into zip...");
    const zip = new JSZip();
    zip.file("README.txt", README_CONTENTS);
    zip.file("adventure.json", JSON.stringify(bundleData));
    zip.file("assets.json", JSON.stringify(
        _.mapKeys(
            assetLocations,
            (_, old) => remappedAssets.get(old)
        )
    ));

    const assetFolder = zip.folder("assets")!;
    const toPack = Object.keys(remappedAssets);
    for (let i = 0; i < toPack.length; i++) {
        const assetPath = toPack[i];
        SceneNavigation.displayProgressBar({
            label: `Zipping ${assetPath}...`,
            pct: i / toPack.length
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
