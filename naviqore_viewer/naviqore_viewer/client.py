import streamlit as st
from dotenv import dotenv_values
from pathlib import Path
from naviqore_client.client import Client

@st.cache_data
def getClient() -> Client:

    currentDir = Path(__file__).parent
    config = dotenv_values(currentDir / ".env")

    if "NAVIQORE_HOST_URL" not in config:
        raise ValueError("NAVIQORE_HOST_URL not found in .env file")

    return Client(config["NAVIQORE_HOST_URL"])
