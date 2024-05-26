import streamlit as st
from naviqore_viewer.client import getConnections, getStops
from naviqore_viewer.connection import outputConnection
from naviqore_client.models import Connection
from datetime import date, time
from typing import Optional

connections: Optional[list[Connection]] = None

st.title("Naviqore")
st.write("A simple viewer for the Naviqore API")  # type: ignore

column1, column2 = st.columns(2)

stops = getStops()

with column1:
    fromStopId: str = st.selectbox(  # type: ignore
        label="From",
        options=stops.keys(),
        format_func=lambda key: stops[key],
        index=None,
    )

with column2:
    toStopId: str = st.selectbox(  # type: ignore
        label="To", options=stops.keys(), format_func=lambda key: stops[key], index=None
    )

column1, column2, column3 = st.columns(3)

with column1:
    departureDate: date = st.date_input(label="Departure Date")  # type: ignore

with column2:
    departureTime: time = st.time_input(label="Departure Time")

with column3:
    clicked: bool = st.button("Search", use_container_width=True)

if clicked:
    connections = getConnections(fromStopId, toStopId, departureDate, departureTime)

if connections is not None:
    for key, connection in enumerate(connections):
        outputConnection(connection, str(key))
