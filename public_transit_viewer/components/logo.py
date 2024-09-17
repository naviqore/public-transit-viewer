import base64

import streamlit as st

from public_transit_viewer import LOGO_PATH


def show_logo(max_width: int = 150, padding: int = 15) -> None:
    image = LOGO_PATH.read_bytes()
    base64_image = base64.b64encode(image).decode()

    st.html(
        f"""
        <style>
            .logo-image {{
                max-width: {max_width}px;
                width: 100%;
                padding: {padding}px;
            }}
        </style>
        <div style="text-align: center;">
            <img src="data:image/png;base64,{base64_image}" class="logo-image"/>
        </div>
        """
    )
