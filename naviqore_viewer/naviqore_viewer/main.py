import streamlit as st
from naviqore_viewer.client import getClient
from datetime import datetime

INFINITY = int(2**31 - 1)

client = getClient()

# ugly solution but streamlit does not have a robust way of adding autocomplete to selectbox/text input
@st.cache_data
def getStops() -> dict[str, str]:
    stops = client.searchStops("", limit=INFINITY)
    return {stop.id: stop.name for stop in stops}

if 'departureDate' not in st.session_state:
    st.session_state['departureDate'] = None

if 'fromStopId' not in st.session_state:
    st.session_state['fromStopId'] = None

if 'toStopId' not in st.session_state:
    st.session_state['toStopId'] = None

st.title("Naviqore")
st.write("A simple viewer for the Naviqore API")

column1, column2 = st.columns(2)

stops = getStops()

with column1:
    fromStopId = st.selectbox(label="From", options=stops.keys(), format_func=lambda key: stops[key], index=None)

with column2:
    toStopId = st.selectbox(label="To", options=stops.keys(), format_func=lambda key: stops[key], index=None)

column1, column2, column3 = st.columns(3)

with column1:
    departureDate = st.date_input(label="Departure Date")

with column2:
    departureTime = st.time_input(label="Departure Time")

with column3:
    clicked = st.button("Search", use_container_width=True)

if clicked:
    st.write(f"Searching for routes from {fromStopId} to {toStopId} on {departureDate} at {departureTime}")
    dateTime = datetime.strptime(f"{departureDate} {departureTime}", "%Y-%m-%d %H:%M:%S")
    connections = client.getConnections(fromStopId, toStopId)
    st.write(connections)
