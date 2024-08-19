from naviqore_client.models import (
    SearchType,
    Stop,
    Coordinate,
    Departure,
    Connection,
    StopConnection,
    DistanceToStop,
    TimeType,
    TransportMode,
    QueryFeatures,
)
from datetime import datetime
from requests import get, Response


class Client:

    def __init__(self, host: str):
        self.host = host

    def searchStops(
        self, query: str, limit: int = 10, searchType: SearchType = SearchType.CONTAINS
    ) -> list[Stop]:
        url = (
            f"{self.host}/schedule/stops/autocomplete"
            f"?query={query}&limit={limit}&searchType={searchType.name}"
        )
        response: Response = get(url)
        if response.status_code == 200:
            return [Stop(**stop) for stop in response.json()]
        else:
            return []

    def nearestStops(
        self, coordinate: Coordinate, limit: int = 10, maxDistance: int = 1000
    ) -> list[DistanceToStop]:
        url = (
            f"{self.host}/schedule/stops/nearest?latitude={coordinate.latitude}"
            f"&longitude={coordinate.longitude}&limit={limit}&maxDistance={maxDistance}"
        )
        response = get(url)
        if response.status_code == 200:
            return [DistanceToStop(**stop) for stop in response.json()]
        else:
            return []

    def getStop(self, stopId: str) -> Stop | None:
        url = f"{self.host}/schedule/stops/{stopId}"
        response = get(url)
        if response.status_code == 200:
            return Stop(**response.json())
        else:
            return None

    def getNextDepartures(
        self,
        stop: str | Stop,
        departure: datetime | None = None,
        limit: int = 10,
        until: datetime | None = None,
    ) -> list[Departure]:
        stopId = stop.id if isinstance(stop, Stop) else stop
        url = f"{self.host}/schedule/stops/{stopId}/departures?limit={limit}"
        if departure is not None:
            url += f"&departureDateTime={departure.strftime('%Y-%m-%dT%H:%M:%S')}"
        if until is not None:
            url += f"&untilDateTime={until.strftime('%Y-%m-%dT%H:%M:%S')}"
        response = get(url)
        if response.status_code == 200:
            return [Departure(**departure) for departure in response.json()]
        else:
            return []

    def getQueryFeatures(self) -> QueryFeatures:
        url = f"{self.host}/routing/"
        response = get(url)
        if response.status_code == 200:
            return QueryFeatures(**response.json())
        else:
            return QueryFeatures(
                supportsAccessibility=False,
                supportsBikes=False,
                supportsTravelModes=False,
            )

    def getConnections(
        self,
        fromStop: str | Stop,
        toStop: str | Stop,
        time: datetime | None = None,
        timeType: TimeType = TimeType.DEPARTURE,
        maxWalkingDuration: int | None = None,
        maxTransferNumber: int | None = None,
        maxTravelTime: int | None = None,
        minTransferTime: int | None = None,
        wheelchairAccessible: bool = False,
        bikesAllowed: bool = False,
        transportModes: list[TransportMode] | None = None,
    ) -> list[Connection]:
        queryString = self._buildQueryString(
            fromStop,
            toStop,
            time=time,
            timeType=timeType,
            maxWalkingDuration=maxWalkingDuration,
            maxTransferNumber=maxTransferNumber,
            maxTravelTime=maxTravelTime,
            minTransferTime=minTransferTime,
            wheelchairAccessible=wheelchairAccessible,
            bikesAllowed=bikesAllowed,
            transportModes=transportModes,
        )
        url = f"{self.host}/routing/connections?{queryString}"
        response = get(url)
        if response.status_code == 200:
            return [Connection(**connection) for connection in response.json()]
        else:
            return []

    def getIsoLines(
        self,
        fromStop: str | Stop,
        time: datetime | None = None,
        timeType: TimeType = TimeType.DEPARTURE,
        maxWalkingDuration: int | None = None,
        maxTransferNumber: int | None = None,
        maxTravelTime: int | None = None,
        minTransferTime: int | None = None,
        wheelchairAccessible: bool = False,
        bikesAllowed: bool = False,
        transportModes: list[TransportMode] | None = None,
        returnConnections: bool = False,
    ) -> list[StopConnection]:
        queryString = self._buildQueryString(
            fromStop,
            time=time,
            timeType=timeType,
            maxWalkingDuration=maxWalkingDuration,
            maxTransferNumber=maxTransferNumber,
            maxTravelTime=maxTravelTime,
            minTransferTime=minTransferTime,
            wheelchairAccessible=wheelchairAccessible,
            bikesAllowed=bikesAllowed,
            transportModes=transportModes,
        )

        url = f"{self.host}/routing/isolines?{queryString}"
        if returnConnections:
            url += "&returnConnections=true"

        response = get(url)
        if response.status_code == 200:
            return [
                StopConnection(**stopConnection) for stopConnection in response.json()
            ]
        else:
            return []

    @staticmethod
    def _buildQueryString(
        fromStop: str | Stop,
        toStop: str | Stop | None = None,
        time: datetime | None = None,
        timeType: TimeType | None = None,
        maxWalkingDuration: int | None = None,
        maxTransferNumber: int | None = None,
        maxTravelTime: int | None = None,
        minTransferTime: int | None = None,
        wheelchairAccessible: bool = False,
        bikesAllowed: bool = False,
        transportModes: list[TransportMode] | None = None,
    ) -> str:
        queryString = (
            f"sourceStopId={fromStop.id if isinstance(fromStop, Stop) else fromStop}"
        )
        if toStop is not None:
            queryString += (
                f"&targetStopId={toStop.id if isinstance(toStop, Stop) else toStop}"
            )
        dateTime = datetime.now() if time is None else time
        queryString += f"&dateTime={dateTime.strftime('%Y-%m-%dT%H:%M:%S')}"
        if timeType is not None:
            queryString += f"&timeType={timeType.value}"
        if maxWalkingDuration is not None:
            queryString += f"&maxWalkingDuration={maxWalkingDuration}"
        if maxTransferNumber is not None:
            queryString += f"&maxTransferNumber={maxTransferNumber}"
        if maxTravelTime is not None:
            queryString += f"&maxTravelTime={maxTravelTime}"
        if minTransferTime is not None:
            queryString += f"&minTransferTime={minTransferTime}"
        if wheelchairAccessible:
            queryString += "&wheelchairAccessible=true"
        if bikesAllowed:
            queryString += "&bikeAllowed=true"
        if transportModes is not None:
            for transportMode in transportModes:
                queryString += f"&travelModes={transportMode.value}"

        return queryString
