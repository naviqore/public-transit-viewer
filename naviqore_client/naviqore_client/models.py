from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


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
