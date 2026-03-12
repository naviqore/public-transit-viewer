import {
  Connection,
  RoutingInfo,
  ScheduleInfo,
  Stop,
  StopConnection,
  TransportMode,
} from '../types';

export const MOCK_STOPS: Stop[] = [
  {
    id: '8503000',
    name: 'Zürich HB',
    coordinates: { latitude: 47.378177, longitude: 8.540192 },
  },
  {
    id: '8507000',
    name: 'Bern',
    coordinates: { latitude: 46.947974, longitude: 7.447447 },
  },
  {
    id: '8500010',
    name: 'Basel SBB',
    coordinates: { latitude: 47.547412, longitude: 7.589554 },
  },
  {
    id: '8503016',
    name: 'Zürich Flughafen',
    coordinates: { latitude: 47.45037, longitude: 8.56245 },
  },
  {
    id: '8591056',
    name: 'Zürich, Paradeplatz',
    coordinates: { latitude: 47.36946, longitude: 8.53904 },
  },
  {
    id: '8507100',
    name: 'Thun',
    coordinates: { latitude: 46.75485, longitude: 7.62963 },
  },
  {
    id: '8504221',
    name: 'Interlaken Ost',
    coordinates: { latitude: 46.69032, longitude: 7.86968 },
  },
  {
    id: '8508500',
    name: 'Fribourg/Freiburg',
    coordinates: { latitude: 46.80323, longitude: 7.15112 },
  },
  {
    id: '8501008',
    name: 'Genève',
    coordinates: { latitude: 46.21023, longitude: 6.14241 },
  },
];

const getRelativeDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const MOCK_SCHEDULE_INFO: ScheduleInfo = {
  hasAccessibility: true,
  hasBikes: true,
  hasTravelModes: true,
  scheduleValidity: {
    startDate: getRelativeDate(-7),
    endDate: getRelativeDate(365 * 5),
  },
};

export const MOCK_ROUTING_INFO: RoutingInfo = {
  supportsMaxTransfers: true,
  supportsMaxTravelDuration: true,
  supportsMaxWalkDuration: true,
  supportsMinTransferDuration: true,
  supportsAccessibility: true,
  supportsBikes: true,
  supportsTravelModes: true,
};

const createBernDepartures = () => {
  const now = Date.now();
  return [
    {
      stopTime: {
        stop: MOCK_STOPS[1], // Bern
        departureTime: new Date(now + 120000).toISOString(),
        arrivalTime: new Date(now + 120000).toISOString(),
      },
      trip: {
        headSign: 'Interlaken Ost',
        route: { shortName: 'IC 61', transportMode: TransportMode.RAIL },
        stopTimes: [
          {
            stop: MOCK_STOPS[2],
            departureTime: new Date(now - 3600000).toISOString(),
            arrivalTime: new Date(now - 3600000).toISOString(),
          }, // Basel (Past)
          {
            stop: MOCK_STOPS[1],
            departureTime: new Date(now + 120000).toISOString(),
            arrivalTime: new Date(now + 120000).toISOString(),
          }, // Bern (Current)
          {
            stop: MOCK_STOPS[5],
            departureTime: new Date(now + 1200000).toISOString(),
            arrivalTime: new Date(now + 1200000).toISOString(),
          }, // Thun
          {
            stop: MOCK_STOPS[6],
            departureTime: new Date(now + 2400000).toISOString(),
            arrivalTime: new Date(now + 2400000).toISOString(),
          }, // Interlaken
        ],
      },
    },
    {
      stopTime: {
        stop: MOCK_STOPS[1], // Bern
        departureTime: new Date(now + 300000).toISOString(),
        arrivalTime: new Date(now + 300000).toISOString(),
      },
      trip: {
        headSign: 'Genève',
        route: { shortName: 'IC 1', transportMode: TransportMode.RAIL },
        stopTimes: [
          {
            stop: MOCK_STOPS[0],
            departureTime: new Date(now - 3600000).toISOString(),
            arrivalTime: new Date(now - 3600000).toISOString(),
          }, // Zurich (Past)
          {
            stop: MOCK_STOPS[1],
            departureTime: new Date(now + 300000).toISOString(),
            arrivalTime: new Date(now + 300000).toISOString(),
          }, // Bern (Current)
          {
            stop: MOCK_STOPS[7],
            departureTime: new Date(now + 1500000).toISOString(),
            arrivalTime: new Date(now + 1500000).toISOString(),
          }, // Fribourg
          {
            stop: MOCK_STOPS[8],
            departureTime: new Date(now + 4500000).toISOString(),
            arrivalTime: new Date(now + 4500000).toISOString(),
          }, // Geneve
        ],
      },
    },
    {
      stopTime: {
        stop: MOCK_STOPS[1], // Bern
        departureTime: new Date(now + 900000).toISOString(),
        arrivalTime: new Date(now + 900000).toISOString(),
      },
      trip: {
        headSign: 'Zürich HB',
        route: { shortName: 'IR 15', transportMode: TransportMode.RAIL },
        stopTimes: [
          {
            stop: MOCK_STOPS[8],
            departureTime: new Date(now - 4500000).toISOString(),
            arrivalTime: new Date(now - 4500000).toISOString(),
          }, // Geneve (Past)
          {
            stop: MOCK_STOPS[1],
            departureTime: new Date(now + 900000).toISOString(),
            arrivalTime: new Date(now + 900000).toISOString(),
          }, // Bern (Current)
          {
            stop: MOCK_STOPS[0],
            departureTime: new Date(now + 3900000).toISOString(),
            arrivalTime: new Date(now + 3900000).toISOString(),
          }, // Zurich
        ],
      },
    },
  ];
};

