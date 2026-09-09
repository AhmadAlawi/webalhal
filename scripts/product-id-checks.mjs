import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const sourcePath = path.resolve("src/lib/product-id.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const moduleShim = { exports: {} };
new Function("exports", "module", outputText)(moduleShim.exports, moduleShim);

const { dedupeProductsByProductId, normalizeProductId } = moduleShim.exports;

assert.equal(normalizeProductId(1), 304, "old productId 1 should normalize to 304");
assert.equal(normalizeProductId(304), 304, "current productId 304 should remain 304");
assert.equal(normalizeProductId(""), "", "blank ProductSelect value should remain blank");

const products = [{ productId: 304, name: "Tomato" }];
const selectedValue = normalizeProductId(1);
const selectedProduct = products.find((p) => p.productId === selectedValue);

assert.equal(selectedValue, 304, "selected option value should stay on current productId");
assert.ok(selectedProduct, "matched product should not be undefined");

const duplicateMappedProducts = [18, 31].map((id) => ({
  productId: normalizeProductId(id),
}));
const uniqueProducts = dedupeProductsByProductId(duplicateMappedProducts);

assert.deepEqual(
  duplicateMappedProducts.map((p) => p.productId),
  [334, 334],
  "old productIds 18 and 31 should both normalize to 334",
);
assert.equal(uniqueProducts.length, 1, "duplicate normalized productIds should render once");
assert.equal(uniqueProducts[0]?.productId, 334, "deduped product should keep current productId 334");

console.log("product-id checks passed");
