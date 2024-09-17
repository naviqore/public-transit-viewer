import html
from typing import Any

import streamlit.components.v1 as components
from folium import Circle, Icon, Map, Marker, PolyLine, Popup, Tooltip  # type: ignore


def display_map(map: Map, height: int = 400) -> None:
    zoom: int = map.options.get("zoom", 10)  # type: ignore

    children = _create_children_js(map)

    components.html(
        f"""
        <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.js"></script>
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Leaflet.awesome-markers/2.0.2/leaflet.awesome-markers.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap-glyphicons.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.2.0/css/all.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Leaflet.awesome-markers/2.0.2/leaflet.awesome-markers.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/python-visualization/folium/folium/templates/leaflet.awesome.rotate.min.css">
        <style>
            #map {{
                height: {height}px;
                width: 100%;
            }}
        </style>
        <div id="map"></div>   
        <script>
            const map = L.map('map').setView([{map.location[0]}, {map.location[1]}], {zoom});

            const tiles = L.tileLayer(
                "https://{{s}}.basemaps.cartocdn.com/light_all/{{z}}/{{x}}/{{y}}{{r}}.png",
                {{
                	"attribution": '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    "detectRetina": false, 
                    "maxNativeZoom": 20, 
                    "maxZoom": 20, 
                    "minZoom": 0, 
                    "noWrap": false, 
                    "opacity": 1, 
                    "subdomains": "abcd", 
                    "tms": false
                }}
            ).addTo(map);
        
            {children}

        </script>
        """,
        height=height + 10,  # for margin
    )


def _create_children_js(map: Map) -> str:
    children = ""

    for name, child in map._children.items():  # type: ignore
        # PolyLine is Child of Marker!!
        if isinstance(child, PolyLine):
            children += _create_polyline_js(child, name)  # type: ignore
        elif isinstance(child, Circle):
            children += _create_circle_js(child, name)  # type: ignore
        elif isinstance(child, Marker):
            children += _create_marker_js(child, name)  # type: ignore

    return children


def _create_marker_js(marker: Marker, name: str) -> str:
    lat = marker.location[0]  # type: ignore
    lon = marker.location[1]  # type: ignore
    options = _convert_dict_to_options_string(marker.options)  # type: ignore
    js = f"var {name} = L.marker([{lat}, {lon}], {options}).addTo(map);\n\n"
    js += _get_object_children_js(marker, name)
    return js


def _create_circle_js(circle: Circle, name: str) -> str:
    lat = circle.location[0]  # type: ignore
    lon = circle.location[1]  # type: ignore
    options = _convert_dict_to_options_string(circle.options)  # type: ignore
    js = f"var {name} = L.circle([{lat}, {lon}], {options}).addTo(map);\n\n"
    js += _get_object_children_js(circle, name)
    return js


def _create_polyline_js(polyline: PolyLine, name: str) -> str:
    # build coordinates string
    coordinates = "["
    for coord in polyline.locations:
        coordinates += _convert_coordinates_to_string(coord) + ","  # type: ignore
    coordinates += "]"

    options = _convert_dict_to_options_string(polyline.options)  # type: ignore

    js = f"var {name} = L.polyline({coordinates}, {options}).addTo(map);\n\n"
    js += _get_object_children_js(polyline, name)
    return js


def _convert_dict_to_options_string(options: dict[str, Any]) -> str:
    options_list: list[str] = []
    for key, value in options.items():
        if isinstance(value, str):
            options_list.append(f"{key}: '{value}'")
        elif isinstance(value, bool):
            options_list.append(f"{key}: {str(value).lower()}")
        elif isinstance(value, float) or isinstance(value, int):
            options_list.append(f"{key}: {value}")
    return "{" + ", ".join(options_list) + "}"


def _convert_coordinates_to_string(coordinates: list[float]) -> str:
    return f"[{coordinates[0]}, {coordinates[1]}]"


def _get_object_children_js(obj: Marker | Circle | PolyLine, parent: str) -> str:
    children = ""
    for name, child in obj._children.items():  # type: ignore
        if isinstance(child, Popup):
            children += _create_popup_js(child, parent)  # type: ignore
        elif isinstance(child, Icon):
            children += _create_icon_js(child, name, parent)  # type: ignore
        elif isinstance(child, Tooltip):
            children += _create_tooltip_js(child, parent)  # type: ignore
    return children


def _create_popup_js(popup: Popup, parent: str) -> str:
    if len(popup.html._children.values()) == 0:  # type: ignore
        return ""
    content = _escape_js_string(list(popup.html._children.values())[0].data)  # type: ignore
    maybe_show = ".openPopup()" if popup.show else ""
    return f"{parent}.bindPopup('{content}'){maybe_show};\n\n"


def _create_icon_js(icon: Icon, name: str, parent: str) -> str:
    icon_options = _convert_dict_to_options_string(icon.options)  # type: ignore
    js = f"var {name} = L.AwesomeMarkers.icon({icon_options});\n"
    js += f"{parent}.setIcon({name});\n\n"
    return js


def _create_tooltip_js(tooltip: Tooltip, parent: str) -> str:
    return f"{parent}.bindTooltip('{_escape_js_string(tooltip.text)}');"  # type: ignore


def _escape_js_string(string: str) -> str:
    # Escapes quotes and other necessary characters for JavaScript strings
    return html.escape(string).replace("'", "\\'").replace('"', '\\"')
