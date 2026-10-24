#!/usr/bin/env python3
"""
Root Desktop Launcher for RAG Evaluation Cockpit (AI-04).
Run this script to launch the application as a native desktop software:
    python run_desktop.py
"""
import sys
import subprocess
import pathlib

ROOT = pathlib.Path(__file__).parent.resolve()
VENV_PY = ROOT / "backend" / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / ("python.exe" if sys.platform == "win32" else "python")
DESKTOP_APP = ROOT / "desktop" / "app.py"

if __name__ == "__main__":
    py_bin = str(VENV_PY) if VENV_PY.exists() else sys.executable
    print(f"[RAG Doctor] Launching desktop application using: {py_bin}")
    sys.exit(subprocess.call([py_bin, str(DESKTOP_APP)]))
