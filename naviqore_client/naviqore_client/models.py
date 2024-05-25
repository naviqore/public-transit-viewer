from enum import Enum, auto
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class SearchType(Enum):
    EXACT = auto()
    FUZZY = auto()
    CONTAINS = auto()
    STARTS_WITH = auto()
    ENDS_WITH = auto()


class LegType(Enum):
    WALK = auto()
    ROUTE = auto()


class Coordinate(BaseModel):
    latitude: float
    longitude: float


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
    fromStop: Stop
    toCoordinate: Coordinate
    toStop: Stop
    type: LegType
    departureTime: datetime
    arrivalTime: datetime
    trip: Optional[Trip] = None


class Connection(BaseModel):
    legs: list[Leg]


class EarliestArrival(BaseModel):
    stop: Stop
    arrivalTime: datetime
    connection: Connection


class DistanceToStop(BaseModel):
    stop: Stop
    distance: float
