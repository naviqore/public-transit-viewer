import streamlit as st
from naviqore_client.models import Connection, Leg
from streamlit_folium import folium_static  # type: ignore
import folium  # type: ignore
from itertools import cycle
from datetime import datetime

stopIconArgs = {
    "prefix": "fa",
    "icon": "location-crosshairs",
}


@st.experimental_fragment
def outputConnection(connection: Connection, key: str):
    with st.container(border=True):
        st.subheader(getConnectionHeader(connection))

        metricColumns = st.columns(5)
        with metricColumns[0]:
            st.metric(  # type: ignore
                label="Departure", value=connection.departureTime.strftime("%H:%M")
            )

        with metricColumns[1]:
            st.metric(  # type: ignore
                label="Arrival", value=connection.arrivalTime.strftime("%H:%M")
            )

        with metricColumns[2]:
            st.metric(  # type: ignore
                label="Duration", value=f"{connection.duration // 60} min"
            )

        with metricColumns[3]:
            st.metric(label="Transfers", value=connection.numTransfers)  # type: ignore

        with metricColumns[4]:
            st.metric(  # type: ignore
                label="Walking Distance",
                value=f"{(float(connection.walkDistance) / 1000):.1f} km",
            )

        showLegs(connection)
        showMap(connection, key)


def getConnectionHeader(connection: Connection):
    firstRouteLeg = connection.firstRouteLeg
    if firstRouteLeg is not None:
        trip = firstRouteLeg.trip
        if trip is not None:
            return f"{trip.route.shortName} in direction {trip.headSign}"

    # Else this is a walk connection
    fromStop = (
        connection.fromStop.name
        if connection.fromStop is not None
        else connection.fromCoordinate
    )
    toStop = (
        connection.toStop.name
        if connection.toStop is not None
        else connection.toCoordinate
    )

    return f"Walk from {fromStop} to {toStop}"


def showLegs(connection: Connection):
    with st.expander("Show legs"):
        refDate = connection.departureTime.date()
        if connection.multiDate:
            printDate(connection.departureTime, False)
        for leg in connection.legs:
            if connection.multiDate and leg.arrivalTime.date() != refDate:
                refDate = leg.arrivalTime.date()
                printDate(leg.arrivalTime)
            showLeg(leg)


def printDate(date: datetime, divider: bool = True) -> None:
    if divider:
        st.divider()  # type: ignore
    st.subheader(date.strftime("%d.%m.%Y"))  # type: ignore


def showLeg(leg: Leg):
    with st.container(border=True):
        legColumns = st.columns(3)

        legStart = (
            leg.fromStop.name if leg.fromStop is not None else str(leg.fromCoordinate)
        )
        legEnd = leg.toStop.name if leg.toStop is not None else str(leg.toCoordinate)

        with legColumns[0]:
            st.metric(  # type: ignore
                label=legStart,
                value=leg.departureTime.strftime("%H:%M"),
                help=(
                    leg.departureTime.strftime("%d.%m.%Y")
                    if leg.departureTime.date() != leg.arrivalTime.date()
                    else None
                ),
            )

        with legColumns[1]:
            if leg.isWalk:
                walkDuration = leg.duration // 60
                st.markdown(
                    f"{walkDuration}' Walk",
                    help=f"Distance: {float(leg.distance) / 1000:.2f} km",
                )
            elif leg.trip is not None:
                trip = leg.trip
                st.markdown(f"{trip.route.shortName} in direction {trip.headSign}")

        with legColumns[2]:
            st.metric(  # type: ignore
                label=legEnd,
                value=leg.arrivalTime.strftime("%H:%M"),
                help=(
                    leg.arrivalTime.strftime("%d.%m.%Y")
                    if leg.departureTime.date() != leg.arrivalTime.date()
                    else None
                ),
            )


def showMap(connection: Connection, key: str):
    # build dataframe with all coordinates
    centroid = (
        (connection.fromCoordinate.latitude + connection.toCoordinate.latitude) / 2,
        (connection.fromCoordinate.longitude + connection.toCoordinate.longitude) / 2,
    )

    distance = connection.fromCoordinate.distance_to(connection.toCoordinate)

    # random, may have to be adjusted
    zoom = 10
    zoomFactors = {
        1000000: 5,
        500000: 6,
        200000: 7,
        100000: 8,
        50000: 9,
        20000: 10,
        10000: 11,
        5000: 12,
        2000: 13,
        1000: 14,
        500: 15,
    }

    for distanceThreshold in zoomFactors:
        if distance > distanceThreshold:
            zoom = zoomFactors[distanceThreshold]
            break

    m = folium.Map(location=centroid, zoom_start=zoom)

    markerLabel = (
        connection.fromStop.name
        if connection.fromStop is not None
        else str(connection.fromCoordinate)
    )

    folium.Marker(  # type: ignore
        connection.fromCoordinate.toTuple(),
        popup=markerLabel,
        tooltip=markerLabel,
        icon=folium.Icon(color="blue", **stopIconArgs),
    ).add_to(m)

    colors = cycle(
        [
            "red",
            "purple",
            "orange",
            "darkblue",
            "darkgreen",
            "cadetblue",
            "darkpurple",
            "white",
            "pink",
            "lightblue",
            "lightgreen",
            "gray",
            "black",
            "lightgray",
            "green",
        ]
    )

    for leg in connection.legs:
        color = next(colors)
        markerLabel = (
            leg.toStop.name if leg.toStop is not None else str(leg.toCoordinate)
        )

        folium.Marker(  # type: ignore
            leg.toCoordinate.toTuple(),
            popup=markerLabel,
            tooltip=markerLabel,
            icon=folium.Icon(color=color, **stopIconArgs),
        ).add_to(m)

        # now plot leg
        coords: list[tuple[float, float]] = []
        lineArgs = {}
        if leg.trip is not None:
            stopTimes = sorted(leg.trip.stopTimes, key=lambda x: x.departureTime)
            for stopTime in stopTimes:
                if (
                    stopTime.departureTime < leg.departureTime
                    or stopTime.arrivalTime > leg.arrivalTime
                ):
                    continue
                coords.append(stopTime.stop.coordinate.toTuple())

                folium.Circle(  # type: ignore
                    location=stopTime.stop.coordinate.toTuple(),
                    radius=30,
                    color=color,
                    fill=True,
                    fill_color=color,
                    fill_opacity=0.6,
                    popup=stopTime.stop.name,
                ).add_to(m)
        else:
            coords = [leg.fromCoordinate.toTuple(), leg.toCoordinate.toTuple()]
            lineArgs["dash_array"] = "5"

        walkDuration = leg.duration // 60
        label = f"{walkDuration}' Walk"

        if leg.trip is not None:
            trip = leg.trip
            label = f"{trip.route.shortName} in direction {trip.headSign}"

        folium.PolyLine(  # type: ignore
            coords, color=color, weight=2.5, opacity=1, popup=label, **lineArgs
        ).add_to(m)

    with st.expander("Show map"):  # type: ignore
        st.write("Map of the connection")  # type: ignore
        folium_static(m, width=600, height=400)  # type: ignore
