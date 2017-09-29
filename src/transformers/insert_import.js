"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const ast_helpers_1 = require("./ast_helpers");
const make_transform_1 = require("./make_transform");
function insertImport(sourceFile, symbolName, modulePath) {
    const ops = [];
    // Find all imports.
    const allImports = ast_helpers_1.findAstNodes(null, sourceFile, ts.SyntaxKind.ImportDeclaration);
    const maybeImports = allImports
        .filter((node) => {
        // Filter all imports that do not match the modulePath.
        return node.moduleSpecifier.kind == ts.SyntaxKind.StringLiteral
            && node.moduleSpecifier.text == modulePath;
    })
        .filter((node) => {
        // Filter out import statements that are either `import 'XYZ'` or `import * as X from 'XYZ'`.
        const clause = node.importClause;
        if (!clause || clause.name || !clause.namedBindings) {
            return false;
        }
        return clause.namedBindings.kind == ts.SyntaxKind.NamedImports;
    })
        .map((node) => {
        // Return the `{ ... }` list of the named import.
        return node.importClause.namedBindings;
    });
    if (maybeImports.length) {
        // There's an `import {A, B, C} from 'modulePath'`.
        // Find if it's in either imports. If so, just return; nothing to do.
        const hasImportAlready = maybeImports.some((node) => {
            return node.elements.some((element) => {
                return element.name.text == symbolName;
            });
        });
        if (hasImportAlready) {
            return ops;
        }
        // Just pick the first one and insert at the end of its identifier list.
        ops.push(new make_transform_1.AddNodeOperation(sourceFile, maybeImports[0].elements[maybeImports[0].elements.length - 1], undefined, ts.createImportSpecifier(undefined, ts.createIdentifier(symbolName))));
    }
    else {
        // Create the new import node.
        const namedImports = ts.createNamedImports([ts.createImportSpecifier(undefined, ts.createIdentifier(symbolName))]);
        const importClause = ts.createImportClause(undefined, namedImports);
        const newImport = ts.createImportDeclaration(undefined, undefined, importClause, ts.createLiteral(modulePath));
        if (allImports.length > 0) {
            // Find the last import and insert after.
            ops.push(new make_transform_1.AddNodeOperation(sourceFile, allImports[allImports.length - 1], undefined, newImport));
        }
        else {
            // Insert before the first node.
            ops.push(new make_transform_1.AddNodeOperation(sourceFile, ast_helpers_1.getFirstNode(sourceFile), newImport));
        }
    }
    return ops;
}
exports.insertImport = insertImport;
//# sourceMappingURL=/home/travis/build/angular/angular-cli/src/transformers/insert_import.js.map