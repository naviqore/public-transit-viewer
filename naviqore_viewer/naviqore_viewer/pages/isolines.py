import streamlit as st
from streamlit_searchbox import st_searchbox  # type: ignore
from naviqore_viewer import LOGO_PATH
from naviqore_viewer.client import getIsoLines, getStopSuggestions
from naviqore_viewer.utils import getColorMapHexValue
from naviqore_viewer.components.form_components import (
    query_config_expandable,
    time_form_row,
)
from naviqore_client.models import Stop
import pandas as pd
from streamlit_folium import st_folium  # type: ignore
import folium  # type: ignore
from dotenv import dotenv_values
from pathlib import Path

st.set_page_config(
    page_title="Naviqore - Iso Lines",
    page_icon=str(LOGO_PATH),
)


headerCol1, headerCol2 = st.columns([1, 4])

headerCol1.image(str(LOGO_PATH), use_column_width=True)
headerCol2.title("Naviqore")
headerCol2.write("Visualize Iso Lines from Source Stop")  # type: ignore


fromStopId: str = st_searchbox(
    search_function=getStopSuggestions,
    label="From",
    key="fromStopId",
    rerun_on_update=False,
)

travelDate, travelTime, timeType = time_form_row()

maxTransfers, maxWalkingDuration, maxTravelTime, minTransferTime = (
    query_config_expandable(defaultMaxTravelTime=60)
)

isolines: tuple[Stop, pd.DataFrame] | None = None

if fromStopId and travelDate and travelTime:
    isolines = getIsoLines(
        fromStopId,
        travelDate,
        travelTime,
        timeType,
        maxTransfers,
        maxTravelTime,
        maxWalkingDuration,
        minTransferTime,
    )
    if isolines is None:
        st.error("No Iso Lines found")

if isolines is None:
    st.stop()

sourceStop = isolines[0]
isolinesDf = isolines[1]

print(isolinesDf)

maxDuration = int(isolinesDf["durationFromSourceInMinutes"].max())  # type: ignore
maxRound = int(isolinesDf["connectionRound"].max())  # type: ignore

options = {
    "durationFromSourceInMinutes": "By time in minutes",
    "connectionRound": "By round",
}

optionColumns = st.columns(3)

filterBy: str = optionColumns[0].selectbox(  # type: ignore
    label="Filter by",
    options=options.keys(),
    format_func=lambda key: options[key],
    index=0,
)

sliderRange = (0, 1)
if filterBy == "connectionRound" and maxRound > 0:
    sliderRange = (0, maxRound)  # type: ignore
elif filterBy == "durationFromSourceInMinutes" and maxDuration > 0:
    sliderRange = (0, maxDuration)  # type: ignore

filterValue = optionColumns[1].slider(  # type: ignore
    label=options[filterBy],
    min_value=sliderRange[0],
    max_value=sliderRange[1],  # type: ignore
    value=sliderRange,  # type: ignore
)

showMarkers: bool = optionColumns[2].toggle(  # type: ignore
    label="Show markers", value=False  # type: ignore
)
showFootpathRadius: bool = False
if filterBy != "connectionRound":
    showFootpathRadius: bool = optionColumns[2].toggle(  # type: ignore
        label="Show Footpath Radius on Arrival", value=showFootpathRadius
    )


filteredDf = isolinesDf[  # type: ignore
    (isolinesDf[filterBy] >= filterValue[0]) & (isolinesDf[filterBy] <= filterValue[1])
]

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

sourceCoordinates = sourceStop.coordinate.toTuple()
m = folium.Map(location=sourceCoordinates, zoom_start=zoom)  # type: ignore

# add marker to source coordinate
folium.Marker(sourceCoordinates, tooltip="Source").add_to(m)  # type: ignore


scriptDir = Path(__file__).parent
envVariables = dotenv_values(scriptDir / ".." / ".." / ".env")

# get walking speed in m/min (environment variable is in km/h)
walkingSpeed = float(envVariables.get("WALKING_SPEED", 4)) * 1000 / 60  # type: ignore


def showMarkerAndLines(
    map: folium.Map, row: pd.Series, filterValue: tuple[int, int]  # type: ignore
) -> None:
    # get color key based on filterValue
    filterRange = filterValue[1] - filterValue[0]
    if filterRange == 0:
        color = getColorMapHexValue(1.0, 0.0, 1.0)
    else:
        color = getColorMapHexValue(
            row[filterBy], filterValue[0], filterValue[1]  # type: ignore
        )

    sourceCoordinates: list[float] = [row["sourceLat"], row["sourceLon"]]
    targetCoordinates: list[float] = [row["targetLat"], row["targetLon"]]

    if showMarkers:

        if filterBy == "connectionRound":
            popup = f"{row['targetStop']} - Round {row['connectionRound']}"
        else:
            popup = f"{row['targetStop']} - {row['durationFromSourceInMinutes']} min"

        folium.Circle(  # type: ignore
            location=sourceCoordinates,  # type: ignore
            radius=30,  # type: ignore
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8,
            popup=popup,
        ).add_to(map)

    lineArgs = {}
    if row["type"] == "WALK":
        lineArgs["dash_array"] = "5"

    folium.PolyLine(  # type: ignore
        locations=[sourceCoordinates, targetCoordinates],
        toolTip=row["travelMode"],  # type: ignore
        color=color,
        **lineArgs,  # type: ignore
    ).add_to(map)


def showRemainingDistanceCircles(
    map: folium.Map,
    row: pd.Series,  # type: ignore
    filterValue: tuple[int, int],
    walkingSpeed: float,
) -> None:

    arrivalTime = row["durationFromSourceInMinutes"]  # type: ignore
    color = getColorMapHexValue(arrivalTime, 0, filterValue[1])  # type: ignore

    timeLeft = filterValue[1] - arrivalTime  # type: ignore
    radius = timeLeft * walkingSpeed  # type: ignore

    # create a circle with the radius of the remaining distance
    folium.Circle(  # type: ignore
        location=[row["targetLat"], row["targetLon"]],  # type: ignore
        radius=radius,  # type: ignore
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.3,
        popup=f"{row['targetStop']} - {arrivalTime} minutes",  # type: ignore
    ).add_to(map)


for _, row in filteredDf.iterrows():  # type: ignore
    if not showFootpathRadius:
        showMarkerAndLines(m, row, filterValue)  # type: ignore
    else:
        showRemainingDistanceCircles(m, row, filterValue, walkingSpeed)  # type: ignore


st_folium(m, use_container_width=True)  # type: ignore
