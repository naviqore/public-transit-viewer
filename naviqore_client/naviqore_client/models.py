from enum import Enum
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from geopy import distance  # type: ignore
from itertools import pairwise


class SearchType(Enum):
    EXACT = "EXACT"
    CONTAINS = "CONTAINS"
    STARTS_WITH = "STARTS_WITH"
    ENDS_WITH = "ENDS_WITH"


class LegType(Enum):
    WALK = "WALK"
    ROUTE = "ROUTE"


class TimeType(Enum):
    DEPARTURE = "DEPARTURE"
    ARRIVAL = "ARRIVAL"


class TransportMode(Enum):
    BUS = "BUS"
    TRAM = "TRAM"
    RAIL = "RAIL"
    SHIP = "SHIP"
    SUBWAY = "SUBWAY"
    AERIAL_LIFT = "AERIAL_LIFT"
    FUNICULAR = "FUNICULAR"


class QueryFeatures(BaseModel):
    supportsAccessibility: bool
    supportsBikes: bool
    supportsTravelModes: bool


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
    coordinate: Coordinate = Field(alias="coordinates")


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

    @field_validator("stopTimes", mode="before")
    def set_stop_times_not_none(cls, v: list[StopTime] | None) -> list[StopTime]:
        return v or []


class Departure(BaseModel):
    stopTime: StopTime
    trip: Trip


class Leg(BaseModel):
    fromCoordinate: Coordinate = Field(alias="from")
    fromStop: Stop | None = None
    toCoordinate: Coordinate = Field(alias="to")
    toStop: Stop | None = None
    type: LegType
    departureTime: datetime
    arrivalTime: datetime
    trip: Trip | None = None

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

    @field_validator("legs")
    def legs_not_empty(cls, v: list[Leg]) -> list[Leg]:
        if not v:
            raise ValueError("legs must not be empty")
        return v

    @property
    def firstLeg(self) -> Leg:
        return self.legs[0]

    @property
    def lastLeg(self) -> Leg:
        return self.legs[-1]

    @property
    def firstRouteLeg(self) -> Leg | None:
        for leg in self.legs:
            if leg.isRoute:
                return leg

    @property
    def lastRouteLeg(self) -> Leg | None:
        for leg in reversed(self.legs):
            if leg.isRoute:
                return leg

    @property
    def firstStop(self) -> Stop | None:
        firstRouteLeg = self.firstRouteLeg
        return firstRouteLeg.fromStop if firstRouteLeg else None

    @property
    def lastStop(self) -> Stop | None:
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
    def fromStop(self) -> Stop | None:
        return self.firstLeg.fromStop

    @property
    def toStop(self) -> Stop | None:
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
        return sum(1 for leg in self.legs if leg.isRoute) - 1

    @property
    def numSameStationTransfers(self) -> int:
        return sum(
            1
            for prev_leg, current_leg in pairwise(self.legs)
            if prev_leg.isRoute and current_leg.isRoute
        )

    @property
    def numStops(self) -> int:
        return sum(leg.numStops for leg in self.legs if leg.isRoute)

    @property
    def multiDate(self) -> bool:
        return self.departureTime.date() != self.arrivalTime.date()


class StopConnection(BaseModel):
    stop: Stop
    connectingLeg: Leg
    connection: Connection | None = None


class DistanceToStop(BaseModel):
    stop: Stop
    distance: float
