import JSZip from "jszip";
import { importBundleV1, isBundleV1 } from "./v1";

export async function importBundle(
    file: File,
    compendium: CompendiumCollection<foundry.documents.BaseAdventure>
) {
    const zip = await JSZip.loadAsync(file);
    const bundleJson = await zip.file("bundle.json")?.async("string");
    if (bundleJson == null) {
        throw new Error("invalid format: bundle.json file missing");
    }
    const bundleData = JSON.parse(bundleJson);

    if (isBundleV1(bundleData)) {
        await importBundleV1(bundleData, zip, compendium);
    }
}
