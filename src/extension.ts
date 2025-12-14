import * as vscode from 'vscode'

/**
 * Box drawing characters for different styles
 */
interface BoxChars {
    topLeft: string
    topRight: string
    bottomLeft: string
    bottomRight: string
    horizontal: string
    vertical: string
}

/**
 * Available box styles with their corresponding characters
 */
const BOX_STYLES: Record<string, BoxChars> = {
    unicode: {
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        horizontal: '═',
        vertical: '║'
    },
    ascii: {
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+',
        horizontal: '-',
        vertical: '|'
    },
    rounded: {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│'
    },
    heavy: {
        topLeft: '┏',
        topRight: '┓',
        bottomLeft: '┗',
        bottomRight: '┛',
        horizontal: '━',
        vertical: '┃'
    }
}

/**
 * Returns the comment prefix for the given language ID
 * @param languageId The VS Code language identifier
 * @returns The comment prefix (e.g., "//", "#", "--")
 */
function getCommentPrefix(languageId: string): string {
    switch (languageId) {
        case 'javascript':
        case 'typescript':
        case 'javascriptreact':
        case 'typescriptreact':
        case 'java':
        case 'c':
        case 'cpp':
        case 'csharp':
        case 'objective-c':
        case 'go':
        case 'rust':
        case 'jsonc':
        case 'swift':
        case 'kotlin':
        case 'php':
        case 'dart':
            return '//'
        case 'python':
        case 'shellscript':
        case 'yaml':
        case 'dockerfile':
        case 'makefile':
        case 'perl':
        case 'ruby':
        case 'powershell':
        case 'r':
        case 'elixir':
            return '#'
        case 'sql':
        case 'lua':
        case 'haskell':
        case 'ada':
            return '--'
        case 'clojure':
        case 'lisp':
        case 'scheme':
            return ';;'
        case 'tex':
        case 'latex':
        case 'matlab':
            return '%'
        case 'bat':
            return 'REM'
        default:
            return '#'
    }
}

/**
 * Validates and normalizes configuration values
 * @param lineWidth The configured line width
 * @param paddingCharacter The configured padding character
 * @returns Normalized configuration object
 */
function validateConfiguration(lineWidth: number, paddingCharacter: string): {
    lineWidth: number
    paddingCharacter: string
} {
    // Validate line width
    let normalizedWidth = lineWidth
    if (!Number.isInteger(normalizedWidth) || normalizedWidth < 10) {
        normalizedWidth = 80
        vscode.window.showWarningMessage(
            `Invalid line width: ${lineWidth}. Using default value: 80`
        )
    }
    if (normalizedWidth > 200) {
        normalizedWidth = 200
        vscode.window.showWarningMessage(
            `Line width too large: ${lineWidth}. Using maximum value: 200`
        )
    }

    // Validate padding character
    let normalizedPadding = paddingCharacter
    if (!normalizedPadding || normalizedPadding.length === 0) {
        normalizedPadding = '-'
        vscode.window.showWarningMessage(
            'Empty padding character. Using default: "-"'
        )
    }
    if (normalizedPadding.length > 1) {
        normalizedPadding = normalizedPadding.charAt(0)
        vscode.window.showWarningMessage(
            `Padding character too long: "${paddingCharacter}". Using first character: "${normalizedPadding}"`
        )
    }

    return {
        lineWidth: normalizedWidth,
        paddingCharacter: normalizedPadding
    }
}

/**
 * Builds a string of the form
 * <PREFIX> --------------- TITLE ---------------
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param fill The character to use for padding
 * @param prefix The comment prefix to use
 * @returns The formatted banner string
 */
function buildBanner(text: string, width: number, fill: string, prefix: string): string {
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim()

    // Handle empty text - create a simple line
    if (cleanText.length === 0) {
        const prefixStr = `${prefix} `
        const suffixStr = ` ${prefix}`
        const bodyWidth = width - prefixStr.length * 2
        const body = fill.repeat(Math.max(0, bodyWidth))
        return `${prefixStr}${body}${suffixStr}`
    }

    const core = ` ${cleanText} ` // Add spaces around the text
    const prefixStr = `${prefix} `
    const suffixStr = ` ${prefix}`
    const targetBodyWidth = width - prefixStr.length * 2

    // Check if text is too long for the specified width
    if (core.length >= targetBodyWidth) {
        // If text is too long, truncate it properly
        const availableSpace = Math.max(1, targetBodyWidth)
        const truncatedCore = core.substring(0, availableSpace)
        return `${prefixStr}${truncatedCore}${suffixStr}`
    }

    // Calculate padding for perfect centering
    const totalPadding = targetBodyWidth - core.length
    const leftPadding = Math.floor(totalPadding / 2)
    const rightPadding = totalPadding - leftPadding

    const body = fill.repeat(leftPadding) + core + fill.repeat(rightPadding)
    return `${prefixStr}${body}${suffixStr}`
}

