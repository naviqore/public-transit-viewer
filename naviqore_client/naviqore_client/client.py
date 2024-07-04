from naviqore_client.models import (
    SearchType,
    Stop,
    Coordinate,
    Departure,
    Connection,
    StopConnection,
    DistanceToStop,
    StopTime,
    Route,
    Trip,
    Leg,
    LegType,
    TimeType,
)
from typing import Union, Optional, Any
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
            return [self._convertJsonStop(stop) for stop in response.json()]
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
            return [self._convertJsonDistanceToStop(stop) for stop in response.json()]
        else:
            return []

    def getStop(self, stopId: str) -> Stop | None:
        url = f"{self.host}/schedule/stops/{stopId}"
        response = get(url)
        if response.status_code == 200:
            return self._convertJsonStop(response.json())
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
            return [
                self._convertJsonDeparture(departure) for departure in response.json()
            ]
        else:
            return []

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
        )
        url = f"{self.host}/routing/connections?{queryString}"
        response = get(url)
        if response.status_code == 200:
            return [
                self._convertJsonConnection(connection)
                for connection in response.json()  # type: ignore
            ]
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
        )

        url = f"{self.host}/routing/isolines?{queryString}"

        if returnConnections:
            url += "&returnConnections=true"

        response = get(url)
        if response.status_code == 200:
            return [
                self._convertJsonStopConnection(arrival) for arrival in response.json()
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

        return queryString

    @staticmethod
    def _convertJsonDistanceToStop(json: dict[str, Any]) -> DistanceToStop:
        json["stop"] = Client._convertJsonStop(json["stop"])
        return DistanceToStop(**json)

    @staticmethod
    def _convertJsonStop(json: dict[str, Any]) -> Stop:
        json["coordinate"] = Coordinate(**json["coordinates"])
        del json["coordinates"]
        return Stop(**json)

    @staticmethod
    def _convertJsonDeparture(json: dict[str, Any]) -> Departure:
        json["stopTime"] = Client._convertJsonStopTime(json["stopTime"])
        json["trip"] = Client._convertJsonTrip(json["trip"])
        return Departure(**json)

    @staticmethod
    def _convertJsonStopTime(json: dict[str, Any]) -> StopTime:
        json["stop"] = Client._convertJsonStop(json["stop"])
        json["arrivalTime"] = datetime.fromisoformat(json["arrivalTime"])
        json["departureTime"] = datetime.fromisoformat(json["departureTime"])
        return StopTime(**json)

    @staticmethod
    def _convertJsonTrip(json: dict[str, Any]) -> Trip:
        json["route"] = Route(**json["route"])
        json["stopTimes"] = (
            [Client._convertJsonStopTime(stopTime) for stopTime in json["stopTimes"]]
            if json["stopTimes"]
            else []
        )
        return Trip(**json)

    @staticmethod
    def _convertJsonConnection(json: dict[str, Any]) -> Connection:
        json["legs"] = [Client._convertJsonLeg(leg) for leg in json["legs"]]
        return Connection(**json)

    @staticmethod
    def _convertJsonLeg(json: dict[str, Any]) -> Leg:
        json["fromCoordinate"] = Coordinate(**json["from"])
        json["fromStop"] = Client._convertJsonStop(json["fromStop"])
        json["toCoordinate"] = Coordinate(**json["to"])
        json["toStop"] = Client._convertJsonStop(json["toStop"])
        json["departureTime"] = datetime.fromisoformat(json["departureTime"])
        json["arrivalTime"] = datetime.fromisoformat(json["arrivalTime"])
        json["type"] = LegType(json["type"])
        if json.get("trip") is not None:
            json["trip"] = Client._convertJsonTrip(json["trip"])
        del json["from"]
        del json["to"]
        return Leg(**json)

    @staticmethod
    def _convertJsonStopConnection(json: dict[str, Any]) -> StopConnection:
        json["stop"] = Client._convertJsonStop(json["stop"])
        json["connectingLeg"] = Client._convertJsonLeg(json["connectingLeg"])
        json["connection"] = (
            Client._convertJsonConnection(json["connection"])
            if json.get("connection")
            else None
        )
        return StopConnection(**json)
