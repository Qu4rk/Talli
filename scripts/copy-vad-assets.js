const fs = require("fs");
const path = require("path");

const copies = [
  {
    from: "node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx",
    to: "public/silero_vad_v5.onnx",
  },
  {
    from: "node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx",
    to: "public/silero_vad.onnx",
  },
  {
    from: "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
    to: "public/vad.worklet.bundle.min.js",
  },
];

// Copy all .wasm files from onnxruntime-web
const ortDir = "node_modules/onnxruntime-web/dist";
if (fs.existsSync(ortDir)) {
  fs.readdirSync(ortDir)
    .filter((f) => f.endsWith(".wasm"))
    .forEach((f) => copies.push({ from: path.join(ortDir, f), to: path.join("public", f) }));
}

let copiedCount = 0;
for (const { from, to } of copies) {
  if (fs.existsSync(from)) {
    const destDir = path.dirname(to);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(from, to);
    console.log(`✓ Copied ${path.basename(from)} → ${to}`);
    copiedCount++;
  } else {
    console.warn(`⚠ Source not found: ${from}`);
  }
}

console.log(`\nSuccessfully synced ${copiedCount} VAD & WASM assets to public/`);