/**
 * Builds a box-style banner comment with a frame around the text
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param boxStyle The style of box to use (unicode, ascii, rounded, heavy)
 * @param prefix The comment prefix to use
 * @returns The formatted box banner string (multiple lines)
 */
function buildBoxBanner(text: string, width: number, boxStyle: string, prefix: string): string {
    const chars = BOX_STYLES[boxStyle] || BOX_STYLES.unicode
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim()

    const prefixStr = `${prefix} `
    const suffixStr = ` ${prefix}`
    const innerWidth = width - prefixStr.length * 2 - 2 // -2 for left and right border chars

    // Ensure minimum width for the text
    const effectiveInnerWidth = Math.max(innerWidth, 1)

    // Build top line: // ╔════════════════════════════════════╗
    const topLine = `${prefixStr}${chars.topLeft}${chars.horizontal.repeat(effectiveInnerWidth)}${chars.topRight}${suffixStr}`

    // Build middle line with centered text: // ║         TEXT         ║
    let middleContent: string
    if (cleanText.length === 0) {
        middleContent = ' '.repeat(effectiveInnerWidth)
    } else if (cleanText.length >= effectiveInnerWidth) {
        // Text too long, truncate it
        middleContent = cleanText.substring(0, effectiveInnerWidth)
    } else {
        // Center the text
        const totalPadding = effectiveInnerWidth - cleanText.length
        const leftPad = Math.floor(totalPadding / 2)
        const rightPad = totalPadding - leftPad
        middleContent = ' '.repeat(leftPad) + cleanText + ' '.repeat(rightPad)
    }
    const middleLine = `${prefixStr}${chars.vertical}${middleContent}${chars.vertical}${suffixStr}`

    // Build bottom line: // ╚════════════════════════════════════╝
    const bottomLine = `${prefixStr}${chars.bottomLeft}${chars.horizontal.repeat(effectiveInnerWidth)}${chars.bottomRight}${suffixStr}`

    return `${topLine}\n${middleLine}\n${bottomLine}`
}

/**
 * Extension activation function. Called the first time a command from the extension is run.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    // Register the command bannerComment.make and bind it to the makeBanner function.
    const disposable = vscode.commands.registerCommand(
        'bannerComment.make',
        makeBanner
    )

    context.subscriptions.push(disposable)
}

/**
 * Extension deactivation function. Called when VS Code is shut down
 * or the extension is uninstalled/disabled.
 */
export function deactivate() {}

/**
 * Main command function.
 * Gets the selected text from the active editor and replaces it with a banner.
 */
function makeBanner() {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showWarningMessage('No active text editor.')
        return
    }

    const configuration = vscode.workspace.getConfiguration('bannerComment')
    const rawLineWidth = configuration.get<number>('lineWidth', 80)
    const rawPaddingCharacter = configuration.get<string>('paddingCharacter', '-')
    const bannerStyle = configuration.get<string>('style', 'simple')
    const boxStyle = configuration.get<string>('boxStyle', 'unicode')

    // Validate and normalize configuration
    const { lineWidth, paddingCharacter } = validateConfiguration(rawLineWidth, rawPaddingCharacter)

    // Determine comment prefix based on language
    const languageId = editor.document.languageId
    const commentPrefix = getCommentPrefix(languageId)

    // Process all selections in a single edit operation for better undo support
    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        const line = editor.document.lineAt(editor.selection.active.line)
        const rawText = line.text;
        const trimmedText = rawText.trim()

        if (trimmedText.length === 0) {
            // Skip empty selections
            return
        }

        // Create banner based on selected style
        let banner: string
        if (bannerStyle === 'box') {
            banner = buildBoxBanner(trimmedText, lineWidth, boxStyle, commentPrefix)
        } else {
            banner = buildBanner(trimmedText, lineWidth, paddingCharacter, commentPrefix)
        }

        editBuilder.replace(line.range, banner)
    }).then((success) => {
        if (!success) {
            vscode.window.showErrorMessage('Failed to create banner comment.')
        }
    })
}
