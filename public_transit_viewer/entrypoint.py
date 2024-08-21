import os
import subprocess

SERVER_ADDRESS = "0.0.0.0"
SERVER_PORT = 8501


def main():
    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    main_py_path = os.path.join(script_dir, "public_transit_viewer", "main.py")

    subprocess.run(
        ["streamlit", "run", main_py_path, f"--server.port={SERVER_PORT}", f"--server.address={SERVER_ADDRESS}"],
        cwd=script_dir
    )


if __name__ == "__main__":
    main()
