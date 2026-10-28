import * as ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// React Test Renderer does not enforce Fabric's native text-parent invariant.
// Inspect literal JSX too, including invisible {" "} inside hidden modals.
function rawTextOutsideText(source: string, filename = "screen.tsx") {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const failures: string[] = [];
  function visit(node: ts.Node, insideText: boolean) {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const textParent = ts.isJsxFragment(node)
        ? insideText
        : ["Text", "SvgText", "TSpan"].includes(
            node.openingElement.tagName.getText(file),
          );
      for (const child of node.children) {
        const literal =
          ts.isJsxExpression(child) &&
          child.expression &&
          (ts.isStringLiteral(child.expression) ||
            ts.isNumericLiteral(child.expression));
        const jsxText =
          ts.isJsxText(child) &&
          (child.text.trim().length > 0 ||
            (child.text.length > 0 && !/[\r\n]/.test(child.text)));
        if (!textParent && (literal || jsxText)) {
          failures.push(
            `${filename}:${file.getLineAndCharacterOfPosition(child.getStart(file)).line + 1}`,
          );
        }
        visit(child, textParent);
      }
      return;
    }
    ts.forEachChild(node, (child) => visit(child, insideText));
  }
  visit(file, false);
  return failures;
}

function screens(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? screens(file)
      : file.endsWith(".tsx")
        ? [file]
        : [];
  });
}

test("detects invisible spaces and literal text outside native Text, including modal children", () => {
  expect(
    rawTextOutsideText('<Modal><View><Button />{" "}</View></Modal>'),
  ).toHaveLength(1);
  expect(rawTextOutsideText('<View>word{0}{"text"}</View>')).toHaveLength(3);
});

test("allows text, fragments within Text and formatting newlines", () => {
  expect(
    rawTextOutsideText(
      '<View>\n <Text>Hello{" "}<>{"world"}</>{0}</Text>\n</View>',
    ),
  ).toEqual([]);
});

test("photo-studio native routes contain no raw literal JSX text outside Text", () => {
  const files = ["src", "app"].flatMap(screens);
  expect(
    files.flatMap((file) =>
      rawTextOutsideText(
        readFileSync(file, "utf8"),
        relative(process.cwd(), file),
      ),
    ),
  ).toEqual([]);
});
