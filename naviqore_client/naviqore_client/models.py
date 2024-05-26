from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from geopy import distance  # type: ignore


class SearchType(Enum):
    EXACT = "EXACT"
    FUZZY = "FUZZY"
    CONTAINS = "CONTAINS"
    STARTS_WITH = "STARTS_WITH"
    ENDS_WITH = "ENDS_WITH"


class LegType(Enum):
    WALK = "WALK"
    ROUTE = "ROUTE"


class Coordinate(BaseModel):
    latitude: float
    longitude: float

    def distance_to(self, other: "Coordinate") -> float:
        return float(
            distance.distance(
                (self.latitude, self.longitude),
                (other.latitude, other.longitude),
            ).meters  # type: ignore
        )

    def toTuple(self) -> tuple[float, float]:
        return (self.latitude, self.longitude)


class Stop(BaseModel):
    id: str
    name: str
    coordinate: Coordinate


class Route(BaseModel):
    id: str
    name: str
    shortName: str
    transportMode: str


class StopTime(BaseModel):
    stop: Stop
    arrivalTime: datetime
    departureTime: datetime


class Trip(BaseModel):
    headSign: str
    route: Route
    stopTimes: list[StopTime]


class Departure(BaseModel):
    stopTime: StopTime
    trip: Trip


class Leg(BaseModel):
    fromCoordinate: Coordinate
    fromStop: Optional[Stop] = None
    toCoordinate: Coordinate
    toStop: Optional[Stop] = None
    type: LegType
    departureTime: datetime
    arrivalTime: datetime
    trip: Optional[Trip] = None

    @property
    def duration(self) -> int:
        return (self.arrivalTime - self.departureTime).seconds

    @property
    def distance(self) -> float:
        return self.fromCoordinate.distance_to(self.toCoordinate)

    @property
    def isWalk(self) -> bool:
        return self.type == LegType.WALK

    @property
    def isRoute(self) -> bool:
        return self.type == LegType.ROUTE

    @property
    def numStops(self) -> int:
        if self.trip is None or not self.isRoute:
            return 0

        # get index of fromStop and toStop
        fromStopIndex = None
        toStopIndex = None
        for i, stopTime in enumerate(self.trip.stopTimes):
            if stopTime.stop == self.fromStop:
                fromStopIndex = i
            if stopTime.stop == self.toStop:
                toStopIndex = i
                break

        if fromStopIndex is None or toStopIndex is None:
            raise ValueError("fromStop or toStop not found in trip")
        return toStopIndex - fromStopIndex


class Connection(BaseModel):
    legs: list[Leg]

    @property
    def firstLeg(self) -> Leg:
        return self.legs[0]

    @property
    def lastLeg(self) -> Leg:
        return self.legs[-1]

    @property
    def firstRouteLeg(self) -> Optional[Leg]:
        for leg in self.legs:
            if leg.isRoute:
                return leg

    @property
    def lastRouteLeg(self) -> Optional[Leg]:
        for leg in reversed(self.legs):
            if leg.isRoute:
                return leg

    @property
    def firstStop(self) -> Optional[Stop]:
        firstRouteLeg = self.firstRouteLeg
        return firstRouteLeg.fromStop if firstRouteLeg else None

    @property
    def lastStop(self) -> Optional[Stop]:
        lastRouteLeg = self.lastRouteLeg
        return lastRouteLeg.toStop if lastRouteLeg else None

    @property
    def departureTime(self) -> datetime:
        return self.firstLeg.departureTime

    @property
    def arrivalTime(self) -> datetime:
        return self.lastLeg.arrivalTime

    @property
    def fromCoordinate(self) -> Coordinate:
        return self.firstLeg.fromCoordinate

    @property
    def toCoordinate(self) -> Coordinate:
        return self.lastLeg.toCoordinate

    @property
    def fromStop(self) -> Optional[Stop]:
        return self.firstLeg.fromStop

    @property
    def toStop(self) -> Optional[Stop]:
        return self.lastLeg.toStop

    @property
    def duration(self) -> int:
        return (self.arrivalTime - self.departureTime).seconds

    @property
    def travelDuration(self) -> int:
        return sum(leg.duration for leg in self.legs)

    @property
    def travelDistance(self) -> float:
        return sum(leg.distance for leg in self.legs)

    @property
    def beeLineDistance(self) -> float:
        return self.fromCoordinate.distance_to(self.toCoordinate)

    @property
    def walkDistance(self) -> float:
        return sum(leg.distance for leg in self.legs if leg.isWalk)

    @property
    def routeDistance(self) -> float:
        return sum(leg.distance for leg in self.legs if leg.isRoute)

    @property
    def walkDuration(self) -> int:
        return sum(leg.duration for leg in self.legs if leg.isWalk)

    @property
    def routeDuration(self) -> int:
        return sum(leg.duration for leg in self.legs if leg.isRoute)

    @property
    def numTransfers(self) -> int:
        counter = 0
        betweenTrips = False
        for leg in self.legs:
            if leg.isRoute:
                if betweenTrips:
                    counter += 1
                betweenTrips = not betweenTrips
        return counter

    @property
    def numSameStationTransfers(self) -> int:
        counter = 0
        for i in range(1, len(self.legs)):
            if not self.legs[i - 1].isRoute or not self.legs[i].isRoute:
                continue
            if self.legs[i - 1].toStop == self.legs[i].fromStop:
                counter += 1
        return counter

    @property
    def numStops(self) -> int:
        return sum(leg.numStops for leg in self.legs if leg.isRoute)


class EarliestArrival(BaseModel):
    stop: Stop
    arrivalTime: datetime
    connection: Connection


class DistanceToStop(BaseModel):
    stop: Stop
    distance: float
