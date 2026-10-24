"""
RAG Evaluation Cockpit — Desktop Launcher
Starts the integrated FastAPI server serving the UI & evaluation engine,
then opens a pywebview native desktop window (with browser fallback).
"""
import os
import sys
import time
import subprocess
import pathlib
import urllib.request

ROOT_DIR = pathlib.Path(__file__).parent.parent
DIST_DIR = ROOT_DIR / "frontend" / "dist"
BACKEND_DIR = ROOT_DIR / "backend"
APP_TITLE = "RAG Evaluation Cockpit (AI-04)"
PORT = 8000

# Ensure venv site-packages are in sys.path if running under external python
venv_site_packages = (
    BACKEND_DIR / ".venv" / "Lib" / "site-packages"
    if os.name == "nt"
    else BACKEND_DIR / ".venv" / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages"
)
if venv_site_packages.exists() and str(venv_site_packages) not in sys.path:
    sys.path.insert(0, str(venv_site_packages))


def find_free_port(start: int) -> int:
    import socket
    for p in range(start, start + 50):
        try:
            with socket.socket() as s:
                s.bind(("127.0.0.1", p))
                return p
        except OSError:
            continue
    return start


def get_python_executable() -> str:
    venv_py = BACKEND_DIR / ".venv" / ("Scripts" if os.name == "nt" else "bin") / ("python.exe" if os.name == "nt" else "python")
    if venv_py.exists():
        return str(venv_py)
    return sys.executable


def start_backend(port: int) -> subprocess.Popen:
    py_exec = get_python_executable()
    env = os.environ.copy()
    env["MOCK"] = env.get("MOCK", "1")
    return subprocess.Popen(
        [
            py_exec,
            "-m",
            "uvicorn",
            "ragdoctor.api.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_for_server(url: str, timeout: float = 8.0) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(f"{url}/api/runs/run-demo-eval-001", timeout=0.5):
                return True
        except Exception:
            time.sleep(0.15)
    return False


def launch():
    if not DIST_DIR.exists():
        print(f"[desktop] dist/ not found at {DIST_DIR}. Building frontend first...")
        subprocess.run(["npm", "run", "build"], cwd=str(ROOT_DIR / "frontend"), shell=True, check=True)

    # Check if a backend is already active on PORT
    server = None
    default_url = f"http://127.0.0.1:{PORT}"
    if wait_for_server(default_url, timeout=0.8):
        print(f"[desktop] Connected to active backend server at {default_url}")
        url = default_url
    else:
        port = find_free_port(PORT)
        url = f"http://127.0.0.1:{port}"
        print(f"[desktop] Starting backend server at {url}...")
        server = start_backend(port)
        if not wait_for_server(url, timeout=10.0):
            print(f"[desktop] Warning: Server at {url} took longer to start.")

    try:
        import webview
        print(f"[desktop] Launching native pywebview window ({APP_TITLE})...")
        window = webview.create_window(
            APP_TITLE,
            url,
            width=1440,
            height=900,
            min_size=(1200, 700),
            resizable=True,
        )
        webview.start()
    except ImportError as e:
        print(f"[desktop] pywebview not available ({e}) — falling back to system browser at {url}.")
        import webbrowser
        time.sleep(0.3)
        webbrowser.open(url)
        if server:
            try:
                server.wait()
            except KeyboardInterrupt:
                pass
    finally:
        if server:
            server.terminate()
            print("[desktop] Cleaned up server process.")


if __name__ == "__main__":
    launch()
