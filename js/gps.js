/*=========================================
 UTL STUDENTBUS GPS SERVICE V1
=========================================*/

let gpsWatcher = null;

// ==========================
// Démarrer le GPS
// ==========================

async function startGPS(){

    if(!navigator.geolocation){

        alert("Votre appareil ne supporte pas le GPS.");

        return;

    }

    if(gpsWatcher){

        alert("Le GPS est déjà actif.");

        return;

    }

    const cardId = localStorage.getItem("cardId");

    if(!cardId){

        alert("Utilisateur non connecté.");

        return;

    }

    // Récupérer le chauffeur
    const driverDoc = await db
        .collection("users")
        .doc(cardId)
        .get();

    if(!driverDoc.exists){

        alert("Chauffeur introuvable.");

        return;

    }

    const driver = driverDoc.data();

    const busId = driver.busId;

    if(!busId){

        alert("Aucun bus assigné.");

        return;

    }

    gpsWatcher = navigator.geolocation.watchPosition(

        position => {

            saveLocation(busId, cardId, position);

        },

        error => {

            console.error(error);

            alert("Impossible d'obtenir votre position.");

        },

        {

            enableHighAccuracy:true,

            maximumAge:5000,

            timeout:10000

        }

    );

    document.getElementById("gpsStatus").textContent="ON";

}
/*=========================================
 ENREGISTRER LA POSITION
=========================================*/

async function saveLocation(busId, driverId, position){

    try{

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const speed = position.coords.speed || 0;

        await db.collection("bus_locations")
        .doc(busId)
        .set({

            busId: busId,

            driverId: driverId,

            latitude: latitude,

            longitude: longitude,

            accuracy: accuracy,

            speed: speed,

            status: "En service",

            updatedAt: firebase.firestore.FieldValue.serverTimestamp()

        });

        // Mise à jour du tableau de bord
        const gps = document.getElementById("gpsStatus");

        if(gps){

            gps.textContent = "🟢 ON";

            gps.style.color = "#28a745";

        }

    }

    catch(error){

        console.error(error);

    }

}

/*=========================================
 ARRÊTER LE GPS
=========================================*/

async function stopGPS(){

    if(gpsWatcher){

        navigator.geolocation.clearWatch(gpsWatcher);

        gpsWatcher = null;

    }

    const cardId = localStorage.getItem("cardId");

    if(cardId){

        try{

            const driverDoc = await db
            .collection("users")
            .doc(cardId)
            .get();

            if(driverDoc.exists){

                const driver = driverDoc.data();

                if(driver.busId){

                    await db.collection("bus_locations")
                    .doc(driver.busId)
                    .update({

                        status:"Hors service",

                        updatedAt:firebase.firestore.FieldValue.serverTimestamp()

                    });

                }

            }

        }

        catch(error){

            console.error(error);

        }

    }

    const gps = document.getElementById("gpsStatus");

    if(gps){

        gps.textContent = "🔴 OFF";

        gps.style.color = "#d50012";

    }

}

/*=========================================
 GPS EN COURS ?
=========================================*/

function isGPSRunning(){

    return gpsWatcher !== null;

}