#!/usr/bin/env python3
"""Deprecated — use scripts/build-app-icon-assets.py then scripts/generate-app-icons.sh."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    subprocess.check_call([sys.executable, str(ROOT / 'scripts' / 'build-app-icon-assets.py')])
    subprocess.check_call(['bash', str(ROOT / 'scripts' / 'generate-app-icons.sh')])


if __name__ == '__main__':
    main()
