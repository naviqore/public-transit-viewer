import subprocess
from pathlib import Path

SERVER_ADDRESS = "0.0.0.0"
SERVER_PORT = 8501


def main():
    root_dir = Path(__file__).resolve().parent.parent
    main_py_path = root_dir / "public_transit_viewer" / "connections.py"

    subprocess.run(
        [
            "streamlit",
            "run",
            str(main_py_path),
            f"--server.port={SERVER_PORT}",
            f"--server.address={SERVER_ADDRESS}",
            "--browser.gatherUsageStats=false",
        ],
        cwd=root_dir,
    )


if __name__ == "__main__":
    main()
