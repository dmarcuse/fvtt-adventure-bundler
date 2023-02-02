// import { bundleAndDownload } from "./bundler";
import { classifyAsset, shouldBundleAsset, identifyAssetLocations } from "./assets";
import _ from "lodash-es";
import { bundleAndDownload } from "./bundler";

// Add context menu entry to items in adventure compendiums
Hooks.on('getCompendiumEntryContext', ([html]: [any], entries: any[]) => {
    const compendium = game.packs.get(html.dataset.pack);
    if (compendium?.documentClass === Adventure && game.user.isGM) {
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async ([li]: [any]) => {
                const adventure = await compendium.getDocument(li.dataset.documentId);

                const assetSources = identifyAssetLocations(adventure);
                console.log("Identified assets", assetSources);
                const assetsToBundle = _.pickBy(
                    assetSources,
                    (_, assetPath) => shouldBundleAsset(classifyAsset(assetPath))
                );
                console.log("Selected assets to bundle", assetsToBundle);

                await bundleAndDownload(adventure, { assetLocations: assetsToBundle });
            }
        })
    }
});
