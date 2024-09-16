# streamlit: name=Connections

import streamlit as st
from public_transit_client.model import Connection
from streamlit_searchbox import st_searchbox  # type: ignore

from public_transit_viewer import ICON_PATH
from public_transit_viewer.components.form_components import (
    query_config_expandable,
    time_form_row,
)
from public_transit_viewer.components.logo import show_logo
from public_transit_viewer.utils.client import get_connections, get_stop_suggestions
from public_transit_viewer.utils.connection import output_connection

connections: list[Connection] | None = None

st.set_page_config(
    page_title="Naviqore - Connections",
    page_icon=str(ICON_PATH),
)

header_col1, header_col2 = st.columns([1, 4])

with header_col1:
    show_logo(max_width=150)

header_col2.title("Naviqore")
header_col2.write("Search and visualize connections between stops")  # type: ignore

column1, column2 = st.columns(2)

with column1:
    from_stop_id: str = st_searchbox(
        search_function=get_stop_suggestions,
        label="From",
        key="from_stop_id",
        rerun_on_update=True,
        debounce=100,
    )

with column2:
    to_stop_id: str = st_searchbox(
        search_function=get_stop_suggestions,
        label="To",
        key="to_stop_id",
        rerun_on_update=True,
        debounce=100,
    )

travel_date, travel_time, time_type = time_form_row()
(
    max_transfers,
    max_walking_duration,
    max_travel_time,
    min_transfer_time,
    wheelchair_accessible,
    bikes_allowed,
    travel_modes,
) = query_config_expandable()

clicked: bool = st.button("Search", use_container_width=True)

if clicked:
    connections = get_connections(
        from_stop_id,
        to_stop_id,
        travel_date,
        travel_time,
        time_type,
        max_transfers,
        max_travel_time,
        max_walking_duration,
        min_transfer_time,
        wheelchair_accessible,
        bikes_allowed,
        travel_modes,
    )
else:
    st.stop()

if not connections:
    st.error("No connections found")
else:
    for key, connection in enumerate(connections):
        output_connection(connection)
