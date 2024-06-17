import streamlit as st
from typing import Optional, Any
from datetime import date, time

from naviqore_client.models import TimeType


def _get_number_value(inputValue: Any) -> Optional[int]:
    if inputValue == -1 or inputValue == "":
        return None
    return int(inputValue)


@st.experimental_fragment
def query_config_expandable() -> (
    tuple[Optional[int], Optional[int], Optional[int], Optional[int]]
):
    """
    Create an expandable query configuration.

    Returns:
        Query configuration values.
            - maxTransfers: Maximum number of transfers.
            - maxWalkingDuration: Maximum walking duration.
            - maxTravelTime: Maximum travel time.
            - minTransferTime: Minimum transfer time.
    """
    with st.expander("Query Configuration"):

        columns1, columns2 = st.columns(2)

        maxTransfers = _get_number_value(
            columns1.number_input(  # type: ignore
                label="Max Transfers",
                value=-1,
                min_value=-1,
                step=1,
                help="To deactivate, set to -1.",
            )
        )

        maxWalkingDuration = _get_number_value(
            columns2.number_input(  # type: ignore
                label="Max Walking Duration (in minutes)",
                value=-1,
                min_value=-1,
                step=1,
                help="To deactivate, set to -1.",
            )
        )

        column3, column4 = st.columns(2)

        maxTravelTime = _get_number_value(
            column3.number_input(  # type: ignore
                label="Max Travel Time (in minutes)",
                value=60,
                min_value=-1,
                step=1,
                help="To deactivate, set to -1 or leave empty",
            )
        )

        minTransferTime = _get_number_value(
            column4.number_input(  # type: ignore
                label="Min Transfer Time (in minutes)",
                value=-1,
                min_value=-1,
                step=1,
                help="To deactivate, set to -1 or leave empty",
            )
        )

    return maxTransfers, maxWalkingDuration, maxTravelTime, minTransferTime


@st.experimental_fragment
def time_form_row() -> tuple[date, time, TimeType]:
    """
    Create a form row for time input.

    Returns:
        Tuple of date, time, and time type.
    """
    column1, column2, column3 = st.columns(3)

    timeTypes = list(TimeType.__members__.values())

    timeType: TimeType = column3.selectbox(  # type: ignore
        label="Time Type",
        options=timeTypes,
        format_func=lambda timeType: timeType.value,
    )

    dateTimeLabel = timeType.value.capitalize()

    travelDate: date = column1.date_input(label=f"{dateTimeLabel} Date")  # type: ignore
    travelTime: time = column2.time_input(label=f"{dateTimeLabel} Time")

    return travelDate, travelTime, timeType