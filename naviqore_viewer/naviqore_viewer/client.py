import streamlit as st
import pandas as pd
import os
from typing import Union, Optional
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
        if "NAVIQORE_HOST_URL" in os.environ:
            return Client(str(os.environ["NAVIQORE_HOST_URL"]))
        raise ValueError("NAVIQORE_HOST_URL not found in .env file")

    return Client(str(config["NAVIQORE_HOST_URL"]))


def _convertToSeconds(value: Optional[int]) -> Optional[int]:
    if value is None:
        return None
    return value * 60


@st.cache_data
def getConnections(
    fromStop: str,
    toStop: str,
    departureDate: date,
    departureTime: time,
    maxTransfers: Optional[int] = None,
    maxTravelTime: Optional[int] = None,
    maxWalkingDuration: Optional[int] = None,
    minTransferTime: Optional[int] = None,
) -> list[Connection]:
    departureDateTime = datetime.combine(departureDate, departureTime)
    client = getClient()

    return client.getConnections(
        fromStop,
        toStop,
        departureDateTime,
        maxWalkingDuration=_convertToSeconds(maxWalkingDuration),
        maxTransferNumber=maxTransfers,
        maxTravelTime=_convertToSeconds(maxTravelTime),
        minTransferTime=_convertToSeconds(minTransferTime),
    )


# ugly solution but streamlit does not have a robust way of adding autocomplete
# to selectbox/text input
@st.cache_data
def getStops() -> dict[str, str]:
    client = getClient()
    stops = client.nearestStops(
        Coordinate(latitude=47, longitude=8), limit=INFINITY, maxDistance=INFINITY
    )
    return {stop_distance.stop.id: stop_distance.stop.name for stop_distance in stops}


@st.cache_data
def getIsoLines(
    fromStop: str,
    departureDate: date,
    departureTime: time,
    maxTransfers: Optional[int] = None,
    maxTravelTime: Optional[int] = None,
    maxWalkingDuration: Optional[int] = None,
    minTransferTime: Optional[int] = None,
) -> tuple[Coordinate, pd.DataFrame]:
    client = getClient()
    departureDateTime = datetime.combine(departureDate, departureTime)
    earliestArrivals = client.getIsoLines(
        fromStop,
        departureDateTime,
        maxWalkingDuration=_convertToSeconds(maxWalkingDuration),
        maxTransferNumber=maxTransfers,
        maxTravelTime=_convertToSeconds(maxTravelTime),
        minTransferTime=_convertToSeconds(minTransferTime),
    )

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

    return fromCoordinate, pd.DataFrame(legs)
