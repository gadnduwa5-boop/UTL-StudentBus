let map;

let trafficLayer;

let directionsService;

let directionsRenderer;

let infoWindow;

let busMarkers = {};

let stopMarkers = {};

let studentMarkers = {};

let driverMarkers = {};

let routePolylines = [];

let selectedBus = null;

let followMode = false;

let searchData=[];

let searchMarkers={};s

/*====================================================
 CHARGEMENT DE GOOGLE MAPS
====================================================*/

function loadGoogleMaps(callback){

    if(window.google && window.google.maps){

        callback();

        return;

    }

    const script = document.createElement("script");

    script.src =
    `https://maps.googleapis.com/maps/api/js?key=${MAP_CONFIG.apiKey}&libraries=geometry,places`;

    script.async = true;

    script.defer = true;

    script.onload = callback;

    document.head.appendChild(script);

}

/*====================================================
 INITIALISATION
====================================================*/

function initMainMap(){

    loadGoogleMaps(()=>{

        createMap();

    });

}

/*====================================================
 CRÉATION DE LA CARTE
====================================================*/

function createMap(){

    map = new google.maps.Map(

        document.getElementById("mainMap"),

        {

            center: MAP_CONFIG.defaultCenter,

            zoom: MAP_CONFIG.defaultZoom,

            mapTypeId: MAP_CONFIG.mapTypeId,

            fullscreenControl:true,

            zoomControl:true,

            streetViewControl:false,

            mapTypeControl:true

        }

    );

    infoWindow = new google.maps.InfoWindow();

    trafficLayer = new google.maps.TrafficLayer();

    directionsService =
    new google.maps.DirectionsService();

    directionsRenderer =
    new google.maps.DirectionsRenderer({

        suppressMarkers:true,

        preserveViewport:true

    });

    directionsRenderer.setMap(map);

    console.log("Google Maps initialisée.");

}
/*====================================================
 GÉOLOCALISATION
====================================================*/

function getCurrentLocation(){

    if(!navigator.geolocation){

        alert("La géolocalisation n'est pas disponible.");

        return;

    }

    navigator.geolocation.getCurrentPosition(

        position=>{

            const latitude = position.coords.latitude;

            const longitude = position.coords.longitude;

            centerMap(latitude,longitude);

            addCurrentLocationMarker(latitude,longitude);

        },

        error=>{

            console.error(error);

            alert("Impossible d'obtenir votre position.");

        },

        GPS_CONFIG

    );

}

/*====================================================
 CENTRER LA CARTE
====================================================*/

function centerMap(latitude,longitude){

    if(!map) return;

    map.setCenter({

        lat:latitude,

        lng:longitude

    });

    map.setZoom(16);

}

/*====================================================
 POSITION ACTUELLE
====================================================*/

function addCurrentLocationMarker(latitude,longitude){

    new google.maps.Marker({

        position:{

            lat:latitude,

            lng:longitude

        },

        map:map,

        title:"Ma position",

        icon:"https://maps.google.com/mapfiles/ms/icons/green-dot.png"

    });

}

/*====================================================
 SUPPRIMER TOUS LES MARQUEURS
====================================================*/

function clearMarkers(collection){

    Object.values(collection).forEach(marker=>{

        marker.setMap(null);

    });

}

/*====================================================
 AJOUTER UN ARRÊT
====================================================*/

function addStopMarker(stop){

    if(stopMarkers[stop.id]){

        stopMarkers[stop.id].setMap(null);

    }

    const marker = new google.maps.Marker({

        position:{

            lat:stop.latitude,

            lng:stop.longitude

        },

        map:map,

        title:stop.name,

        icon:"https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"

    });

    marker.addListener("click",()=>{

        infoWindow.setContent(`

            <strong>${stop.name}</strong><br>

            Stop ID : ${stop.stopId}

        `);

        infoWindow.open(map,marker);

    });

    stopMarkers[stop.id]=marker;

}

/*====================================================
 CHARGER LES ARRÊTS
====================================================*/

