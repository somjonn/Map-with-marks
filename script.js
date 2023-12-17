let savedMarkers; 
let markersLayer; 
let map; 
let lastDeletedMarker; 

function addMarker(latlng, comment) {
    const existingMarker = findMarkerByLatLng(latlng);
    if (existingMarker) {
        return;
    }

    const newMarker = L.marker(latlng).addTo(markersLayer);

    let popupContent = `Широта: ${latlng.lat.toFixed(6)}, Долгота: ${latlng.lng.toFixed(6)}`;
    if (comment) {
        popupContent += `<br>Комментарий: ${comment}`;
    }
    newMarker.bindPopup(popupContent);

    addToCoordinatesList(latlng, comment);

    newMarker.on('mouseover', function () {
        newMarker.openPopup();
    });

    newMarker.on('mouseout', function () {
        newMarker.closePopup();
    });

    savedMarkers.push({ latlng: latlng, comment: comment });
    localStorage.setItem('markers', JSON.stringify(savedMarkers));
}

function findMarkerByLatLng(latlng) {
    let foundMarker = null;
    markersLayer.eachLayer(function (layer) {
        const layerLatLng = layer.getLatLng();
        if (layerLatLng.lat === latlng.lat && layerLatLng.lng === latlng.lng) {
            foundMarker = layer;
        }
    });
    return foundMarker;
}

function addToCoordinatesList(latlng, comment) {
    const coordinatesList = document.getElementById('coordinatesList');
    const listItem = document.createElement('li');
    listItem.textContent = `Широта: ${latlng.lat.toFixed(6)}, Долгота: ${latlng.lng.toFixed(6)}`;

    if (comment) {
        listItem.textContent += `, Комментарий: ${comment}`;
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить метку';
    deleteButton.onclick = function () {
        lastDeletedMarker = { latlng: latlng, comment: comment };
        markersLayer.eachLayer(function (layer) {
            const layerLatLng = layer.getLatLng();
            if (layerLatLng.lat === latlng.lat && layerLatLng.lng === latlng.lng) {
                markersLayer.removeLayer(layer);
                removeFromLocalStorage(latlng);
                removeFromCoordinatesList(latlng);
            }
        });
    };
    listItem.appendChild(deleteButton);

    coordinatesList.appendChild(listItem);
}

function removeFromCoordinatesList(latlng) {
    const coordinatesList = document.getElementById('coordinatesList');
    const items = coordinatesList.getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        const listItemText = items[i].textContent;
        if (listItemText.includes(`Широта: ${latlng.lat.toFixed(6)}, Долгота: ${latlng.lng.toFixed(6)}`)) {
            coordinatesList.removeChild(items[i]);
            break;
        }
    }
}

function removeFromLocalStorage(latlng) {
    savedMarkers = savedMarkers.filter(function (marker) {
        return marker.latlng.lat !== latlng.lat || marker.latlng.lng !== latlng.lng;
    });
    localStorage.setItem('markers', JSON.stringify(savedMarkers));
}

function restoreLastDeletedMarker() {
    if (lastDeletedMarker) {
        addMarker(lastDeletedMarker.latlng, lastDeletedMarker.comment);
        lastDeletedMarker = null;
    } else {
        alert("Нет маркеров для восстановления.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    map = L.map('map').setView([51.505, -0.09], 13);
    markersLayer = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; Участники OpenStreetMap'
    }).addTo(map);

    savedMarkers = JSON.parse(localStorage.getItem('markers')) || [];

    savedMarkers.forEach(function (markerData) {
        addMarker(markerData.latlng, markerData.comment);
    });

    map.on('click', function (e) {
        const comment = prompt("Введите комментарий:");
        addMarker(e.latlng, comment);
    });
});

function searchByCoordinates() {
    const latInput = document.getElementById('latInput').value;
    const lngInput = document.getElementById('lngInput').value;

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (!isNaN(lat) && !isNaN(lng)) {
        let found = false;
        markersLayer.eachLayer(function (layer) {
            const layerLatLng = layer.getLatLng();
            if (layerLatLng.lat === lat && layerLatLng.lng === lng) {
                found = true;
                map.panTo([lat, lng]);
                layer.openPopup();
            }
        });

        if (!found) {
            const addMarkerResponse = confirm("Хотите добавить метку по найденным координатам?");
            if (addMarkerResponse) {
                const comment = prompt("Введите комментарий:");
                addMarker({ lat: lat, lng: lng }, comment);
            } else {
                alert("Метка не найдена на карте.");
            }
        }
    } else {
        alert("Некорректные координаты.");
    }
}

function clearLocalStorage() {
    localStorage.removeItem('markers');
    savedMarkers = [];
    markersLayer.clearLayers();

    const coordinatesList = document.getElementById('coordinatesList');
    coordinatesList.innerHTML = '';
}
