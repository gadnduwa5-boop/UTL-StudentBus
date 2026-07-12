
const APP_CONFIG = {

    appName: "UTL StudentBus",

    version: "1.0.0",

    themeColor: "#1565c0",

    university: "Université Technologique de Lubumbashi"

};


const MAP_CONFIG = {

    apiKey: "AIzaSyAzKSRiCHiFLv6DTGlnctN20QXHr3NR-NM",

    defaultCenter: {

        lat: -10.7148,

        lng: 25.4729

    },

    defaultZoom: 14,

    mapTypeId: "roadmap"

};

const GPS_CONFIG = {

    enableHighAccuracy: true,

    timeout: 15000,

    maximumAge: 0,

    refreshInterval: 5000

};

const COLLECTIONS = {

    USERS: "users",

    BUSES: "buses",

    ROUTES: "routes",

    STOPS: "bus_stops",

    BUS_LOCATIONS: "bus_locations",

    SETTINGS: "settings",

    NOTIFICATIONS: "notifications"

};

const ROLES = {

    ADMIN: "admin",

    DRIVER: "driver",

    STUDENT: "student"

};