import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const indexPath = path.join(distDir, "index.html");
const notFoundPath = path.join(distDir, "404.html");

if (!existsSync(indexPath)) {
  throw new Error(`Expected build output at ${indexPath}`);
}

copyFileSync(indexPath, notFoundPath);
