/**
 * This is a postinstall script required for the project to work.
 * Package 'uuid' that is required by @langchain/core is exporting
 * the .mjs wrapper in a wrong way, unsupported by metro bundler
 * that Expo is using.
 *
 * Hopefully this will be fixed in the next versions of uuid/langchain.
 */

const fs = require("fs");
const path = require("path");

async function fixUuidPackage(filePath) {
  const f = await fs.promises.open(filePath, "r+");
  const buf = await f.readFile({ encoding: "utf8" });

  let didFix = false;
  if (buf.startsWith("import uuid from")) {
    const newContent =
      "import * as uuid from" + buf.substring("import uuid from".length);

    await f.truncate();
    await f.write(newContent, 0, "utf8");
    didFix = true;
  }

  await f.close();
  return didFix;
}

(async () => {
  try {
    const projectRoot = path.join(process.cwd(), "..", "..");
    const files = fs.promises.glob(
      path.join("**", "node_modules", "**", "uuid", "wrapper.mjs"),
      { cwd: projectRoot },
    );
    for await (const filePath of files) {
      const fixed = await fixUuidPackage(path.join(projectRoot, filePath));
      if (fixed) {
        console.log(`Fixed uuid package at '${filePath}' successfully.`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("Fixing uuid packages failed: ", error);
    process.exit(1);
  }
})();
