import { identifyAssetPaths } from "./bundler";

// Hooks.once("init", function () {
//     CONFIG.debug.hooks = true;
// });

async function bundleAdventure(originalAdventure: foundry.documents.BaseAdventure) {
    console.log("Bundling adventure!", originalAdventure);
    console.log(identifyAssetPaths(originalAdventure));

    // First, clone the adventure so we can safely modify it
    // const adventure = await originalAdventure.clone();
}

// Add context menu entry to items in adventure compendiums
Hooks.on('getCompendiumEntryContext', ([html]: [any], entries: any[]) => {
    const compendium = game.packs.get(html.dataset.pack);
    if (compendium?.documentClass === Adventure && game.user.isGM) {
        entries.push({
            name: "ADVENTUREBUNDLER.BundleAdventureButton",
            icon: "<i class='fas fa-download'></i>",
            callback: async ([li]: [any]) => {
                const document = await compendium.getDocument(li.dataset.documentId);
                console.info("Bundling and exporting adventure document", compendium, document);
                await bundleAdventure(document);
            }
        })
    }
});
