import streamlit as st
from dotenv import dotenv_values
from pathlib import Path
from datetime import datetime, date, time
from naviqore_client.client import Client
from naviqore_client.models import Connection

INFINITY = int(2**31 - 1)


@st.cache_data
def getClient() -> Client:

    rootDir = Path(__file__).parent.parent
    config = dotenv_values(rootDir / ".env")

    if "NAVIQORE_HOST_URL" not in config:
        raise ValueError("NAVIQORE_HOST_URL not found in .env file")

    return Client(str(config["NAVIQORE_HOST_URL"]))


@st.cache_data
def getConnections(
    fromStop: str, toStop: str, departureDate: date, departureTime: time
) -> list[Connection]:
    departureDateTime = datetime.combine(departureDate, departureTime)
    client = getClient()
    return client.getConnections(fromStop, toStop, departureDateTime)


# ugly solution but streamlit does not have a robust way of adding autocomplete
# to selectbox/text input
@st.cache_data
def getStops() -> dict[str, str]:
    client = getClient()
    stops = client.searchStops("", limit=INFINITY)
    return {stop.id: stop.name for stop in stops}
