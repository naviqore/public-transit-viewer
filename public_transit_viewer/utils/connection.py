from datetime import datetime
from itertools import cycle

import folium  # type: ignore
import streamlit as st
from public_transit_client.model import Connection, Leg

from public_transit_viewer.components.map import display_map

stop_icon_args = {
    "prefix": "fa",
    "icon": "location-crosshairs",
}


def output_connection(connection: Connection):
    with st.container(border=True):
        st.subheader(get_connection_header(connection))

        metric_columns = st.columns(5)
        with metric_columns[0]:
            st.metric(  # type: ignore
                label="Departure", value=connection.departure_time.strftime("%H:%M")
            )

        with metric_columns[1]:
            st.metric(  # type: ignore
                label="Arrival", value=connection.arrival_time.strftime("%H:%M")
            )

        with metric_columns[2]:
            st.metric(  # type: ignore
                label="Duration", value=f"{connection.duration // 60} min"
            )

        with metric_columns[3]:
            st.metric(label="Transfers", value=connection.num_transfers)  # type: ignore

        with metric_columns[4]:
            st.metric(  # type: ignore
                label="Walking Distance",
                value=f"{(float(connection.walk_distance) / 1000):.1f} km",
            )

        show_legs(connection)
        show_map(connection)


def get_connection_header(connection: Connection):
    first_route_leg = connection.first_route_leg
    if first_route_leg is not None:
        trip = first_route_leg.trip
        if trip is not None:
            return f"{trip.route.short_name} in direction {trip.head_sign}"

    # Else this is a walk connection
    from_stop = (
        connection.from_stop.name
        if connection.from_stop is not None
        else connection.from_coordinate
    )
    to_stop = (
        connection.to_stop.name
        if connection.to_stop is not None
        else connection.to_coordinate
    )

    return f"Walk from {from_stop} to {to_stop}"


def show_legs(connection: Connection):
    with st.expander("Show legs"):
        ref_date = connection.departure_time.date()
        if connection.multi_date:
            print_date(connection.departure_time, False)
        for leg in connection.legs:
            if connection.multi_date and leg.arrival_time.date() != ref_date:
                ref_date = leg.arrival_time.date()
                print_date(leg.arrival_time)
            show_leg(leg)


def print_date(date: datetime, divider: bool = True) -> None:
    if divider:
        st.divider()  # type: ignore
    st.subheader(date.strftime("%d.%m.%Y"))  # type: ignore


def show_leg(leg: Leg):
    with st.container(border=True):
        leg_columns = st.columns(3)

        leg_start = (
            leg.from_stop.name
            if leg.from_stop is not None
            else str(leg.from_coordinate)
        )
        leg_end = (
            leg.to_stop.name if leg.to_stop is not None else str(leg.to_coordinate)
        )

        with leg_columns[0]:
            st.metric(  # type: ignore
                label=leg_start,
                value=leg.departure_time.strftime("%H:%M"),
                help=(
                    leg.departure_time.strftime("%d.%m.%Y")
                    if leg.departure_time.date() != leg.arrival_time.date()
                    else None
                ),
            )

        with leg_columns[1]:
            if leg.is_walk:
                walk_duration = leg.duration // 60
                st.markdown(
                    f"{walk_duration} Minute Walk",
                    help=f"Distance: {float(leg.distance) / 1000:.2f} km",
                )
            elif leg.trip is not None:
                trip = leg.trip
                st.markdown(f"{trip.route.short_name} in direction {trip.head_sign}")

        with leg_columns[2]:
            st.metric(  # type: ignore
                label=leg_end,
                value=leg.arrival_time.strftime("%H:%M"),
                help=(
                    leg.arrival_time.strftime("%d.%m.%Y")
                    if leg.departure_time.date() != leg.arrival_time.date()
                    else None
                ),
            )


def show_map(connection: Connection):
    # build dataframe with all coordinates
    centroid = (
        (connection.from_coordinate.latitude + connection.to_coordinate.latitude) / 2,
        (connection.from_coordinate.longitude + connection.to_coordinate.longitude) / 2,
    )

    distance = connection.from_coordinate.distance_to(connection.to_coordinate)

    # random, may have to be adjusted
    zoom = 10
    zoom_factors = {
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

    for distance_threshold in zoom_factors:
        if distance > distance_threshold:
            zoom = zoom_factors[distance_threshold]
            break

    m = folium.Map(location=centroid, zoom_start=zoom, tiles="CartoDB positron")

    marker_label = (
        connection.from_stop.name
        if connection.from_stop is not None
        else str(connection.from_coordinate)
    )

    folium.Marker(  # type: ignore
        connection.from_coordinate.to_tuple(),
        popup=marker_label,
        tooltip=marker_label,
        icon=folium.Icon(color="blue", **stop_icon_args),
    ).add_to(m)

    colors = cycle(
        [
            "red",
            "darkgreen",
            "purple",
            "orange",
            "darkblue",
            "pink",
            "green",
            "lightblue",
            "black",
            "lightgreen",
            "gray",
            "cadetblue",
            "white",
        ]
    )

    for leg in connection.legs:
        color = next(colors)
        marker_label = (
            leg.to_stop.name if leg.to_stop is not None else str(leg.to_coordinate)
        )

        folium.Marker(  # type: ignore
            leg.to_coordinate.to_tuple(),
            popup=marker_label,
            tooltip=marker_label,
            icon=folium.Icon(color=color, **stop_icon_args),
        ).add_to(m)

        # now plot leg
        coords: list[tuple[float, float]] = []
        line_args = {}
        if leg.trip is not None:
            stop_times = sorted(leg.trip.stop_times, key=lambda x: x.departure_time)
            for stop_time in stop_times:
                if (
                    stop_time.departure_time < leg.departure_time
                    or stop_time.arrival_time > leg.arrival_time
                ):
                    continue
                coords.append(stop_time.stop.coordinate.to_tuple())

                folium.Circle(  # type: ignore
                    location=stop_time.stop.coordinate.to_tuple(),
                    radius=30,
                    color=color,
                    fill=True,
                    fill_color=color,
                    fill_opacity=0.6,
                    popup=stop_time.stop.name,
                ).add_to(m)
        else:
            coords = [leg.from_coordinate.to_tuple(), leg.to_coordinate.to_tuple()]
            line_args["dash_array"] = "5"

        walk_duration = leg.duration // 60
        label = f"{walk_duration} Minute Walk"

        if leg.trip is not None:
            trip = leg.trip
            label = f"{trip.route.short_name} in direction {trip.head_sign}"

        folium.PolyLine(  # type: ignore
            coords, color=color, weight=2.5, opacity=1, popup=label, **line_args
        ).add_to(m)

    with st.expander("Show map"):  # type: ignore
        st.write("Map of the connection")  # type: ignore
        display_map(m)
