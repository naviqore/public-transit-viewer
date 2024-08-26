import os
import signal
import subprocess
import time


def test_main():
    # Start the app in a new process
    process = subprocess.Popen(
        ["python3", "-m", "public_transit_viewer.entrypoint"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        # Give the process a moment to start
        time.sleep(2)

        # Check if the process is still running
        assert process.poll() is None, "Process terminated prematurely"

        # If it's running, terminate it
        os.kill(process.pid, signal.SIGTERM)

        # Wait for the process to terminate
        process.wait()

        # Check that the process has ended
        assert (
                process.returncode == 0 or process.returncode == -signal.SIGTERM
        ), "Process did not terminate as expected"

    finally:
        # Clean up: ensure the process is terminated
        if process.poll() is None:
            os.kill(process.pid, signal.SIGKILL)
