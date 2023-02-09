import { AssetReferences } from "../assets";
import { fileExtension, joinPaths, createDirs } from "../util";
import { confirmOverwrite, downloadBundle } from "./common";
import { IMPORT_ASSET_DIR } from "../settings";
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
        for (const ref of assetReferences[originalSource]) {
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
    zip.file("bundle.json", JSON.stringify(json));

    const assetFolder = zip.folder("assets")!;
    const toPack = [...remappedAssets.entries()];
    for (let i = 0; i < toPack.length; i++) {
        const [originalPath, remappedPath] = toPack[i];
        SceneNavigation.displayProgressBar({
            label: game.i18n.format("ADVENTUREBUNDLER.ExportProgressMessage", { asset: originalPath }),
            pct: Math.floor((i / toPack.length) * 100)
        });
        const assetResponse = await fetchWithTimeout(originalPath);
        assetFolder.file(remappedPath, await assetResponse.blob());
    }
    SceneNavigation.displayProgressBar({
        label: game.i18n.localize("ADVENTUREBUNDLER.ExportDoneProgressMessage"),
        pct: 100
    });

    await downloadBundle(`${originalAdventure.name}.zip`, zip);
}

export async function importBundleV1(
    bundleData: BundleV1,
    bundle: JSZip,
    compendium: CompendiumCollection<foundry.documents.BaseAdventure>
) {
    const zipAssets = bundle.folder("assets");
    if (zipAssets == null) {
        throw new Error("assets folder missing from bundle!");
    }

    const existing = await compendium.getDocument(bundleData.adventureData._id);
    if (existing != null) {
        switch (await confirmOverwrite(existing.name)) {
            case "cancel":
                ui.notifications.warn("ADVENTUREBUNDLER.ImportCancelled", { localize: true });
                return;
            case "overwrite":
                await existing.delete();
                break;
            case "create_new":
                bundleData.adventureData._id = foundry.utils.randomID();
                break;
        }
    }

    const assetDir = joinPaths(IMPORT_ASSET_DIR.getValue(), bundleData.adventureData._id);
    await createDirs("data", assetDir);
    const bundledAssets = Object.entries(bundleData.bundledAssets);
    for (let i = 0; i < bundledAssets.length; i++) {
        const [originalName, references] = bundledAssets[i];
        SceneNavigation.displayProgressBar({
            label: game.i18n.format("ADVENTUREBUNDLER.ImportProgressMessage", { asset: originalName }),
            pct: Math.floor((i / bundledAssets.length) * 100)
        });

        const assetData = await zipAssets.file(originalName)?.async("blob");
        if (assetData == null) {
            throw new Error(`asset missing from bundle: ${originalName}`);
        }

        const assetPath = joinPaths(assetDir, originalName);
        console.log(`Uploading asset: '${originalName}' to '${assetPath}'`);
        const result = await FilePicker.upload("data", assetDir, new File([assetData], originalName), undefined, { notify: false });
        console.log(`Upload result for ${originalName}`, result);
        for (const reference of references) {
            _.set(bundleData.adventureData, reference, assetPath);
        }
    }

    await Adventure.create(
        bundleData.adventureData,
        {
            pack: compendium.collection,
            keepId: true,
            render: true,
            renderSheet: true
        }
    );

    SceneNavigation.displayProgressBar({
        label: game.i18n.localize("ADVENTUREBUNDLER.ImportDoneProgressMessage"),
        pct: 100
    });
}