const createZurichDepartures = () => {
  const now = Date.now();
  return [
    {
      stopTime: {
        stop: MOCK_STOPS[0], // Zurich HB
        departureTime: new Date(now + 300000).toISOString(),
        arrivalTime: new Date(now + 300000).toISOString(),
      },
      trip: {
        headSign: 'Bern',
        route: { shortName: 'IC 8', transportMode: TransportMode.RAIL },
        stopTimes: [
          {
            stop: MOCK_STOPS[0],
            departureTime: new Date(now + 300000).toISOString(),
            arrivalTime: new Date(now + 300000).toISOString(),
          },
          {
            stop: MOCK_STOPS[4],
            departureTime: new Date(now + 900000).toISOString(),
            arrivalTime: new Date(now + 900000).toISOString(),
          },
          {
            stop: MOCK_STOPS[1],
            departureTime: new Date(now + 3900000).toISOString(),
            arrivalTime: new Date(now + 3900000).toISOString(),
          },
        ],
      },
    },
    {
      stopTime: {
        stop: MOCK_STOPS[0], // Zurich HB
        departureTime: new Date(now + 600000).toISOString(),
        arrivalTime: new Date(now + 600000).toISOString(),
      },
      trip: {
        headSign: 'Zürich Flughafen',
        route: { shortName: 'S 16', transportMode: TransportMode.RAIL },
        stopTimes: [
          {
            stop: MOCK_STOPS[0],
            departureTime: new Date(now + 600000).toISOString(),
            arrivalTime: new Date(now + 600000).toISOString(),
          },
          {
            stop: MOCK_STOPS[3],
            departureTime: new Date(now + 1500000).toISOString(),
            arrivalTime: new Date(now + 1500000).toISOString(),
          },
        ],
      },
    },
    {
      stopTime: {
        stop: MOCK_STOPS[0], // Zurich HB
        departureTime: new Date(now + 900000).toISOString(),
        arrivalTime: new Date(now + 900000).toISOString(),
      },
      trip: {
        headSign: 'Wollishofen',
        route: { shortName: 'Tram 7', transportMode: TransportMode.TRAM },
        stopTimes: [
          {
            stop: MOCK_STOPS[0],
            departureTime: new Date(now + 900000).toISOString(),
            arrivalTime: new Date(now + 900000).toISOString(),
          },
          {
            stop: MOCK_STOPS[4],
            departureTime: new Date(now + 1200000).toISOString(),
            arrivalTime: new Date(now + 1200000).toISOString(),
          },
        ],
      },
    },
  ];
};

