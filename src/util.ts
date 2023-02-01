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