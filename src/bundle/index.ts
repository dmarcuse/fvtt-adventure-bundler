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
