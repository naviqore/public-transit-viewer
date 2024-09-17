import logging
import os
from datetime import date, datetime, time
from pathlib import Path

import pandas as pd
import streamlit as st
from dotenv import dotenv_values
from public_transit_client.client import PublicTransitClient
from public_transit_client.model import (
    Connection,
    Coordinate,
    QueryConfig,
    RouterInfo,
    ScheduleInfo,
    SearchType,
    Stop,
    StopConnection,
    TimeType,
    TransportMode,
)

LOG = logging.getLogger(__name__)
INFINITY = int(2**31 - 1)
SERVICE_URL_KEY = "NAVIQORE_SERVICE_URL"
STOP_SUGGESTION_LIMIT = 10


@st.cache_data
def get_client() -> PublicTransitClient:
    root_dir = Path(__file__).parent.parent.parent
    config = dotenv_values(root_dir / ".env")

    if SERVICE_URL_KEY in config:
        service_host = config[SERVICE_URL_KEY]
    elif SERVICE_URL_KEY in os.environ:
        service_host = os.environ[SERVICE_URL_KEY]
    else:
        raise ValueError(f"{SERVICE_URL_KEY} not found in .env file or env")

    assert service_host is not None
    LOG.info("Binding client to service at %s", service_host)
    return PublicTransitClient(service_host)


def _convert_to_seconds(value: int | None) -> int | None:
    if value is None:
        return None
    return value * 60


@st.cache_data
def get_router_info() -> RouterInfo:
    client = get_client()
    return client.get_router_info()


@st.cache_data
def get_schedule_info() -> ScheduleInfo:
    client = get_client()
    return client.get_schedule_info()


@st.cache_data
def get_stop_suggestions(search_term: str) -> list[tuple[str, str]]:
    client = get_client()

    stops: dict[str, str] = {}

    for stop in client.search_stops(
        search_term,
        limit=STOP_SUGGESTION_LIMIT,
        search_type=SearchType.STARTS_WITH,
    ):
        stops[stop.name] = stop.id

    if len(stops) < STOP_SUGGESTION_LIMIT:
        for stop in client.search_stops(
            search_term, search_type=SearchType.CONTAINS, limit=STOP_SUGGESTION_LIMIT
        ):
            stops[stop.name] = stop.id
            if len(stops) >= STOP_SUGGESTION_LIMIT:
                break

    return list(stops.items())


@st.cache_data
def get_connections(
    from_stop: str,
    to_stop: str,
    travel_date: date,
    travel_time: time,
    time_type: TimeType,
    max_transfers: int | None = None,
    max_travel_time: int | None = None,
    max_walking_duration: int | None = None,
    min_transfer_time: int | None = None,
    wheelchair_accessible: bool = False,
    bikes_allowed: bool = False,
    travel_modes: list[str] | None = None,
) -> list[Connection]:
    travel_date_time = datetime.combine(travel_date, travel_time)
    client = get_client()

    if travel_modes is not None:
        travel_mode_enums = [TransportMode[mode] for mode in travel_modes]
    else:
        travel_mode_enums = None

    return client.get_connections(
        from_stop,
        to_stop,
        travel_date_time,
        time_type=time_type,
        query_config=QueryConfig(
            max_walking_duration=_convert_to_seconds(max_walking_duration),
            max_num_transfers=max_transfers,
            max_travel_time=_convert_to_seconds(max_travel_time),
            min_transfer_duration=_convert_to_seconds(min_transfer_time),
            accessibility=wheelchair_accessible,
            bikes=bikes_allowed,
            travel_modes=travel_mode_enums,
        ),
    )


# ugly solution but streamlit does not have a robust way of adding autocomplete
# to select box/text input
@st.cache_data
def get_stops() -> dict[str, str]:
    client = get_client()
    stops = client.nearest_stops(
        Coordinate(latitude=47, longitude=8), limit=INFINITY, max_distance=INFINITY
    )
    return {stop_distance.stop.id: stop_distance.stop.name for stop_distance in stops}


