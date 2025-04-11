export const appendLines = (text: string, search: string, lines: string[]) => {
    return text.replace(search, [search, ...lines].join("\n"))
}

export const prependLines = (text: string, search: string, lines: string[]) => {
    return text.replace(search, [...lines, search].join("\n"))
}
