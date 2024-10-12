export const isVsCodeTerminal = () => {
    return process.env.TERM_PROGRAM === "vscode"
}
