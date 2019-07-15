// EventMsg.js process each of the incoming messages in central broker, before sending the processed message back to pubsub main broker to publish

// Process Temperature Message to register drastic change in temperature
function TempEventCall(result, pubsub) {
    var dict = JSON.parse("{" + result + "}");
    if (dict['id'] in tempTemp) {
        if (tempTemp[dict['id']].value.length <= 11) {
            tempTemp[dict['id']].value.unshift(dict['value']);
        } else {
            var date1 = new Date(dict['timestamp']);
            var date2 = new Date(tempTemp[dict['id']].timestamp);
            // adds the updated sensor readings to the list once the most updated sensor has reached 5 minutes mark
            if (date1.getTime() - date2.getTime() >= 300000) {
                // if the new readings has a difference of 0.5 degree celcius from the group, processed message will be generated
                if ((Math.abs(dict['value'] - Math.max.apply(null, tempTemp[dict['id']].value)) >= 0.5) || (Math.abs(dict['value'] - Math.min.apply(null, tempTemp[dict['id']].value)) >= 0.5)) {
                    dict['change'] = Math.max(Math.abs(dict['value'] - Math.max.apply(null, tempTemp[dict['id']].value)), Math.abs(dict['value'] - Math.min.apply(null, tempTemp[dict['id']].value)));
                    // Publish the message to the specificed topic
                    pubsub.EventMsg("GOV/NEA/1/temp_data/change", dict);
                    pubsub.log("SEND SUCCESSFUL");
                    tempTemp[dict['id']].value = [dict['value']];
                }
                tempTemp[dict['id']].value.unshift(dict['value']);
                tempTemp[dict['id']].value.pop();
                tempTemp[dict['id']].timestamp = dict['timestamp'];
                pubsub.log(JSON.stringify(tempTemp));
            }
        }
    } else {
        tempTemp[dict['id']] = {
            'value': [dict['value']],
            'timestamp': dict['timestamp'],
            'lat': dict['lat'],
            'long': dict['long']
        };
    }
}
var tempTemp = {};

// Process Rain sensor to register start and stop of the rain's location
function RainEventCall(result, pubsub) {
    var dict = JSON.parse("{" + result + "}");
    if (dict['id'] in tempRain) {
        if (tempRain[dict['id']].value.length <= 1) {
            tempRain[dict['id']].value.unshift(dict['value']);
        } else {
            switch (dict['value'] - tempRain[dict['id']].value[0]) {
                case 1:
                    // Publish the processed message to the specificed topic if the rain starts
                    pubsub.EventMsg("GOV/NEA/1/rain_data/start", dict);
                    pubsub.log("SEND SUCCESSFUL");
                    tempRain[dict['id']].value = [dict['value']];
                    break;
                case -1:
                    // Publish the processed message to the specified topic if the rain stops
                    pubsub.EventMsg("GOV/NEA/1/rain_data/stop", dict);
                    pubsub.log("SEND SUCCESSFUL");
                    tempRain[dict['id']].value = [dict['value']];
                    break;
            }
            tempRain[dict['id']].value.unshift(dict['value']);
            tempRain[dict['id']].value.pop();
            tempRain[dict['id']].timestamp = dict['timestamp'];

        }

    } else {
        tempRain[dict['id']] = {
            'value': [dict['value']],
            'timestamp': dict['timestamp'],
            'lat': dict['lat'],
            'long': dict['long']
        };
    }
}
var tempRain = {};
// Process the image through microsoft computer vision api to get the tags result
function ImageEventCall(result, pubsub, callback) {
    var dict = JSON.parse(result);
    // The processing intends to capture any images on the expressway with these tag elements
    var resvar = ['traffic', 'fire', 'smoke'];
    // Call Microsoft Computer Vision to get the description tags
    processImage(dict['image'], dict['location'], function (imgres, loc, resulvar) {
        var finalres = {};
        finalres['image'] = imgres;
        finalres['lat'] = loc.latitude;
        finalres['long'] = loc.longitude;
        var Topstr = "";
        var temp = "/0";
        // Set a threshold for the accuracy of prediction for the respective tags.
        // For example, if image detected by computer vision has a traffic issue at the accuracy of 0.5,
        // the part of the string for the Topic will be written as LTA/1/img_data/filter/111/0/0
        var cond = {
            "/11": 0.3,
            "/111": 0.5,
            "/1111": 0.65,
            "/11111": 0.8
        };
        for (var i in resvar) {
            for (var k in resulvar.tags) {
                if (resvar[i].indexOf(resulvar.tags[k]['name']) >= 0) {
                    for (var index in cond) {
                        if (resulvar.tags[k]['confidence'] >= cond[index]) {
                            temp = index;
                        }
                    }
                }
            }
            Topstr += temp;
            temp = "/0";
        }
        // Publish the processed message to the specified topic once the picture is analysed
        pubsub.EventMsg("GOV/LTA/1/img_data/filter", finalres, Topstr);
        pubsub.log("SEND SUCCESSFUL");
        callback();
    });
}