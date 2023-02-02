export function simplifyPath(path: string): string {
    return path.split("/").reduce((segments, current) => {
        if (current === "..") {
            segments.pop()
        } else if (current !== ".") {
            segments.push(current);
        }
        return segments;
    }, [] as string[]).join("/")
}

export function fileExtension(path: string): string | null {
    const match = path.match(/\.([^\?\n\.\\/]+?)(?:\?.+)?$/);
    const ext = match?.[1];
    if (ext == null || ext == "") {
        throw new Error(`couldn't determine file extension for '${path}'`);
    }
    return ext;
}
