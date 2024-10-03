import path from "node:path"

export const toPosix = (path_: string) => {
    return path.posix.join(...path_.split(path.sep))
}
