import { classifyAsset, getAssetBundlingSettings, findAssetReferences } from "./assets";
import { exportBundleV1 } from "./bundle/v1";
import { importBundle } from "./bundle";
import { registerSettings } from "./settings";
import { pickBy } from "lodash-es"

import BaseAdventure = foundry.documents.BaseAdventure;
import Document = foundry.abstract.Document;
import { identifyPremiumCompendiums } from "./util";

Hooks.once("init", function () {
    registerSettings();
});

function isAdventureCompendium(compendium: Compendium<Document> | null): compendium is Compendium<Adventure> {
    return compendium?.collection?.documentClass === Adventure ||
        compendium?.collection?.documentClass?.prototype instanceof Adventure;
}

// Add export button to adventure context menu
function addExportContextMenuEntryHook(compendium: Compendium<Document>, entries: any[]) {
    if (isAdventureCompendium(compendium) && game.user.isGM) {
        if (new Set(identifyPremiumCompendiums()).has(compendium.collection.metadata.path)) {
            console.log("Suppressing export button for premium compendium", compendium);
            return;
        }
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async (maybeLi: HTMLLIElement | [HTMLLIElement]) => {
                // Foundry V13 passes an HTMLElement directly, but in older
                // versions it may be wrapped in a jquery wrapper that can be
                // unwrapped as if it were an array
                let li: HTMLLIElement;
                if (Symbol.iterator in maybeLi) {
                    [li] = maybeLi;
                } else {
                    li = maybeLi;
                }
                try {
                    // documentId when <= V12, entryId when >= V13
                    const id = li.dataset.documentId ?? li.dataset.entryId!;
                    const adventure = await compendium.collection.getDocument(id);
                    const assetReferences = findAssetReferences(adventure);
                    const bundlingSettings = getAssetBundlingSettings();
                    const assetsToBundle = pickBy(
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
}

Hooks.on("getCompendiumEntryContext", addExportContextMenuEntryHook); // <= V12
Hooks.on("getAdventureContextOptions", addExportContextMenuEntryHook);// >= V13

// Add import button to adventure compendiums
Hooks.on("renderCompendium", (
    compendium: Compendium<Document>,
    maybeHtml: HTMLElement | [HTMLElement]
) => {
    // Foundry V13 passes an HTMLElement directly, but in older versions it may
    // be wrapped in a jquery wrapper that can be unwrapped as if it were an array
    let html: HTMLElement;
    if (Symbol.iterator in maybeHtml) {
        [html] = maybeHtml;
    } else {
        html = maybeHtml;
    }

    if (isAdventureCompendium(compendium) && game.user.isGM && !compendium.collection.locked) {
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
                        await importBundle(bundleFile, compendium.collection);
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
