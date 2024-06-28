import streamlit as st
import pandas as pd
import os
from typing import Union, Optional
from dotenv import dotenv_values
from pathlib import Path
from datetime import datetime, date, time
from naviqore_client.client import Client
from naviqore_client.models import (
    Connection,
    Coordinate,
    TimeType,
    StopConnection,
    Stop,
)

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
def getStopSuggestions(searchterm: str) -> list[tuple[str, str]]:
    client = getClient()
    stops = client.searchStops(searchterm, limit=10)
    return [(stop.name, stop.id) for stop in stops]


@st.cache_data
def getConnections(
    fromStop: str,
    toStop: str,
    travelDate: date,
    travelTime: time,
    timeType: TimeType,
    maxTransfers: Optional[int] = None,
    maxTravelTime: Optional[int] = None,
    maxWalkingDuration: Optional[int] = None,
    minTransferTime: Optional[int] = None,
) -> list[Connection]:
    travelDateTime = datetime.combine(travelDate, travelTime)
    client = getClient()

    return client.getConnections(
        fromStop,
        toStop,
        travelDateTime,
        timeType=timeType,
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
    travelDate: date,
    travelTime: time,
    timeType: TimeType,
    maxTransfers: Optional[int] = None,
    maxTravelTime: Optional[int] = None,
    maxWalkingDuration: Optional[int] = None,
    minTransferTime: Optional[int] = None,
) -> Optional[tuple[Stop, pd.DataFrame]]:
    client = getClient()
    travelDateTime = datetime.combine(travelDate, travelTime)
    stopConnections = client.getIsoLines(
        fromStop,
        travelDateTime,
        timeType=timeType,
        maxWalkingDuration=_convertToSeconds(maxWalkingDuration),
        maxTransferNumber=maxTransfers,
        maxTravelTime=_convertToSeconds(maxTravelTime),
        minTransferTime=_convertToSeconds(minTransferTime),
    )

    sourceStop = client.getStop(fromStop)

    if sourceStop is None:
        print("No source stop found")
        return None

    if not stopConnections:
        print("No stop connections found")
        return None

    if timeType == TimeType.DEPARTURE:
        return _get_earliest_arrivals_dataframe(
            stopConnections, travelDateTime, sourceStop
        )
    else:
        return _get_latest_departures_dataframe(
            stopConnections, travelDateTime, sourceStop
        )


def _get_earliest_arrivals_dataframe(
    stopConnections: list[StopConnection], travelDateTime: datetime, sourceStop: Stop
) -> Optional[tuple[Stop, pd.DataFrame]]:

    legs: list[dict[str, Union[datetime, int, str, float]]] = []

    for stopConnection in stopConnections:

        fromStop = stopConnection.connectingLeg.fromStop
        toStop = stopConnection.connectingLeg.toStop

        if fromStop is None or toStop is None:
            continue

        legs.append(
            {
                "connectionRound": 0,  # TODO: implement connection round
                "targetTime": stopConnection.connectingLeg.arrivalTime,
                "sourceTime": stopConnection.connectingLeg.departureTime,
                "sourceStop": fromStop.name,
                "sourceLat": fromStop.coordinate.latitude,
                "sourceLon": fromStop.coordinate.longitude,
                "targetStop": toStop.name,
                "targetLat": toStop.coordinate.latitude,
                "targetLon": toStop.coordinate.longitude,
                "durationFromSourceInMinutes": abs(
                    int(
                        (
                            stopConnection.connectingLeg.arrivalTime - travelDateTime
                        ).total_seconds()
                        // 60
                    )
                ),
                "distanceFromOrigin": toStop.coordinate.distance_to(
                    sourceStop.coordinate
                ),
                "type": stopConnection.connectingLeg.type.value,
                "travelMode": _get_travel_mode_from_leg(stopConnection),
            }
        )

    return sourceStop, pd.DataFrame(legs)


def _get_latest_departures_dataframe(
    stopConnections: list[StopConnection], travelDateTime: datetime, sourceStop: Stop
) -> Optional[tuple[Stop, pd.DataFrame]]:

    legs: list[dict[str, Union[datetime, int, str, float]]] = []

    for stopConnection in stopConnections:

        fromStop = stopConnection.connectingLeg.fromStop
        toStop = stopConnection.connectingLeg.toStop

        if fromStop is None or toStop is None:
            continue

        legs.append(
            {
                "connectionRound": 0,  # TODO: implement connection round
                "targetTime": stopConnection.connectingLeg.departureTime,
                "sourceTime": stopConnection.connectingLeg.arrivalTime,
                "sourceStop": toStop.name,
                "sourceLat": toStop.coordinate.latitude,
                "sourceLon": toStop.coordinate.longitude,
                "targetStop": fromStop.name,
                "targetLat": fromStop.coordinate.latitude,
                "targetLon": fromStop.coordinate.longitude,
                "durationFromSourceInMinutes": int(
                    abs(
                        (
                            stopConnection.connectingLeg.departureTime - travelDateTime
                        ).total_seconds()
                        // 60
                    )
                ),
                "distanceFromOrigin": fromStop.coordinate.distance_to(
                    sourceStop.coordinate
                ),
                "type": stopConnection.connectingLeg.type.value,
                "travelMode": _get_travel_mode_from_leg(stopConnection),
            }
        )

    return sourceStop, pd.DataFrame(legs)


def _get_travel_mode_from_leg(stopConnection: StopConnection) -> str:
    trip = stopConnection.connectingLeg.trip
    if trip is not None:
        route = trip.route
        headSign = trip.headSign
        descriptionPieces: list[str] = []
        if route.transportMode:
            descriptionPieces.append(route.transportMode)
        if route.shortName:
            descriptionPieces.append(route.shortName)
        elif route.name:
            descriptionPieces.append(headSign)
        elif route.id:
            descriptionPieces.append(route.id)

        routeDescription = ": ".join(descriptionPieces)
        if headSign:
            return f"{routeDescription} - {headSign}"
        return routeDescription
    return stopConnection.connectingLeg.type.value
