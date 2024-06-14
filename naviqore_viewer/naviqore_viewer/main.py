import streamlit as st
from naviqore_viewer import LOGO_PATH
from naviqore_viewer.client import getConnections, getStops
from naviqore_viewer.connection import outputConnection
from naviqore_client.models import Connection
from datetime import date, time
from typing import Optional, Any

connections: Optional[list[Connection]] = None

st.set_page_config(
    page_title="Naviqore - Router",
    page_icon=str(LOGO_PATH),
)

headerCol1, headerCol2 = st.columns([1, 4])

headerCol1.image(str(LOGO_PATH), use_column_width=True)
headerCol2.title("Naviqore")
headerCol2.write("A simple viewer for the Naviqore API")  # type: ignore

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


def getNumberValue(inputValue: Any) -> Optional[int]:
    if inputValue == -1 or inputValue == "":
        return None
    return int(inputValue)


with column3:
    maxTransfers: Optional[int] = getNumberValue(
        st.number_input(  # type: ignore
            label="Max Transfers",
            value=-1,
            min_value=-1,
            step=1,
            help="To deactivate, set to -1.",
        )
    )

column1, column2, column3 = st.columns(3)

with column1:
    maxWalkingDuration: Optional[int] = getNumberValue(
        st.number_input(  # type: ignore
            label="Max Walking Duration (in minutes)",
            value=-1,
            min_value=-1,
            step=1,
            help="To deactivate, set to -1.",
        )
    )
with column2:
    maxTravelTime: Optional[int] = getNumberValue(
        st.number_input(  # type: ignore
            label="Max Travel Time (in minutes)",
            value=-1,
            min_value=-1,
            step=1,
            help="To deactivate, set to -1 or leave empty",
        )
    )


with column3:
    minTransferTime: Optional[int] = getNumberValue(
        st.number_input(  # type: ignore
            label="Min Transfer Time (in minutes)",
            value=-1,
            min_value=-1,
            step=1,
            help="To deactivate, set to -1 or leave empty",
        )
    )


clicked: bool = st.button("Search", use_container_width=True)

if clicked:
    connections = getConnections(
        fromStopId,
        toStopId,
        departureDate,
        departureTime,
        maxTransfers,
        maxTravelTime,
        maxWalkingDuration,
        minTransferTime,
    )

if connections is not None:
    for key, connection in enumerate(connections):
        outputConnection(connection, str(key))
