import { classifyAsset, shouldBundleAsset, findAssetReferences } from "./assets";
import { exportBundleV1 } from "./bundle/v1";
import { importBundle } from "./bundle";
import { registerSettings } from "./settings";
import _ from "lodash-es";

import BaseAdventure = foundry.documents.BaseAdventure;
import { identifyPremiumCompendiums } from "./util";

Hooks.once("init", function () {
    registerSettings();
});

// Add export button to adventure context menu
Hooks.on("getCompendiumEntryContext", ([html]: [any], entries: any[]) => {
    const compendium = game.packs.get(html.dataset.pack);
    if (compendium != null && compendium.documentClass === Adventure && game.user.isGM) {
        if (new Set(identifyPremiumCompendiums()).has(compendium.metadata.path)) {
            console.log("Suppressing export button for premium compendium", compendium);
            return;
        }
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async ([li]: [any]) => {
                try {
                    const adventure = await compendium.getDocument(li.dataset.documentId) as BaseAdventure;

                    const assetReferences = findAssetReferences(adventure);
                    const assetsToBundle = _.pickBy(
                        assetReferences,
                        (_, assetPath) => shouldBundleAsset(classifyAsset(assetPath))
                    );
                    await exportBundleV1(adventure, assetsToBundle);
                } catch (err) {
                    console.error("Error exporting adventure!", err);
                    const message = err instanceof Error ? err.message : String(err);
                    const localizedMessage = game.i18n.format("ADVENTUREBUNDLER.BundleExportFailed", { message });
                    ui.notifications.error(localizedMessage, { localize: false, console: false });
                    SceneNavigation.displayProgressBar({
                        label: game.i18n.localize("ADVENTUREBUNDLER.ExportErrorProgressMessage"),
                        pct: 100
                    });
                }
            }
        })
    }
});

// Add import button to adventure compendiums
Hooks.on("renderCompendium", (
    compendium: Compendium<foundry.abstract.Document>,
    [html]: [HTMLElement]
) => {
    if (compendium.collection.documentClass === Adventure && game.user.isGM && !compendium.collection.locked) {
        const importIcon = document.createElement("i");
        importIcon.classList.add("fa-solid", "fa-upload");
        const importLabel = game.i18n.localize("ADVENTUREBUNDLER.UnbundleAdventureButton");
        const importButton = document.createElement("button");
        importButton.type = "button";
        importButton.appendChild(importIcon);
        importButton.appendChild(document.createTextNode(importLabel));
        const footer = html.querySelector("footer");

        importButton.addEventListener("click", async (event) => {
            event.preventDefault();
            const picker = document.createElement("input");
            picker.type = "file";
            picker.accept = ".zip";

            picker.addEventListener("change", async (event) => {
                const bundleFile = picker.files?.[0];
                if (bundleFile != null) {
                    try {
                        await importBundle(bundleFile, compendium.collection as CompendiumCollection<BaseAdventure>);
                    } catch (err) {
                        const message = err instanceof Error ? err.message : String(err);
                        const localizedMessage = game.i18n.format("ADVENTUREBUNDLER.BundleImportFailed", { message });
                        ui.notifications.error(localizedMessage, { localize: false, console: false });
                        SceneNavigation.displayProgressBar({
                            label: game.i18n.localize("ADVENTUREBUNDLER.ImportErrorProgressMessage"),
                            pct: 100
                        });
                    }
                }
            });

            picker.click();
        });

        footer!.appendChild(importButton);
    }
});
