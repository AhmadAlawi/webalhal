import { rmSync } from "node:fs";

/** Remove dev-only typegen output so `next build` does not read a half-written routes.d.ts */
try {
  rmSync(".next/dev", { recursive: true, force: true });
} catch {
  /* ignore */
}
