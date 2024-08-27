import time
from pathlib import Path

import streamlit as st


def wait_for_static_content_to_load(asset_path: Path, retries: int = 3, delay: int = 1):
    for _ in range(retries):
        if asset_path.exists():
            return
        time.sleep(delay)
    st.error("Logo not found")
