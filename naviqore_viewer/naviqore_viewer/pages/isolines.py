import streamlit as st
from naviqore_viewer.client import getIsoLines, getStops
from naviqore_client.models import Coordinate
from datetime import date, time
import pandas as pd
from typing import Optional
from streamlit_folium import st_folium  # type: ignore
import folium  # type: ignore

stops = getStops()

st.title("Naviqore Isolines")

column1, column2, column3 = st.columns(3)

fromStopId: str = column1.selectbox(  # type: ignore
    label="From",
    options=stops.keys(),
    format_func=lambda key: stops[key],
    index=None,
)

departureDate: date = column2.date_input(label="Departure Date")  # type: ignore

departureTime: time = column3.time_input(label="Departure Time")  # type: ignore

isolines: Optional[tuple[Coordinate, pd.DataFrame]] = None

if fromStopId and departureDate and departureTime:
    isolines = getIsoLines(fromStopId, departureDate, departureTime)

if isolines is None:
    st.stop()

sourceCoordinates = isolines[0]
isolinesDf = isolines[1]

maxDuration = int(isolinesDf["arrivalTimeFromStartInMinutes"].max())  # type: ignore
maxRound = int(isolinesDf["connectionRound"].max())  # type: ignore

options = {
    "connectionRound": "By round",
    "arrivalTimeFromStartInMinutes": "By time in minutes",
}

optionColumns = st.columns(3)

filterBy: str = optionColumns[0].selectbox(  # type: ignore
    label="Filter by",
    options=options.keys(),
    format_func=lambda key: options[key],
    index=0,
)

if filterBy == "connectionRound":
    sliderRange: tuple[int, int] = (0, maxRound)  # type: ignore
else:
    sliderRange: tuple[int, int] = (0, maxDuration)  # type: ignore

filterValue = optionColumns[1].slider(  # type: ignore
    label=options[filterBy],
    min_value=sliderRange[0],
    max_value=sliderRange[1],  # type: ignore
    value=sliderRange,  # type: ignore
)

showMarkers: bool = optionColumns[2].toggle(  # type: ignore
    label="Show markers", value=False  # type: ignore
)

filteredDf = isolinesDf[  # type: ignore
    (isolinesDf[filterBy] >= filterValue[0]) & (isolinesDf[filterBy] <= filterValue[1])
]

# get max distance from source

colors = ["darkgreen", "green", "lightgreen", "yellow", "lightred" "red", "darkred"]

# random, may have to be adjusted
zoom = 10
zoomFactors = {
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

maxDistanceToOrigin = filteredDf["distanceFromOrigin"].max()  # type: ignore

for distanceThreshold in zoomFactors:
    if maxDistanceToOrigin > distanceThreshold:
        zoom = zoomFactors[distanceThreshold]
        break


m = folium.Map(location=sourceCoordinates.toTuple(), zoom_start=zoom)  # type: ignore

# add marker to source coordinate
folium.Marker(  # type: ignore
    sourceCoordinates.toTuple(), popup=stops[fromStopId], tooltip="Source"
).add_to(m)

for index, row in filteredDf.iterrows():  # type: ignore

    # get color key based on filterValue
    filterRange = filterValue[1] - filterValue[0]
    if filterRange == 0:
        colorKey = 0
    else:
        colorKey = int(
            (row[filterBy] - filterValue[0]) / filterRange * len(colors)  # type: ignore
        )
        colorKey = min(colorKey, len(colors) - 1)

    if showMarkers:
        folium.Marker(  # type: ignore
            location=[row["toLat"], row["toLon"]],  # type: ignore
            popup=row["toStop"],  # type: ignore
            tooltip=row["toStop"],  # type: ignore
            icon=folium.Icon(color=colors[colorKey]),
        ).add_to(m)

    folium.PolyLine(  # type: ignore
        locations=[
            [
                row["fromLat"],  # type: ignore
                row["fromLon"],
            ],
            [
                row["toLat"],
                row["toLon"],
            ],
        ],
        color=colors[colorKey],
        opacity=0.5 if row["type"] == "WALK" else 1.0,
    ).add_to(m)

st_folium(m, use_container_width=True)  # type: ignore
