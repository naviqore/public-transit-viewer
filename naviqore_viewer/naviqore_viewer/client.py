import streamlit as st
import pandas as pd
from typing import Union
from dotenv import dotenv_values
from pathlib import Path
from datetime import datetime, date, time
from naviqore_client.client import Client
from naviqore_client.models import Connection, Coordinate

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


@st.cache_data
def getIsoLines(
    fromStop: str, departureDate: date, departureTime: time
) -> tuple[Coordinate, pd.DataFrame]:
    client = getClient()
    departureDateTime = datetime.combine(departureDate, departureTime)
    earliestArrivals = client.getIsoLines(fromStop, departureDateTime)

    legs: list[dict[str, Union[datetime, int, str, float]]] = []

    try:
        fromCoordinate = earliestArrivals[0].connection.fromCoordinate
    except AttributeError:
        raise ValueError("No connections found")

    for earliestArrival in earliestArrivals:
        connection = earliestArrival.connection
        connectionRoundCounter = 0
        for leg in connection.legs:
            if leg.isRoute:
                connectionRoundCounter += 1

            if leg.toStop is None or leg.fromStop is None:
                continue

            # get stop before the toStop in trip
            # get index of toStop in trip
            if leg.trip:
                i = 0
                for i, stopTime in enumerate(leg.trip.stopTimes):
                    if stopTime.stop == leg.toStop:
                        break
                legFromStop = leg.trip.stopTimes[i - 1].stop
            else:
                legFromStop = leg.fromStop

            legs.append(
                {
                    "connectionRound": connectionRoundCounter,
                    "departureTime": leg.departureTime,
                    "arrivalTime": leg.arrivalTime,
                    "fromStop": legFromStop.name,
                    "fromLat": legFromStop.coordinate.latitude,
                    "fromLon": legFromStop.coordinate.longitude,
                    "toStop": leg.toStop.name,
                    "toLat": leg.toStop.coordinate.latitude,
                    "toLon": leg.toStop.coordinate.longitude,
                    "arrivalTimeFromStartInMinutes": int(
                        (leg.arrivalTime - departureDateTime).total_seconds() // 60
                    ),
                    "distanceFromOrigin": leg.toStop.coordinate.distance_to(
                        fromCoordinate
                    ),
                    "type": leg.type.value,
                }
            )

    # do some dataframe cleanup
    # keep only the earliest arrival for each toStop
    legsDf = pd.DataFrame(legs)
    legsDf = legsDf.sort_values("arrivalTimeFromStartInMinutes")  # type: ignore
    legsDf = legsDf.drop_duplicates(subset=["toStop"], keep="first")  # type: ignore

    return fromCoordinate, pd.DataFrame(legs)