async function loadStopsOnMap(){

    try{

        const snapshot = await db

        .collection("bus_stops")

        .get();

        clearMarkers(stopMarkers);

        stopMarkers={};

        snapshot.forEach(doc=>{

            addStopMarker({

                id:doc.id,

                ...doc.data()

            });

        });

    }

    catch(error){

        console.error(error);

    }

}
/*====================================================
 BUS EN TEMPS RÉEL
====================================================*/

function addBusMarker(bus){

    if(!map) return;

    const position={

        lat:bus.latitude,

        lng:bus.longitude

    };

    if(busMarkers[bus.id]){

        busMarkers[bus.id].setPosition(position);

        return;

    }

    const marker=new google.maps.Marker({

        position,

        map,

        title:bus.busNumber || bus.busId,

        icon:"https://maps.google.com/mapfiles/ms/icons/red-dot.png"

    });

    marker.addListener("click",()=>{

        selectedBus=bus;

        showBusInfo(bus);

    });

    busMarkers[bus.id]=marker;

}

/*====================================================
 INFORMATIONS DU BUS
====================================================*/

function showBusInfo(bus){

    const marker=busMarkers[bus.id];

    if(!marker) return;

    infoWindow.setContent(`

        <div style="min-width:220px">

            <h3>${bus.busName || bus.busNumber}</h3>

            <p><strong>Bus ID :</strong> ${bus.busId}</p>

            <p><strong>Vitesse :</strong> ${bus.speed || 0} km/h</p>

            <p><strong>Statut :</strong>

            ${bus.active ? "En service" : "Arrêté"}

            </p>

        </div>

    `);

    infoWindow.open(map,marker);

    updateSelectedBus(bus);

}

/*====================================================
 CHARGER LES BUS
====================================================*/

function loadLiveBuses(){

    db.collection(COLLECTIONS.BUS_LOCATIONS)

    .onSnapshot(snapshot=>{

        clearMarkers(busMarkers);

        busMarkers={};

        const table=document.getElementById("busLiveTable");

        if(table){

            table.innerHTML="";

        }

        let total=0;

        snapshot.forEach(doc=>{

            const bus={

                id:doc.id,

                ...doc.data()

            };

            if(bus.latitude && bus.longitude){

                addBusMarker(bus);

            }

            total++;

            if(table){

                table.innerHTML+=`

                <tr>

                    <td>${bus.busNumber || "-"}</td>

                    <td>${bus.driverName || "-"}</td>

                    <td>${bus.speed || 0} km/h</td>

                    <td>

                        <span class="badge ${bus.active ? "badge-success" : "badge-danger"}">

                            ${bus.active ? "En ligne" : "Hors ligne"}

                        </span>

                    </td>

                    <td>

                        <button

                        class="btn btn-primary"

                        onclick="focusBus('${doc.id}')">

                            <i class="fa-solid fa-location-crosshairs"></i>

                        </button>

                    </td>

                </tr>

                `;

            }

        });

        const count=document.getElementById("onlineBusCount");

        if(count){

            count.textContent=total;

        }

    });

}

/*====================================================
 CENTRER SUR UN BUS
====================================================*/

function focusBus(busId){

    const marker=busMarkers[busId];

    if(!marker) return;

    map.panTo(marker.getPosition());

    map.setZoom(17);

}

/*====================================================
 METTRE À JOUR LE PANNEAU
====================================================*/

function updateSelectedBus(bus){

    const set=(id,value)=>{

        const el=document.getElementById(id);

        if(el) el.textContent=value;

    };

    set("selectedBusId",bus.busId || "-");

    set("selectedDriverName",bus.driverName || "-");

    set("selectedDriverPhone",bus.driverPhone || "-");

    set("selectedSpeed",(bus.speed || 0)+" km/h");

    set("selectedLatitude",bus.latitude || "-");

    set("selectedLongitude",bus.longitude || "-");

    set("selectedLastUpdate",bus.updatedAt || "-");

}
/*====================================================
 ÉTUDIANTS
====================================================*/

function addStudentMarker(student){

    if(!student.latitude || !student.longitude) return;

    const position={

        lat:student.latitude,

        lng:student.longitude

    };

    if(studentMarkers[student.id]){

        studentMarkers[student.id].setPosition(position);

        return;

    }

    const marker=new google.maps.Marker({

        position,

        map,

        title:student.fullName,

        icon:"https://maps.google.com/mapfiles/ms/icons/blue-dot.png"

    });

    marker.addListener("click",()=>{

        infoWindow.setContent(`

            <div>

                <strong>${student.fullName}</strong><br>

                Carte : ${student.cardId}<br>

                Bus : ${student.busId || "-"}

            </div>

        `);

        infoWindow.open(map,marker);

    });

    studentMarkers[student.id]=marker;

}