@st.cache_data
def get_isolines(
    from_stop: str,
    travel_date: date,
    travel_time: time,
    time_type: TimeType,
    max_transfers: int | None = None,
    max_travel_time: int | None = None,
    max_walking_duration: int | None = None,
    min_transfer_time: int | None = None,
    wheelchair_accessible: bool = False,
    bikes_allowed: bool = False,
    travel_modes: list[str] | None = None,
) -> tuple[Stop, pd.DataFrame] | None:
    client = get_client()
    travel_date_time = datetime.combine(travel_date, travel_time)

    if travel_modes is not None:
        travel_mode_enums = [TransportMode[mode] for mode in travel_modes]
    else:
        travel_mode_enums = None

    stop_connections = client.get_isolines(
        from_stop,
        travel_date_time,
        time_type=time_type,
        query_config=QueryConfig(
            max_walking_duration=_convert_to_seconds(max_walking_duration),
            max_num_transfers=max_transfers,
            max_travel_time=_convert_to_seconds(max_travel_time),
            min_transfer_duration=_convert_to_seconds(min_transfer_time),
            accessibility=wheelchair_accessible,
            bikes=bikes_allowed,
            travel_modes=travel_mode_enums,
        ),
    )

    source_stop = client.get_stop(from_stop)

    if source_stop is None:
        return None

    if not stop_connections:
        return None

    if time_type == TimeType.DEPARTURE:
        return _get_earliest_arrivals_dataframe(
            stop_connections, travel_date_time, source_stop
        )
    else:
        return _get_latest_departures_dataframe(
            stop_connections, travel_date_time, source_stop
        )


def _get_earliest_arrivals_dataframe(
    stop_connections: list[StopConnection],
    travel_date_time: datetime,
    source_stop: Stop,
) -> tuple[Stop, pd.DataFrame] | None:
    legs: list[dict[str, datetime | int | str | float]] = []

    for stop_connection in stop_connections:

        from_stop = stop_connection.connecting_leg.from_stop
        to_stop = stop_connection.connecting_leg.to_stop

        if from_stop is None or to_stop is None:
            continue

        legs.append(
            {
                "connectionRound": 0,
                "targetTime": stop_connection.connecting_leg.arrival_time,
                "sourceTime": stop_connection.connecting_leg.departure_time,
                "sourceStop": from_stop.name,
                "sourceLat": from_stop.coordinate.latitude,
                "sourceLon": from_stop.coordinate.longitude,
                "targetStop": to_stop.name,
                "targetLat": to_stop.coordinate.latitude,
                "targetLon": to_stop.coordinate.longitude,
                "durationFromSourceInMinutes": abs(
                    int(
                        (
                            stop_connection.connecting_leg.arrival_time
                            - travel_date_time
                        ).total_seconds()
                        // 60
                    )
                ),
                "distanceFromOrigin": to_stop.coordinate.distance_to(
                    source_stop.coordinate
                ),
                "type": stop_connection.connecting_leg.type.value,
                "travelMode": _get_travel_mode_from_leg(stop_connection),
            }
        )

    return source_stop, pd.DataFrame(legs)


def _get_latest_departures_dataframe(
    stop_connections: list[StopConnection],
    travel_date_time: datetime,
    source_stop: Stop,
) -> tuple[Stop, pd.DataFrame] | None:
    legs: list[dict[str, datetime | int | str | float]] = []

    for stop_connection in stop_connections:

        from_stop = stop_connection.connecting_leg.from_stop
        to_stop = stop_connection.connecting_leg.to_stop

        if from_stop is None or to_stop is None:
            continue

        legs.append(
            {
                "connectionRound": 0,
                "targetTime": stop_connection.connecting_leg.departure_time,
                "sourceTime": stop_connection.connecting_leg.arrival_time,
                "sourceStop": to_stop.name,
                "sourceLat": to_stop.coordinate.latitude,
                "sourceLon": to_stop.coordinate.longitude,
                "targetStop": from_stop.name,
                "targetLat": from_stop.coordinate.latitude,
                "targetLon": from_stop.coordinate.longitude,
                "durationFromSourceInMinutes": int(
                    abs(
                        (
                            stop_connection.connecting_leg.departure_time
                            - travel_date_time
                        ).total_seconds()
                        // 60
                    )
                ),
                "distanceFromOrigin": from_stop.coordinate.distance_to(
                    source_stop.coordinate
                ),
                "type": stop_connection.connecting_leg.type.value,
                "travelMode": _get_travel_mode_from_leg(stop_connection),
            }
        )

    return source_stop, pd.DataFrame(legs)


def _get_travel_mode_from_leg(stop_connection: StopConnection) -> str:
    trip = stop_connection.connecting_leg.trip
    if trip is not None:
        route = trip.route
        head_sign = trip.head_sign
        description_pieces: list[str] = []
        if route.transport_mode:
            description_pieces.append(route.transport_mode.name)
        if route.short_name:
            description_pieces.append(route.short_name)
        elif route.name:
            description_pieces.append(head_sign)
        elif route.id:
            description_pieces.append(route.id)

        route_description = ": ".join(description_pieces)
        if head_sign:
            return f"{route_description} - {head_sign}"
        return route_description
    return stop_connection.connecting_leg.type.value
