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
    let bundleData: any;
    try {
        bundleData = JSON.parse(bundleJson);
    } catch (cause) {
        throw new Error("invalid format: couldn't parse bundle.json", { cause });
    }

    if (isBundleV1(bundleData)) {
        await importBundleV1(bundleData, zip, compendium);
    } else {
        throw new Error("unsupported bundle - is the module up to date?");
    }
}