const NOW = Date.now();
const MIN = 60 * 1000;

export const MOCK_CONNECTIONS: Connection[] = [
  {
    departureTime: new Date().toISOString(),
    arrivalTime: new Date(NOW + 58 * MIN).toISOString(),
    duration: 58 * 60,
    transfers: 0,
    legs: [
      {
        type: 'WALK',
        from: MOCK_STOPS[0].coordinates,
        to: MOCK_STOPS[0].coordinates,
        fromStop: MOCK_STOPS[0],
        toStop: MOCK_STOPS[0],
        departureTime: new Date().toISOString(),
        arrivalTime: new Date(NOW + 2 * MIN).toISOString(),
        duration: 120,
        distance: 100,
      },
      {
        type: 'ROUTE',
        from: MOCK_STOPS[0].coordinates,
        to: MOCK_STOPS[1].coordinates,
        fromStop: MOCK_STOPS[0],
        toStop: MOCK_STOPS[1],
        departureTime: new Date(NOW + 2 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 58 * MIN).toISOString(),
        duration: 56 * 60,
        trip: {
          headSign: 'Bern',
          route: {
            id: 'IC8',
            name: 'IC 8',
            shortName: 'IC 8',
            transportMode: TransportMode.RAIL,
          },
          bikesAllowed: true,
          wheelchairAccessible: true,
          stopTimes: [
            {
              stop: MOCK_STOPS[0],
              departureTime: new Date(NOW + 2 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 2 * MIN).toISOString(),
            },
            {
              stop: MOCK_STOPS[4],
              departureTime: new Date(NOW + 10 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 10 * MIN).toISOString(),
            },
            {
              stop: MOCK_STOPS[1],
              departureTime: new Date(NOW + 58 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 58 * MIN).toISOString(),
            },
          ],
        },
      },
    ],
  },
  {
    departureTime: new Date(NOW + 10 * MIN).toISOString(),
    arrivalTime: new Date(NOW + 120 * MIN).toISOString(), // ~2 hours total
    duration: 110 * 60,
    transfers: 1,
    legs: [
      // Leg 1: Rail Zurich -> Bern
      {
        type: 'ROUTE',
        from: MOCK_STOPS[0].coordinates,
        to: MOCK_STOPS[1].coordinates,
        fromStop: MOCK_STOPS[0],
        toStop: MOCK_STOPS[1],
        departureTime: new Date(NOW + 10 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 66 * MIN).toISOString(),
        duration: 56 * 60,
        trip: {
          headSign: 'Brig',
          route: {
            id: 'IC8',
            name: 'IC 8',
            shortName: 'IC 8',
            transportMode: TransportMode.RAIL,
          },
          bikesAllowed: true,
          wheelchairAccessible: true,
          stopTimes: [
            // Full trip: Romanshorn -> Zurich -> Bern -> Brig (Mocking segment)
            {
              stop: MOCK_STOPS[3],
              departureTime: new Date(NOW - 30 * MIN).toISOString(),
              arrivalTime: new Date(NOW - 30 * MIN).toISOString(),
            }, // Previous: Airport
            {
              stop: MOCK_STOPS[0],
              departureTime: new Date(NOW + 10 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 10 * MIN).toISOString(),
            },
            {
              stop: MOCK_STOPS[1],
              departureTime: new Date(NOW + 66 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 66 * MIN).toISOString(),
            },
          ],
        },
      },
      // Leg 2: Walk Transfer in Bern
      {
        type: 'WALK',
        from: MOCK_STOPS[1].coordinates,
        to: MOCK_STOPS[1].coordinates,
        fromStop: MOCK_STOPS[1],
        toStop: MOCK_STOPS[1],
        departureTime: new Date(NOW + 66 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 72 * MIN).toISOString(),
        duration: 6 * 60,
        distance: 200,
      },
      // Leg 3: Rail Bern -> Interlaken Ost
      {
        type: 'ROUTE',
        from: MOCK_STOPS[1].coordinates,
        to: MOCK_STOPS[6].coordinates,
        fromStop: MOCK_STOPS[1],
        toStop: MOCK_STOPS[6],
        departureTime: new Date(NOW + 72 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 120 * MIN).toISOString(),
        duration: 48 * 60,
        trip: {
          headSign: 'Interlaken Ost',
          route: {
            id: 'IC61',
            name: 'IC 61',
            shortName: 'IC 61',
            transportMode: TransportMode.RAIL,
          },
          bikesAllowed: true,
          wheelchairAccessible: true,
          stopTimes: [
            // Full Trip: Basel -> Bern -> Thun -> Interlaken
            {
              stop: MOCK_STOPS[2],
              departureTime: new Date(NOW + 12 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 12 * MIN).toISOString(),
            }, // Basel
            {
              stop: MOCK_STOPS[1],
              departureTime: new Date(NOW + 72 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 72 * MIN).toISOString(),
            }, // Bern
            {
              stop: MOCK_STOPS[5],
              departureTime: new Date(NOW + 92 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 92 * MIN).toISOString(),
            }, // Thun
            {
              stop: MOCK_STOPS[6],
              departureTime: new Date(NOW + 120 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 120 * MIN).toISOString(),
            }, // Interlaken
          ],
        },
      },
    ],
  },
  {
    departureTime: new Date(NOW + 15 * MIN).toISOString(),
    arrivalTime: new Date(NOW + 240 * MIN).toISOString(),
    duration: 225 * 60, // 3h 45m
    transfers: 3,
    legs: [
      // Leg 1: Ship Interlaken -> Thun
      {
        type: 'ROUTE',
        from: MOCK_STOPS[6].coordinates,
        to: MOCK_STOPS[5].coordinates,
        fromStop: MOCK_STOPS[6],
        toStop: MOCK_STOPS[5],
        departureTime: new Date(NOW + 15 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 135 * MIN).toISOString(), // 2 hours scenic
        duration: 120 * 60,
        trip: {
          headSign: 'Thun (See)',
          route: {
            id: 'BAT',
            name: 'Schiff',
            shortName: 'BAT',
            transportMode: TransportMode.SHIP,
          },
          bikesAllowed: true,
          wheelchairAccessible: false,
          stopTimes: [
            {
              stop: MOCK_STOPS[6],
              departureTime: new Date(NOW + 15 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 15 * MIN).toISOString(),
            },
            {
              stop: MOCK_STOPS[5],
              departureTime: new Date(NOW + 135 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 135 * MIN).toISOString(),
            },
          ],
        },
      },
      // Leg 2: Transfer Walk
      {
        type: 'WALK',
        from: MOCK_STOPS[5].coordinates,
        to: MOCK_STOPS[5].coordinates,
        fromStop: MOCK_STOPS[5],
        toStop: MOCK_STOPS[5],
        departureTime: new Date(NOW + 135 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 145 * MIN).toISOString(),
        duration: 10 * 60,
        distance: 400,
      },
      // Leg 3: Rail Thun -> Bern
      {
        type: 'ROUTE',
        from: MOCK_STOPS[5].coordinates,
        to: MOCK_STOPS[1].coordinates,
        fromStop: MOCK_STOPS[5],
        toStop: MOCK_STOPS[1],
        departureTime: new Date(NOW + 145 * MIN).toISOString(),
        arrivalTime: new Date(NOW + 165 * MIN).toISOString(),
        duration: 20 * 60,
        trip: {
          headSign: 'Basel SBB',
          route: {
            id: 'IC6',
            name: 'IC 6',
            shortName: 'IC 6',
            transportMode: TransportMode.RAIL,
          },
          bikesAllowed: true,
          wheelchairAccessible: true,
          stopTimes: [
            // Brig -> Thun -> Bern -> Basel
            {
              stop: MOCK_STOPS[5],
              departureTime: new Date(NOW + 145 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 145 * MIN).toISOString(),
            },
            {
              stop: MOCK_STOPS[1],
              departureTime: new Date(NOW + 165 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 165 * MIN).toISOString(),
            },
          ],
        },
      },
      // Leg 4: Rail Bern -> Zurich
      {
        type: 'ROUTE',
        from: MOCK_STOPS[1].coordinates,
        to: MOCK_STOPS[0].coordinates,
        fromStop: MOCK_STOPS[1],
        toStop: MOCK_STOPS[0],
        departureTime: new Date(NOW + 170 * MIN).toISOString(), // 5 min transfer
        arrivalTime: new Date(NOW + 228 * MIN).toISOString(),
        duration: 58 * 60,
        trip: {
          headSign: 'St. Gallen',
          route: {
            id: 'IC1',
            name: 'IC 1',
            shortName: 'IC 1',
            transportMode: TransportMode.RAIL,
          },
          bikesAllowed: true,
          wheelchairAccessible: true,
          stopTimes: [
            // Geneve -> Fribourg -> Bern -> Zurich -> St. Gallen
            {
              stop: MOCK_STOPS[8],
              departureTime: new Date(NOW + 100 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 100 * MIN).toISOString(),
            }, // Geneve
            {
              stop: MOCK_STOPS[1],
              departureTime: new Date(NOW + 170 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 170 * MIN).toISOString(),
            }, // Bern
            {
              stop: MOCK_STOPS[0],
              departureTime: new Date(NOW + 228 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 228 * MIN).toISOString(),
            }, // Zurich
          ],
        },
      },
      // Leg 5: Tram Zurich HB -> Paradeplatz
      {
        type: 'ROUTE',
        from: MOCK_STOPS[0].coordinates,
        to: MOCK_STOPS[4].coordinates,
        fromStop: MOCK_STOPS[0],
        toStop: MOCK_STOPS[4],
        departureTime: new Date(NOW + 235 * MIN).toISOString(), // 7 min transfer
        arrivalTime: new Date(NOW + 240 * MIN).toISOString(),
        duration: 5 * 60,
        trip: {
          headSign: 'Wollishofen',
          route: {
            id: 'T7',
            name: 'Tram 7',
            shortName: 'T 7',
            transportMode: TransportMode.TRAM,
          },
          bikesAllowed: false,
          wheelchairAccessible: true,
          stopTimes: [
            {
              stop: MOCK_STOPS[0],
              departureTime: new Date(NOW + 235 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 235 * MIN).toISOString(),
            },
            {
              stop: MOCK_STOPS[4],
              departureTime: new Date(NOW + 240 * MIN).toISOString(),
              arrivalTime: new Date(NOW + 240 * MIN).toISOString(),
            },
          ],
        },
      },
    ],
  },
];

