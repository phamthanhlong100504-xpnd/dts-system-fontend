"""Read-only comparison with the UI accepted after Spacing v10. No dependencies."""
from pathlib import Path
import hashlib
import json
import sys


def main():
    root = Path(__file__).resolve().parent.parent
    baseline = json.loads((root / "docs/simulations/ui-accepted-v10.json").read_text(encoding="utf-8"))
    changed = []
    for item in baseline["files"]:
        name = item["path"]
        relative = Path(name)
        if relative.is_absolute() or ".." in relative.parts or not name.startswith("src/"):
            raise ValueError("Unsafe baseline path")
        path = root / relative
        if not path.is_file() or path.is_symlink():
            changed.append(name)
            continue
        data = path.read_bytes().decode("utf-8-sig").replace("\r\n", "\n").encode("utf-8")
        if hashlib.sha256(data).hexdigest() != item["sha256"]:
            changed.append(name)
    print(json.dumps({"UiBaselineUnchanged": not changed, "FilesChecked": len(baseline["files"]),
                      "ChangedOrMissing": changed, "BackendEndToEndAccepted": False}, indent=2))
    return 1 if changed else 0


if __name__ == "__main__":
    sys.exit(main())
