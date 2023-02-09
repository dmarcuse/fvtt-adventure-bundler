import MODULE from "../../module/module.json";
import JSZip from "jszip";

const README_CONTENTS = `\
This zip was generated via the ${MODULE.title} (v${MODULE.version}) module for Foundry.
Please install and activate the module in order to import this adventure.

${MODULE.url}
`;

export async function downloadBundle(filename: string, zip: JSZip) {
    zip.file("README.txt", README_CONTENTS);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipBlob);
    try {
        downloadLink.download = filename;
        downloadLink.click();
    } finally {
        URL.revokeObjectURL(downloadLink.href);
    }
}

export function confirmOverwrite(name: string): Promise<"overwrite" | "create_new" | "cancel"> {
    const message = game.i18n.format("ADVENTUREBUNDLER.ImportOverwritePromptMessage", { existing: name });

    return new Promise(resolve => {
        const prompt = new Dialog({
            title: game.i18n.localize("ADVENTUREBUNDLER.ImportOverwritePromptTitle"),
            content: `<p>${message}</p>`,
            buttons: {
                overwrite: {
                    label: game.i18n.localize("ADVENTUREBUNDLER.ImportOverwritePromptOverwriteButton"),
                    callback: () => resolve("overwrite")
                },
                create_new: {
                    label: game.i18n.localize("ADVENTUREBUNDLER.ImportOverwritePromptCreateNewButton"),
                    callback: () => resolve("create_new")
                },
                cancel: {
                    label: game.i18n.localize("ADVENTUREBUNDLER.ImportOverwritePromptCancelButton"),
                    callback: () => resolve("cancel")
                }
            },
            default: "cancel",
            close: () => resolve("cancel")
        });
        prompt.render(true);
    });
}