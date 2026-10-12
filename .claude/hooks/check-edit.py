#!/usr/bin/env python3
# Nach jeder Änderung an src/*.ts|svelte: npm run check; meldet nur Fehler in der geänderten Datei
# (Fehler aus Dateien paralleler Sitzungen blockieren nicht).
import json, os, subprocess, sys
d = json.load(sys.stdin)
f = (d.get("tool_input") or {}).get("file_path", "")
root = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
rel = os.path.relpath(f, root) if f else ""
if not rel.startswith("src/") or not rel.endswith((".ts", ".svelte")):
    sys.exit(0)
env = dict(os.environ, PATH="/usr/local/bin:" + os.environ.get("PATH", ""))
out = subprocess.run(["npm", "run", "check"], cwd=root, env=env, capture_output=True, text=True).stdout
errs = [l for l in out.splitlines() if " ERROR " in l and f'"{rel}"' in l]
if errs:
    print("svelte-check meldet Fehler in " + rel + ":\n" + "\n".join(errs[:15]), file=sys.stderr)
    sys.exit(2)