export const MOCK_DEPARTURES = createZurichDepartures();

export const MOCK_ISOLINES: StopConnection[] = MOCK_STOPS.slice(1).map(
  (stop) => ({
    stop,
    departureTime: new Date().toISOString(),
    arrivalTime: new Date(NOW + 30 * MIN).toISOString(),
    transfers: 0,
    connection: MOCK_CONNECTIONS[0],
    connectingLeg: {
      type: 'ROUTE',
      from: MOCK_STOPS[0].coordinates,
      to: stop.coordinates,
      fromStop: MOCK_STOPS[0],
      toStop: stop,
      departureTime: new Date().toISOString(),
      arrivalTime: new Date().toISOString(),
      duration: 30,
      trip: {
        headSign: stop.name,
        route: {
          id: '1',
          name: 'Mock',
          shortName: 'M1',
          transportMode: TransportMode.BUS,
        },
        bikesAllowed: true,
        wheelchairAccessible: true,
        stopTimes: [
          {
            stop: MOCK_STOPS[0],
            departureTime: new Date().toISOString(),
            arrivalTime: new Date().toISOString(),
          },
          {
            stop: stop,
            departureTime: new Date().toISOString(),
            arrivalTime: new Date().toISOString(),
          },
        ],
      },
    },
  })
);

export const getMockDeparturesForStop = (stopId: string) => {
  if (stopId === '8507000') return createBernDepartures(); // Bern
  return createZurichDepartures(); // Default (Zurich)
};
