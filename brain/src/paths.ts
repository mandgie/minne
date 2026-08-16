import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Where the brain keeps auth.json and config.json. Overridable for tests
 * (and dev sandboxes) via MINNE_APP_SUPPORT_DIR.
 */
export function appSupportDir(): string {
  const override = process.env["MINNE_APP_SUPPORT_DIR"];
  if (override && override !== "") return override;
  return join(homedir(), "Library", "Application Support", "Minne");
}
