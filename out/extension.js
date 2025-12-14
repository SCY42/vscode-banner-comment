"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = require("vscode");
/**
 * Available box styles with their corresponding characters
 */
var BOX_STYLES = {
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
};
/**
 * Returns the comment prefix for the given language ID
 * @param languageId The VS Code language identifier
 * @returns The comment prefix (e.g., "//", "#", "--")
 */
function getCommentPrefix(languageId) {
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
            return '//';
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
            return '#';
        case 'sql':
        case 'lua':
        case 'haskell':
        case 'ada':
            return '--';
        case 'clojure':
        case 'lisp':
        case 'scheme':
            return ';;';
        case 'tex':
        case 'latex':
        case 'matlab':
            return '%';
        case 'bat':
            return 'REM';
        default:
            return '#';
    }
}
/**
 * Validates and normalizes configuration values
 * @param lineWidth The configured line width
 * @param paddingCharacter The configured padding character
 * @returns Normalized configuration object
 */
function validateConfiguration(lineWidth, paddingCharacter) {
    // Validate line width
    var normalizedWidth = lineWidth;
    if (!Number.isInteger(normalizedWidth) || normalizedWidth < 10) {
        normalizedWidth = 80;
        vscode.window.showWarningMessage("Invalid line width: ".concat(lineWidth, ". Using default value: 80"));
    }
    if (normalizedWidth > 200) {
        normalizedWidth = 200;
        vscode.window.showWarningMessage("Line width too large: ".concat(lineWidth, ". Using maximum value: 200"));
    }
    // Validate padding character
    var normalizedPadding = paddingCharacter;
    if (!normalizedPadding || normalizedPadding.length === 0) {
        normalizedPadding = '-';
        vscode.window.showWarningMessage('Empty padding character. Using default: "-"');
    }
    if (normalizedPadding.length > 1) {
        normalizedPadding = normalizedPadding.charAt(0);
        vscode.window.showWarningMessage("Padding character too long: \"".concat(paddingCharacter, "\". Using first character: \"").concat(normalizedPadding, "\""));
    }
    return {
        lineWidth: normalizedWidth,
        paddingCharacter: normalizedPadding
    };
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
function buildBanner(text, width, fill, prefix) {
    var cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    // Handle empty text - create a simple line
    if (cleanText.length === 0) {
        var prefixStr_1 = "".concat(prefix, " ");
        var suffixStr_1 = " ".concat(prefix);
        var bodyWidth = width - prefixStr_1.length * 2;
        var body_1 = fill.repeat(Math.max(0, bodyWidth));
        return "".concat(prefixStr_1).concat(body_1).concat(suffixStr_1);
    }
    var core = " ".concat(cleanText, " "); // Add spaces around the text
    var prefixStr = "".concat(prefix, " ");
    var suffixStr = " ".concat(prefix);
    var targetBodyWidth = width - prefixStr.length * 2;
    // Check if text is too long for the specified width
    if (core.length >= targetBodyWidth) {
        // If text is too long, truncate it properly
        var availableSpace = Math.max(1, targetBodyWidth);
        var truncatedCore = core.substring(0, availableSpace);
        return "".concat(prefixStr).concat(truncatedCore).concat(suffixStr);
    }
    // Calculate padding for perfect centering
    var totalPadding = targetBodyWidth - core.length;
    var leftPadding = Math.floor(totalPadding / 2);
    var rightPadding = totalPadding - leftPadding;
    var body = fill.repeat(leftPadding) + core + fill.repeat(rightPadding);
    return "".concat(prefixStr).concat(body).concat(suffixStr);
}
/**
 * Builds a box-style banner comment with a frame around the text
 * @param text The text to put in the banner
 * @param width The total width of the banner line
 * @param boxStyle The style of box to use (unicode, ascii, rounded, heavy)
 * @param prefix The comment prefix to use
 * @returns The formatted box banner string (multiple lines)
 */
function buildBoxBanner(text, width, boxStyle, prefix) {
    var chars = BOX_STYLES[boxStyle] || BOX_STYLES.unicode;
    var cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    var prefixStr = "".concat(prefix, " ");
    var suffixStr = " ".concat(prefix);
    var innerWidth = width - prefixStr.length * 2 - 2; // -2 for left and right border chars
    // Ensure minimum width for the text
    var effectiveInnerWidth = Math.max(innerWidth, 1);
    // Build top line: // ╔════════════════════════════════════╗
    var topLine = "".concat(prefixStr).concat(chars.topLeft).concat(chars.horizontal.repeat(effectiveInnerWidth)).concat(chars.topRight).concat(suffixStr);
    // Build middle line with centered text: // ║         TEXT         ║
    var middleContent;
    if (cleanText.length === 0) {
        middleContent = ' '.repeat(effectiveInnerWidth);
    }
    else if (cleanText.length >= effectiveInnerWidth) {
        // Text too long, truncate it
        middleContent = cleanText.substring(0, effectiveInnerWidth);
    }
    else {
        // Center the text
        var totalPadding = effectiveInnerWidth - cleanText.length;
        var leftPad = Math.floor(totalPadding / 2);
        var rightPad = totalPadding - leftPad;
        middleContent = ' '.repeat(leftPad) + cleanText + ' '.repeat(rightPad);
    }
    var middleLine = "".concat(prefixStr).concat(chars.vertical).concat(middleContent).concat(chars.vertical).concat(suffixStr);
    // Build bottom line: // ╚════════════════════════════════════╝
    var bottomLine = "".concat(prefixStr).concat(chars.bottomLeft).concat(chars.horizontal.repeat(effectiveInnerWidth)).concat(chars.bottomRight).concat(suffixStr);
    return "".concat(topLine, "\n").concat(middleLine, "\n").concat(bottomLine);
}
/**
 * Extension activation function. Called the first time a command from the extension is run.
 * @param context The extension context provided by VS Code.
 */
function activate(context) {
    // Register the command bannerComment.make and bind it to the makeBanner function.
    var disposable = vscode.commands.registerCommand('bannerComment.make', makeBanner);
    context.subscriptions.push(disposable);
}
/**
 * Extension deactivation function. Called when VS Code is shut down
 * or the extension is uninstalled/disabled.
 */
function deactivate() { }
/**
 * Main command function.
 * Gets the selected text from the active editor and replaces it with a banner.
 */
function makeBanner() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active text editor.');
        return;
    }
    var configuration = vscode.workspace.getConfiguration('bannerComment');
    var rawLineWidth = configuration.get('lineWidth', 80);
    var rawPaddingCharacter = configuration.get('paddingCharacter', '-');
    var bannerStyle = configuration.get('style', 'simple');
    var boxStyle = configuration.get('boxStyle', 'unicode');
    // Validate and normalize configuration
    var _a = validateConfiguration(rawLineWidth, rawPaddingCharacter), lineWidth = _a.lineWidth, paddingCharacter = _a.paddingCharacter;
    // Determine comment prefix based on language
    var languageId = editor.document.languageId;
    var commentPrefix = getCommentPrefix(languageId);
    // Process all selections in a single edit operation for better undo support
    editor.edit(function (editBuilder) {
        var line = editor.document.lineAt(editor.selection.active.line);
        var rawText = line.text;
        var trimmedText = rawText.trim();
        if (trimmedText.length === 0) {
            // Skip empty selections
            return;
        }
        // Create banner based on selected style
        var banner;
        if (bannerStyle === 'box') {
            banner = buildBoxBanner(trimmedText, lineWidth, boxStyle, commentPrefix);
        }
        else {
            banner = buildBanner(trimmedText, lineWidth, paddingCharacter, commentPrefix);
        }
        editBuilder.replace(line.range, banner);
    }).then(function (success) {
        if (!success) {
            vscode.window.showErrorMessage('Failed to create banner comment.');
        }
    });
}
