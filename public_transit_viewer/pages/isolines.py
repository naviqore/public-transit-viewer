from pathlib import Path

import folium  # type: ignore
import pandas as pd
import streamlit as st
from dotenv import dotenv_values
from public_transit_client.model import Stop
from streamlit_folium import st_folium  # type: ignore
from streamlit_searchbox import st_searchbox  # type: ignore

from public_transit_viewer import LOGO_PATH
from public_transit_viewer.client import get_isolines, get_stop_suggestions
from public_transit_viewer.components.form_components import (
    query_config_expandable, time_form_row)
from public_transit_viewer.utils import get_color_map_hex_value

st.set_page_config(
    page_title="Naviqore - Iso Lines",
    page_icon=str(LOGO_PATH),
)

header_col1, header_col2 = st.columns([1, 4])

header_col1.image(str(LOGO_PATH), use_column_width=True)
header_col2.title("Naviqore")
header_col2.write("Visualize Iso Lines from Source Stop")  # type: ignore

from_stop_id: str = st_searchbox(
    search_function=get_stop_suggestions,
    label="From",
    key="from_stop_id",
    rerun_on_update=False,
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
) = query_config_expandable(default_max_travel_time=60)

isolines: tuple[Stop, pd.DataFrame] | None = None

if from_stop_id and travel_date and travel_time:
    isolines = get_isolines(
        from_stop_id,
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
    if isolines is None:
        st.error("No Iso Lines found")

if isolines is None:
    st.stop()

source_stop = isolines[0]
isolines_df = isolines[1]

max_duration = int(isolines_df["durationFromSourceInMinutes"].max())  # type: ignore
max_round = int(isolines_df["connectionRound"].max())  # type: ignore

options = {
    "durationFromSourceInMinutes": "By time in minutes",
    "connectionRound": "By round",
}

option_columns = st.columns(3)

filter_by: str = option_columns[0].selectbox(  # type: ignore
    label="Filter by",
    options=options.keys(),
    format_func=lambda key: options[key],
    index=0,
)

slider_range = (0, 1)
if filter_by == "connectionRound" and max_round > 0:
    slider_range = (0, max_round)  # type: ignore
elif filter_by == "durationFromSourceInMinutes" and max_duration > 0:
    slider_range = (0, max_duration)  # type: ignore

filter_value = option_columns[1].slider(  # type: ignore
    label=options[filter_by],
    min_value=slider_range[0],
    max_value=slider_range[1],  # type: ignore
    value=slider_range,  # type: ignore
)

show_markers: bool = option_columns[2].toggle(  # type: ignore
    label="Show markers", value=False  # type: ignore
)
show_footpath_radius: bool = False
if filter_by != "connectionRound":
    show_footpath_radius: bool = option_columns[2].toggle(  # type: ignore
        label="Show Footpath Radius on Arrival", value=show_footpath_radius
    )

filtered_df = isolines_df[  # type: ignore
    (isolines_df[filter_by] >= filter_value[0])
    & (isolines_df[filter_by] <= filter_value[1])
    ]

# random, may have to be adjusted
zoom = 10
zoom_factors = {
    1000000: 4,
    500000: 5,
    200000: 6,
    100000: 7,
    50000: 8,
    20000: 9,
    10000: 10,
    5000: 11,
    2000: 12,
    1000: 13,
    500: 14,
}

max_distance_to_origin = filtered_df["distanceFromOrigin"].max()  # type: ignore

for distance_threshold in zoom_factors:
    if max_distance_to_origin > distance_threshold:
        zoom = zoom_factors[distance_threshold]
        break

source_coordinates = source_stop.coordinate.to_tuple()
m = folium.Map(location=source_coordinates, zoom_start=zoom)  # type: ignore

# add marker to source coordinate
folium.Marker(source_coordinates, tooltip="Source").add_to(m)  # type: ignore

script_dir = Path(__file__).parent
env_variables = dotenv_values(script_dir / ".." / ".." / ".env")

# get walking speed in m/min (environment variable is in km/h)
walking_speed = float(env_variables.get("WALKING_SPEED", 4)) * 1000 / 60  # type: ignore


def show_marker_and_lines(
        geo_map: folium.Map, data_row: pd.Series, this_filter_value: tuple[int, int]  # type: ignore
) -> None:
    # get color key based on filterValue
    filter_range = this_filter_value[1] - this_filter_value[0]
    if filter_range == 0:
        color = get_color_map_hex_value(1.0, 0.0, 1.0)
    else:
        color = get_color_map_hex_value(
            data_row[filter_by], this_filter_value[0], this_filter_value[1]  # type: ignore
        )

    source_coordinates: list[float] = [data_row["sourceLat"], data_row["sourceLon"]]
    target_coordinates: list[float] = [data_row["targetLat"], data_row["targetLon"]]

    if show_markers:

        if filter_by == "connectionRound":
            popup = f"{data_row['targetStop']} - Round {data_row['connectionRound']}"
        else:
            popup = f"{data_row['targetStop']} - {data_row['durationFromSourceInMinutes']} min"

        folium.Circle(  # type: ignore
            location=source_coordinates,  # type: ignore
            radius=30,  # type: ignore
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8,
            popup=popup,
        ).add_to(geo_map)

    line_args = {}
    if data_row["type"] == "WALK":
        line_args["dash_array"] = "5"

    folium.PolyLine(  # type: ignore
        locations=[source_coordinates, target_coordinates],
        toolTip=data_row["travelMode"],  # type: ignore
        color=color,
        **line_args,  # type: ignore
    ).add_to(geo_map)


def show_remaining_distance_circles(
        geo_map: folium.Map,
        data_row: pd.Series,  # type: ignore
        this_filter_value: tuple[int, int],
        this_walking_speed: float,
) -> None:
    arrival_time = data_row["durationFromSourceInMinutes"]  # type: ignore
    color = get_color_map_hex_value(arrival_time, 0, this_filter_value[1])  # type: ignore

    time_left = this_filter_value[1] - arrival_time  # type: ignore
    radius = time_left * this_walking_speed  # type: ignore

    # create a circle with the radius of the remaining distance
    folium.Circle(  # type: ignore
        location=[data_row["targetLat"], data_row["targetLon"]],  # type: ignore
        radius=radius,  # type: ignore
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.3,
        popup=f"{data_row['targetStop']} - {arrival_time} minutes",  # type: ignore
    ).add_to(geo_map)


for _, row in filtered_df.iterrows():  # type: ignore
    if not show_footpath_radius:
        show_marker_and_lines(m, row, filter_value)  # type: ignore
    else:
        show_remaining_distance_circles(m, row, filter_value, walking_speed)  # type: ignore

st_folium(m, use_container_width=True)  # type: ignore
