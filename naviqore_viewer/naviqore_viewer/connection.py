import streamlit as st
from naviqore_client.models import Connection, Leg
from streamlit_folium import folium_static  # type: ignore
import folium  # type: ignore
from itertools import cycle


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
        for leg in connection.legs:
            showLeg(leg)


def showLeg(leg: Leg):
    with st.container(border=True):
        legColumns = st.columns(3)

        legStart = (
            leg.fromStop.name if leg.fromStop is not None else str(leg.fromCoordinate)
        )
        legEnd = leg.toStop.name if leg.toStop is not None else str(leg.toCoordinate)

        with legColumns[0]:
            st.metric(  # type: ignore
                label=legStart, value=leg.departureTime.strftime("%H:%M")
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
                label=legEnd, value=leg.arrivalTime.strftime("%H:%M")
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
        connection.fromCoordinate.toTuple(), popup=markerLabel, tooltip=markerLabel
    ).add_to(m)

    colors = cycle(
        [
            "blue",
            "green",
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
        ]
    )

    for leg in connection.legs:
        markerLabel = (
            leg.toStop.name if leg.toStop is not None else str(leg.toCoordinate)
        )
        folium.Marker(  # type: ignore
            leg.toCoordinate.toTuple(), popup=markerLabel, tooltip=markerLabel
        ).add_to(m)

        # now plot leg
        coords = [leg.fromCoordinate.toTuple(), leg.toCoordinate.toTuple()]
        color = next(colors)

        walkDuration = leg.duration // 60
        label = f"{walkDuration}' Walk"

        if leg.trip is not None:
            trip = leg.trip
            label = f"{trip.route.shortName} in direction {trip.headSign}"

        folium.PolyLine(  # type: ignore
            coords, color=color, weight=2.5, opacity=1, popup=label
        ).add_to(m)

    with st.expander("Show map"):  # type: ignore
        st.write("Map of the connection")  # type: ignore
        folium_static(m)
