import { classifyAsset, shouldBundleAsset, findAssetReferences } from "./assets";
import { exportBundleV1 } from "./bundle/v1";
import _ from "lodash-es";

// Hooks.once("init", function () {
//     CONFIG.debug.hooks = true;
// });

// Add context menu entry to items in adventure compendiums
Hooks.on("getCompendiumEntryContext", ([html]: [any], entries: any[]) => {
    const compendium = game.packs.get(html.dataset.pack);
    if (compendium?.documentClass === Adventure && game.user.isGM) {
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async ([li]: [any]) => {
                const adventure = await compendium.getDocument(li.dataset.documentId);

                const assetReferences = findAssetReferences(adventure);
                console.log("Identified assets", assetReferences);
                const assetsToBundle = _.pickBy(
                    assetReferences,
                    (_, assetPath) => shouldBundleAsset(classifyAsset(assetPath))
                );
                console.log("Selected assets to bundle", assetsToBundle);

                try {
                    await exportBundleV1(adventure, assetsToBundle);
                } catch (err) {
                    console.error("Error exporting adventure!", err);
                    const message = err instanceof Error ? err.message : String(err);
                    const localizedMessage = game.i18n.format("ADVENTUREBUNDLER.BundleExportFailed", { message });
                    ui.notifications.error(localizedMessage, { localize: false, console: false });
                    SceneNavigation.displayProgressBar({ label: "Failed!", pct: 100 });
                }
            }
        })
    }
});
