export const appendLines = (text: string, search: string, lines: string[]) => {
    return text.replace(search, [search, ...lines].join("\n"))
}