function loadStudentsOnMap(){

    db.collection(COLLECTIONS.USERS)

    .where("role","==",ROLES.STUDENT)

    .onSnapshot(snapshot=>{

        clearMarkers(studentMarkers);

        studentMarkers={};

        const list=document.getElementById("studentList");

        if(list) list.innerHTML="";

        snapshot.forEach(doc=>{

            const student={

                id:doc.id,

                ...doc.data()

            };

            addStudentMarker(student);

            if(list){

                list.innerHTML+=`

                <div class="list-item">

                    ${student.fullName}

                </div>

                `;

            }

        });

    });

}

/*====================================================
 CHAUFFEURS
====================================================*/

function loadDriversOnMap(){

    db.collection(COLLECTIONS.USERS)

    .where("role","==",ROLES.DRIVER)

    .onSnapshot(snapshot=>{

        const list=document.getElementById("driverList");

        if(list) list.innerHTML="";

        snapshot.forEach(doc=>{

            const driver=doc.data();

            if(list){

                list.innerHTML+=`

                <div class="list-item">

                    ${driver.fullName}

                </div>

                `;

            }

        });

    });

}

/*====================================================
 ITINÉRAIRES
====================================================*/

function clearRouteLines(){

    routePolylines.forEach(line=>{

        line.setMap(null);

    });

    routePolylines=[];

}

function drawPolyline(path,color="#1565c0"){

    const polyline=new google.maps.Polyline({

        path,

        geodesic:true,

        strokeColor:color,

        strokeOpacity:1,

        strokeWeight:5

    });

    polyline.setMap(map);

    routePolylines.push(polyline);

}

async function loadRoutesOnMap(){

    try{

        clearRouteLines();

        const snapshot=await db

        .collection(COLLECTIONS.ROUTES)

        .get();

        snapshot.forEach(doc=>{

            const route=doc.data();

            if(!route.points) return;

            drawPolyline(route.points);

        });

    }

    catch(error){

        console.error(error);

    }

}
/*====================================================
 COUCHE TRAFIC
====================================================*/

function toggleTraffic(){

    if(!trafficLayer) return;

    if(trafficLayer.getMap()){

        trafficLayer.setMap(null);

    }else{

        trafficLayer.setMap(map);

    }

}

/*====================================================
 SATELLITE / PLAN
====================================================*/

function toggleSatellite(){

    if(!map) return;

    const type=map.getMapTypeId();

    map.setMapTypeId(

        type==="roadmap"

        ? "satellite"

        : "roadmap"

    );

}

/*====================================================
 SUIVRE UN BUS
====================================================*/

function followBus(busId){

    selectedBus=busId;

    followMode=true;

}

function stopFollowBus(){

    followMode=false;

    selectedBus=null;

}

/*====================================================
 RAFRAÎCHIR LA CARTE
====================================================*/

function refreshMap(){

    loadLiveBuses();

    loadStopsOnMap();

    loadRoutesOnMap();

    loadStudentsOnMap();

    loadDriversOnMap();

}

/*====================================================
 RECHERCHE GLOBALE
====================================================*/

