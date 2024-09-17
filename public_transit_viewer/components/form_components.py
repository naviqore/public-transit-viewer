from datetime import date, time
from math import ceil
from typing import Any

import streamlit as st
from public_transit_client.model import TimeType, TransportMode

from public_transit_viewer.utils.client import get_router_info, get_schedule_info


def _get_number_value(input_value: Any) -> int | None:
    if input_value == -1 or input_value == "":
        return None
    return int(input_value)


def query_config_expandable(
    default_max_transfers: int = -1,
    default_max_walking_duration: int = -1,
    default_max_travel_time: int = -1,
    default_min_transfer_time: int = -1,
    wheelchair_accessible: bool = False,
    bikes_allowed: bool = False,
    travel_modes: list[str] | None = None,
) -> tuple[
    int | None,
    int | None,
    int | None,
    int | None,
    bool,
    bool,
    list[str] | None,
]:
    """
    Create an expandable query configuration.

    Returns:
        Query configuration values.
            - maxTransfers: Maximum number of transfers.
            - maxWalkingDuration: Maximum walking duration.
            - maxTravelTime: Maximum travel time.
            - minTransferTime: Minimum transfer time.
            - wheelchairAccessible: Whether the route should be wheelchair accessible.
            - bikesAllowed: Whether bikes are allowed.
            - travelModes: List of allowed travel modes.
    """
    with st.expander("Query Configuration"):

        router_info = get_router_info()

        num_options = 0
        if router_info.supports_max_num_transfers:
            num_options += 1
        if router_info.supports_max_walking_duration:
            num_options += 1
        if router_info.supports_max_travel_time:
            num_options += 1
        if router_info.supports_min_transfer_duration:
            num_options += 1
        if router_info.supports_accessibility:
            num_options += 1
        if router_info.supports_bikes:
            num_options += 1

        columns = []
        column_index = 0
        for _ in range(ceil(num_options / 2)):
            columns.extend(st.columns(2))

        if router_info.supports_max_num_transfers:
            max_transfers = _get_number_value(
                columns[column_index].number_input(  # type: ignore
                    label="Max Transfers",
                    value=default_max_transfers,
                    min_value=-1,
                    step=1,
                    help="To deactivate, set to -1.",
                )
            )
            column_index += 1
        else:
            max_transfers = None

        if router_info.supports_max_walking_duration:
            max_walking_duration = _get_number_value(
                columns[column_index].number_input(  # type: ignore
                    label="Max Walking Duration (in minutes)",
                    value=default_max_walking_duration,
                    min_value=-1,
                    step=1,
                    help="To deactivate, set to -1.",
                )
            )
            column_index += 1
        else:
            max_walking_duration = None

        if router_info.supports_max_travel_time:
            max_travel_time = _get_number_value(
                columns[column_index].number_input(  # type: ignore
                    label="Max Travel Time (in minutes)",
                    value=default_max_travel_time,
                    min_value=-1,
                    step=1,
                    help="To deactivate, set to -1 or leave empty",
                )
            )
            column_index += 1
        else:
            max_travel_time = None

        if router_info.supports_min_transfer_duration:
            min_transfer_time = _get_number_value(
                columns[column_index].number_input(  # type: ignore
                    label="Min Transfer Time (in minutes)",
                    value=default_min_transfer_time,
                    min_value=-1,
                    step=1,
                    help="To deactivate, set to -1 or leave empty",
                )
            )
        else:
            min_transfer_time = None

        if router_info.supports_accessibility:
            wheelchair_accessible = columns[column_index].toggle(
                label="Wheelchair Accessible", value=wheelchair_accessible
            )
        else:
            wheelchair_accessible = False

        if router_info.supports_bikes:
            bikes_allowed = columns[column_index].toggle(
                label="Bikes Allowed", value=bikes_allowed
            )
        else:
            bikes_allowed = False

        if router_info.supports_travel_modes:
            if travel_modes is None:
                travel_modes = [m.value for m in TransportMode.__members__.values()]
            travel_modes = st.multiselect(
                label="Travel Modes",
                options=travel_modes,
                default=travel_modes,
            )
        else:
            travel_modes = None

    return (
        max_transfers,
        max_walking_duration,
        max_travel_time,
        min_transfer_time,
        wheelchair_accessible,
        bikes_allowed,
        travel_modes,
    )


def time_form_row() -> tuple[date, time, TimeType]:
    """
    Create a form row for time input.

    Returns:
        Tuple of date, time, and time type.
    """
    column1, column2, column3 = st.columns(3)

    time_types = list(TimeType.__members__.values())

    time_type: TimeType = column3.selectbox(  # type: ignore
        label="Time Type",
        options=time_types,
        format_func=lambda entry: entry.value,
    )

    date_time_label = time_type.value.capitalize()

    schedule_info = get_schedule_info()
    if schedule_info.schedule_validity.is_date_valid(date.today()):
        default_date = date.today()
    else:
        default_date = schedule_info.schedule_validity.start_date

    travel_date: date = column1.date_input(
        label=f"{date_time_label} Date",
        value=default_date,
        min_value=schedule_info.schedule_validity.start_date,
        max_value=schedule_info.schedule_validity.end_date,
    )  # type: ignore
    travel_time: time = column2.time_input(label=f"{date_time_label} Time")

    return travel_date, travel_time, time_type
