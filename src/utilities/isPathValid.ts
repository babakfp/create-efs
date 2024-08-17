// Helper function to check for valid folder names across all OS
const isValidFolderName = (name: string) => {
    // Regular expression for invalid characters
    const invalidChars = /[<>:"/\\|?*\u0000-\u001F]/

    // Check for invalid characters
    if (invalidChars.test(name)) {
        return false
    }

    // Check for invalid ending (space or period on Windows)
    if (/(\.|\s)$/.test(name)) {
        return false
    }

    // Check if the name is a reserved Windows name
    const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
    if (reservedWindowsNames.test(name)) {
        return false
    }

    // The folder name is valid
    return true
}

export const isPathValid = (path: string) => {
    const regex = /^(?:\.{1,2})(?:\/(?:[^\s\/:*?"<>|]+(?:\/)?)*)?$/

    if (!regex.test(path)) {
        return false
    }

    const parts = path.split("/")

    for (const part of parts) {
        if (part === "." || part === "..") {
            continue
        }
        if (!isValidFolderName(part)) {
            return false
        }
    }

    return true
}
