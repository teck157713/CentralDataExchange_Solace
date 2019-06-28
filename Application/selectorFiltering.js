function selectorTaxi(result){
    var dict = JSON.parse(result);
    var found = false;
    // Loops through stored taxi markers to update marker position respectively
    for (var ind in locations){
        if (locations[ind].getTitle() == Object.keys(dict)[0]){
            var latlng = new google.maps.LatLng(dict[locations[ind].getTitle()][0], dict[locations[ind].getTitle()][1]);
            locations[ind].setPosition(latlng);
            infoWindowUpdate(locations[ind]);
            found = true;
            break;
        }
    }
    // If the marker is new, create new marker to be stored
    if(!found){
        markers2 = new google.maps.Marker({
            position: new google.maps.LatLng(dict[Object.keys(dict)[0]][0], dict[Object.keys(dict)[0]][1]),
            title: Object.keys(dict)[0],
            icon: {url:'image/frontal-taxi-cab.png', scaledSize: new google.maps.Size(20,20), anchor: new google.maps.Point(10, 10)},
            map: map
        });
        // Adds each marker the ability to subscribe for event messages when clicked
        google.maps.event.addListener(markers2, 'click', function(){
            map.setZoom(15);
            map.panTo(this.getPosition());
            infoWindow.setContent('<div style="font-family: Lucida Grande, Arial, sans-serif;">'+'<div id="title">'+ this.getTitle() +'</div><br><div id="h4">' + String(this.getPosition()) + '</div><br></div>');
            infoWindow.open(map, this);
            subscriberMarker.unsubscribe();
            subscriberMarker.topicName = "GOV/LTA/1/img_data/filter/" + (Math.floor(this.getPosition().lat() * 100) / 100).toFixed(2) + '*/' + (Math.floor(this.getPosition().lng() * 100) / 100).toFixed(2) + "*/>";
            // Rectangle (radius of marker) helps to identify the area each marker is subscribed to.
            // The event message only appears if the event happens within its area.) 
            rectangle.setBounds({
                north: Math.floor(this.getPosition().lat() * 100) / 100,
                south: Math.floor(this.getPosition().lat() * 100) / 100 + 0.01,
                west: Math.floor(this.getPosition().lng() * 100) / 100,
                east: Math.floor(this.getPosition().lng() * 100) / 100 + 0.01
            });
            rectangle.setMap(map);
            setTimeout(function () {
                subscriberMarker.subscribe();
            }, 500);
        });
        locations.push(markers2);
    }
}

function selectorTemperature(result){
    // Converts data into readable Google maps position
    var dict = JSON.parse("{" + result + "}");
    var res2 = {};
    res2['lat'] = Number(dict['lat']);
    res2['lng'] = Number(dict['long']);
    // Loops through stored markers to update temperature value
    var found = false;
    for (var ind in locations2) {
        if (dict['id'] == locations2[ind].getTitle()){
            var setText =locations2[ind].getLabel();
            setText.text=String(parseFloat(dict['value']));
            locations2[ind].setLabel(setText);
            found = true;
            break;
        }
    }
    // If the marker is new, create new marker and store
    if(!found){
        markers2 = new google.maps.Marker({
            position: res2,
            title: dict['id'],
            label: {color: 'black', fontWeight: 'bold', text: dict['value']},
            icon: {url:'image/thermometer.png', scaledSize: new google.maps.Size(30,30), anchor: new google.maps.Point(15, 30), labelOrigin: new google.maps.Point(15,-10)},
            map: map
        });
        locations2.push(markers2);
    }
}

function selectorRain(result){
    var dict = JSON.parse(result);
    // Loops through stored value to update the rain data
    var found = false;
    for (var ind in locations2) {
        if (dict['id'] == locations2[ind].getTitle()){
            var setIcon =locations2[ind].getIcon();
            switch (dict['value']){
                case "1":
                    setIcon.url='image/rain.png';
                    break;
                case "0":
                    setIcon.url='image/thermometer.png';
                    break;
            }
            locations2[ind].setIcon(setIcon);
            found = true;
            break;
        }
    }
    // If the rain location is new, create new marker
    if(!found){
        // The marker will only be shown if the data shows the location is raining.
        switch (dict['value']){
            // Show data if the rain starts
            case "1":
                for (var ind in locations3){
                    if (dict['id'] == locations3[ind].getTitle()){
                        found = true;
                    }
                }
                if (!found){
                    markers2 = new google.maps.Marker({
                        position: {'lat': Number(dict['lat']), 'lng' : Number(dict['long'])},
                        title: dict['id'],
                        icon: {url:'image/rain.png', scaledSize: new google.maps.Size(30,30), anchor: new google.maps.Point(15, 15)},
                        map: map
                    });
                    locations3.push(markers2);
                }
                console.log(JSON.stringify(locations3.length));
                break;
            // Hide data if the rain stops
            case "0":
                for (var ind in locations3){
                    if (dict['id'] == locations3[ind].getTitle()){
                        locations3[ind].setMap(null);
                        locations3.splice(ind,1);
                        console.log(JSON.stringify(locations3.length));
                    }
                }
                break;
        }
    }
}

function selectorTemperatureChange(result){
    var dict = JSON.parse(result);
    // Loops through the stored data to check for matching ID
    for (var ind in locations2) {
        if (dict['id'] == locations2[ind].getTitle()){
            //Icon will be changed and display for a minute, before reverting back its state
            var tempurl =locations2[ind].getIcon().url;
            var Iconset =locations2[ind].getIcon();
            Iconset.url='image/thermometer-red.png';
            locations2[ind].setIcon(Iconset);
            this.placeholder = setTimeout(function(){
                Iconset.url=tempurl;
                locations2[ind].setIcon(Iconset);
            }, 60000);
            break;
        }
    }
}

function selectorImage(result){
    var dict = JSON.parse(result);
    // Create the marker to highlight event
    markers1 = new CustomMarker({
        position: new google.maps.LatLng(dict['lat'], dict['long']),
        map: map,
    });
    setTimeout(function(){
        $('#drop').click();
    }, 50);

}

// Adds each marker the ability to subscribe for event messages when clicked
function addMarkerEvent(marker){
    subscriberMarker.unsubscribe();
    subscriberMarker.topicName = "GOV/LTA/1/img_data/filter/" + (Math.floor(marker.getPosition().lat() * 100) / 100).toFixed(2) + '*/' + (Math.floor(marker.getPosition().lng() * 100) / 100).toFixed(2) + "*/"+ ((FilterInput != '') ? FilterInput : ">");
    // Rectangle (radius of marker) helps to identify the area each marker is subscribed to.
    // The event message only appears if the event happens within its area.) 
    rectangle.setBounds({
        north: Math.floor(marker.getPosition().lat() * 100) / 100,
        south: Math.floor(marker.getPosition().lat() * 100) / 100 + 0.01,
        west: Math.floor(marker.getPosition().lng() * 100) / 100,
        east: Math.floor(marker.getPosition().lng() * 100) / 100 + 0.01
    });
    rectangle.setMap(map);
    setTimeout(function () {
        subscriberMarker.subscribe();
    }, 500);
}