function searchMap(text){

    text = text.trim().toLowerCase();

    if(text==="") return;

    // ==========================
    // BUS
    // ==========================

    for(const id in busMarkers){

        const marker = busMarkers[id];

        if(marker.getTitle().toLowerCase().includes(text)){

            map.panTo(marker.getPosition());

            map.setZoom(18);

            google.maps.event.trigger(marker,"click");

            return;

        }

    }

    // ==========================
    // ÉTUDIANTS
    // ==========================

    for(const id in studentMarkers){

        const marker = studentMarkers[id];

        if(marker.getTitle().toLowerCase().includes(text)){

            map.panTo(marker.getPosition());

            map.setZoom(18);

            google.maps.event.trigger(marker,"click");

            return;

        }

    }

    // ==========================
    // CHAUFFEURS
    // ==========================

    for(const id in driverMarkers){

        const marker = driverMarkers[id];

        if(marker.getTitle().toLowerCase().includes(text)){

            map.panTo(marker.getPosition());

            map.setZoom(18);

            google.maps.event.trigger(marker,"click");

            return;

        }

    }

    // ==========================
    // ARRÊTS
    // ==========================

    for(const id in stopMarkers){

        const marker = stopMarkers[id];

        if(marker.getTitle().toLowerCase().includes(text)){

            map.panTo(marker.getPosition());

            map.setZoom(18);

            google.maps.event.trigger(marker,"click");

            return;

        }

    }

}
/*====================================================
 GOOGLE DIRECTIONS
====================================================*/

function calculateRoute(origin,destination){

    if(!directionsService) return;

    directionsService.route({

        origin,

        destination,

        travelMode:

        google.maps.TravelMode.DRIVING

    },

    (result,status)=>{

        if(status==="OK"){

            directionsRenderer.setDirections(result);

            const leg=result.routes[0].legs[0];

            const distance=document.getElementById("routeDistance");

            const eta=document.getElementById("routeEta");

            if(distance){

                distance.textContent=

                leg.distance.text;

            }

            if(eta){

                eta.textContent=

                leg.duration.text;

            }

        }

    });

}

/*====================================================
 CENTRER SUR LE BUS SUIVI
====================================================*/

function updateFollowBus(){

    if(!followMode ||

       !selectedBus ||

       !busMarkers[selectedBus]){

        return;

    }

    map.panTo(

        busMarkers[selectedBus]

        .getPosition()

    );

}
/*====================================================
 MISE À JOUR AUTOMATIQUE
====================================================*/

let refreshTimer = null;

function startRealtimeUpdates(){

    if(refreshTimer){

        clearInterval(refreshTimer);

    }

    refreshTimer = setInterval(()=>{

        refreshMap();

        updateFollowBus();

        updateConnectionStatus();

    },5000);

}

function stopRealtimeUpdates(){

    if(refreshTimer){

        clearInterval(refreshTimer);

        refreshTimer = null;

    }

}

/*====================================================
 CONNEXION
====================================================*/

function updateConnectionStatus(){

    const status=document.getElementById("connectionStatus");

    if(!status) return;

    status.textContent=navigator.onLine

    ? "En ligne"

    : "Hors ligne";

}

/*====================================================
 GPS
====================================================*/

function updateGpsStatus(){

    const gps=document.getElementById("gpsStatus");

    if(!gps) return;

    gps.textContent="En ligne";

    const sync=document.getElementById("lastSync");

    if(sync){

        sync.textContent=

        new Date().toLocaleTimeString();

    }

}

/*====================================================
 NETTOYER LA CARTE
====================================================*/

function clearMap(){

    clearMarkers(busMarkers);

    clearMarkers(stopMarkers);

    clearMarkers(studentMarkers);

    clearMarkers(driverMarkers);

    clearRouteLines();

}

/*====================================================
 RAFRAÎCHIR LES STATISTIQUES
====================================================*/

function refreshStatistics(){

    const bus=document.getElementById("onlineBusCount");

    if(bus){

        bus.textContent=

        Object.keys(busMarkers).length;

    }

    const stop=document.getElementById("stopCount");

    if(stop){

        stop.textContent=

        Object.keys(stopMarkers).length;

    }

    const student=document.getElementById("onlineStudentCount");

    if(student){

        student.textContent=

        Object.keys(studentMarkers).length;

    }

}

/*====================================================
 INITIALISATION GÉNÉRALE
====================================================*/

function initializeMapSystem(){

    initMainMap();

    loadLiveBuses();

    loadStopsOnMap();

    loadRoutesOnMap();

    loadStudentsOnMap();

    loadDriversOnMap();

    startRealtimeUpdates();

    updateGpsStatus();

    refreshStatistics();

}

/*====================================================
 ÉVÉNEMENTS
====================================================*/

window.addEventListener("online",updateConnectionStatus);

window.addEventListener("offline",updateConnectionStatus);

window.addEventListener("beforeunload",()=>{

    stopRealtimeUpdates();

});