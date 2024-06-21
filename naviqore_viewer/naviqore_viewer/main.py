import streamlit as st
from streamlit_searchbox import st_searchbox
from naviqore_viewer import LOGO_PATH
from naviqore_viewer.client import getConnections, getStopSuggestions
from naviqore_viewer.connection import outputConnection
from naviqore_viewer.components.form_components import (
    time_form_row,
    query_config_expandable,
)
from naviqore_client.models import Connection
from typing import Optional

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

with column1:
    fromStopId: str = st_searchbox(
        search_function=getStopSuggestions,
        label="From",
        key="fromStopId",
        rerun_on_update=False,
    )

with column2:
    toStopId: str = st_searchbox(
        search_function=getStopSuggestions,
        label="To",
        key="toStopId",
        rerun_on_update=False,
    )

travelDate, travelTime, timeType = time_form_row()
maxTransfers, maxWalkingDuration, maxTravelTime, minTransferTime = (
    query_config_expandable()
)

clicked: bool = st.button("Search", use_container_width=True)

if clicked:
    connections = getConnections(
        fromStopId,
        toStopId,
        travelDate,
        travelTime,
        timeType,
        maxTransfers,
        maxTravelTime,
        maxWalkingDuration,
        minTransferTime,
    )
else:
    st.stop()

if not connections:
    st.error("No connections found")
else:
    for key, connection in enumerate(connections):
        outputConnection(connection, str(key))
