import { identifyAssetSources } from "./bundler";
import { classifyAsset, shouldBundleAsset } from "./assets";

// Hooks.once("init", function () {
//     CONFIG.debug.hooks = true;
// });

// Add context menu entry to items in adventure compendiums
Hooks.on('getCompendiumEntryContext', ([html]: [any], entries: any[]) => {
    const compendium = game.packs.get(html.dataset.pack);
    if (compendium?.documentClass === Adventure && game.user.isGM) {
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async ([li]: [any]) => {
                const document = await compendium.getDocument(li.dataset.documentId);
                const assetSources = identifyAssetSources(document);
                console.log("Asset sources", assetSources);
                const toBundle = new Set([...assetSources].filter(
                    source => shouldBundleAsset(classifyAsset(source))
                ));
                console.log("To be included in bundle", toBundle);
            }
        })
    }
});
