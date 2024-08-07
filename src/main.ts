import { classifyAsset, getAssetBundlingSettings, findAssetReferences } from "./assets";
import { exportBundleV1 } from "./bundle/v1";
import { importBundle } from "./bundle";
import { registerSettings } from "./settings";
import _ from "lodash-es";

import BaseAdventure = foundry.documents.BaseAdventure;
import Document = foundry.abstract.Document;
import { identifyPremiumCompendiums } from "./util";

Hooks.once("init", function () {
    registerSettings();
});

// Add export button to adventure context menu
Hooks.on("getCompendiumEntryContext", (compendium: Compendium<Document>, entries: any[]) => {
    if (compendium != null && compendium.collection.documentClass === Adventure && game.user.isGM) {
        if (new Set(identifyPremiumCompendiums()).has(compendium.collection.metadata.path)) {
            console.log("Suppressing export button for premium compendium", compendium);
            return;
        }
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async ([li]: [any]) => {
                try {
                    const adventure = await compendium.collection.getDocument(li.dataset.documentId) as BaseAdventure;

                    const assetReferences = findAssetReferences(adventure);
                    const bundlingSettings = getAssetBundlingSettings();
                    const assetsToBundle = _.pickBy(
                        assetReferences,
                        (_, assetPath) => bundlingSettings[classifyAsset(assetPath)]
                    );
                    await exportBundleV1(adventure, assetsToBundle);
                } catch (err) {
                    console.error("Error exporting adventure!", err);
                    const message = err instanceof Error ? err.message : String(err);
                    const localizedMessage = game.i18n.format("ADVENTUREBUNDLER.BundleExportFailed", { message });
                    ui.notifications.error(localizedMessage, { localize: false, console: false, permanent: true });
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
                        ui.notifications.error(localizedMessage, { localize: false, console: false, permanent: true });
                        SceneNavigation.displayProgressBar({
                            label: game.i18n.localize("ADVENTUREBUNDLER.ImportErrorProgressMessage"),
                            pct: 100
                        });
                    }
                }
            });

            picker.click();
        });

        html.querySelector(".header-actions")!.appendChild(importButton);
    }
});
