/*==================================================
 UTL STUDENTBUS
 INDEX.JS
==================================================*/

/*==========================
 VARIABLES
==========================*/

let map;

let busMarkers = {};

const kolwezi = {

    lat: -10.7144,

    lng: 25.4667

};

const busCount = document.getElementById("busCount");

const studentCount = document.getElementById("studentCount");

const driverCount = document.getElementById("driverCount");

const routeCount = document.getElementById("routeCount");

/*==========================
 INITIALISATION
==========================*/

document.addEventListener(

    "DOMContentLoaded",

    initHome

);

function initHome(){

    loadStatistics();

}

/*==========================
 GOOGLE MAPS
==========================*/

function initHomeMap(){

    map = new google.maps.Map(

        document.getElementById("homeMap"),

        {

            center: kolwezi,

            zoom: 13,

            mapTypeId: "roadmap"

        }

    );

    loadBusLocations();

}
/*==================================================
 STATISTIQUES
==================================================*/

async function loadStatistics(){

    try{

        /*==========================
         BUS
        ==========================*/

        const buses = await db

        .collection("buses")

        .get();

        busCount.textContent = buses.size;

        /*==========================
         ÉTUDIANTS
        ==========================*/

        const students = await db

        .collection("users")

        .where("role","==","student")

        .where("status","==","approved")

        .get();

        studentCount.textContent = students.size;

        /*==========================
         CHAUFFEURS
        ==========================*/

        const drivers = await db

        .collection("users")

        .where("role","==","driver")

        .where("status","==","approved")

        .get();

        driverCount.textContent = drivers.size;

        /*==========================
         TRAJETS
        ==========================*/

        routeCount.textContent = "--"

    }

    catch(error){

        console.error(error);

    }

}
/*==================================================
 LOCALISATION DES BUS
==================================================*/

function loadBusLocations(){

    db.collection("bus_locations")

    .onSnapshot(snapshot=>{

        snapshot.forEach(doc=>{

            const bus = doc.data();

            if(!bus.lat || !bus.lng) return;

            const position = {

                lat: bus.lat,

                lng: bus.lng

            };

            /*==========================
             METTRE À JOUR LE MARQUEUR
            ==========================*/

            if(busMarkers[doc.id]){

                busMarkers[doc.id]

                .setPosition(position);

            }else{

                const marker = new google.maps.Marker({

                    position: position,

                    map: map,

                    title: bus.busNumber,

                    animation: google.maps.Animation.DROP,

                    icon:{

                        url:"https://maps.google.com/mapfiles/ms/icons/bus.png"

                    }

                });

                /*==========================
                 INFO WINDOW
                ==========================*/

                const infoWindow = new google.maps.InfoWindow({

                    content:`

                        <div style="min-width:180px">

                            <h3>${bus.busNumber}</h3>

                            <p>

                                Statut :
                                ${bus.status || "Disponible"}

                            </p>

                        </div>

                    `

                });

                marker.addListener("click",()=>{

                    infoWindow.open({

                        anchor:marker,

                        map:map

                    });

                });

                busMarkers[doc.id]=marker;

            }

        });

    });

}
/*==================================================
 ANIMATION DES COMPTEURS
==================================================*/

function animateCounter(element, target){

    let current = 0;

    const increment = Math.max(1, Math.ceil(target / 50));

    const timer = setInterval(()=>{

        current += increment;

        if(current >= target){

            current = target;

            clearInterval(timer);

        }

        element.textContent = current;

    },20);

}

/*==================================================
 ACTUALISER LES STATISTIQUES
==================================================*/

async function refreshStatistics(){

    try{

        const buses = await db
            .collection("buses")
            .get();

        animateCounter(busCount, buses.size);

        const students = await db
            .collection("users")
            .where("role","==","student")
            .where("status","==","approved")
            .get();

        animateCounter(studentCount, students.size);

        const drivers = await db
            .collection("users")
            .where("role","==","driver")
            .where("status","==","approved")
            .get();

        animateCounter(driverCount, drivers.size);

        routeCount.textContent = "--";

    }

    catch(error){

        console.error(error);

    }

}

/*==================================================
 RAFRAÎCHISSEMENT AUTOMATIQUE
==================================================*/

setInterval(()=>{

    refreshStatistics();

},30000);
/*==================================================
 AJUSTER LA CARTE
==================================================*/

function fitMapToBuses(){

    const markers = Object.values(busMarkers);

    if(markers.length === 0){

        map.setCenter(kolwezi);

        map.setZoom(13);

        return;

    }

    const bounds = new google.maps.LatLngBounds();

    markers.forEach(marker=>{

        bounds.extend(marker.getPosition());

    });

    map.fitBounds(bounds);

}

/*==================================================
 CONNEXION INTERNET
==================================================*/

window.addEventListener("online",()=>{

    console.log("Connexion Internet rétablie.");

});

window.addEventListener("offline",()=>{

    console.log("Connexion Internet perdue.");

});


setInterval(()=>{

    if(map){

        fitMapToBuses();

    }

},10000);
