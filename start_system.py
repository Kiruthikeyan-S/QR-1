"""
QR Reader System Launcher
Starts both the FastAPI Backend (port 8000) and Vite React Frontend (port 5173).
"""

import os
import sys
import subprocess
import time
import signal

def main():
    print("=" * 60)
    print("      QR READER SYSTEM - FULL-STACK RUNNER")
    print("=" * 60)
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = backend_dir

    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--app-dir", backend_dir, "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=backend_dir,
        env=backend_env,
        shell=(os.name == "nt")
    )

    time.sleep(2)

    print("\n[2/2] Starting Vite React Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir,
        shell=(os.name == "nt")
    )

    print("\n" + "=" * 60)
    print("  SYSTEM IS LIVE AND READY!")
    print("  -> Open in Browser: http://localhost:5173")
    print("  -> FastAPI Backend: http://127.0.0.1:8000")
    print("  -> API Swagger Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    print("\nPress Ctrl+C at any time to shut down both servers.\n")

    try:
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
