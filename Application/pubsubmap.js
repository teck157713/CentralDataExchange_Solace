var PubSub = function (params) {
    //'use strict';
    var placeholder = "";
    var enumvalue = 0;
    var govdataon = 0;
    var pubsub = {};
    pubsub.temp = {};
    pubsub.session = null;
    pubsub.numOfMessages = 10;
    pubsub.subscribed = false;
    pubsub.topicName = params.topicName || 'topicName'; //topicname content (for simulation data only)
    pubsub.queueName = params.queueName || 'queueName'; //queueName content (for consume only)
    var topicID = params.topicID || 'topicID'; //topicname input id (for sendImage & sendMessage)
    var logname = params.logname || 'logname'; //logger input id (NOT NULL)
    var contentmsg = params.contentmsg || 'content'; //message input id (SEND MESSAGE)
    var contentfile = params.contentfile || 'file';//object file input id if sendImage()
    var tableName = params.tableName || 'table1'; //table input id (NOT NULL)

    //Logger
    pubsub.log = function (line) {
      try {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        line = JSON.stringify(line);
        var logTextArea = document.getElementById(logname);
        logTextArea.innerHTML += timestamp + line + '<br />';
        logTextArea.scrollTop = logTextArea.scrollHeight;
        if (logTextArea.innerHTML.lastIndexOf('<br>') >= 1000){
            logTextArea.innerHTML = logTextArea.innerHTML.substring(logTextArea.innerHTML.indexOf('<br>') + 1);
        }
      } catch (error) {
        alert(error.toString());
      }
    };

    pubsub.log('\n*** Broker is ready to connect ***');

    //table Log
    pubsub.table = function (messagee) {
      try {
        var table = document.getElementById(tableName);
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        cell1.innerHTML = messagee;
      } catch (error) {
        pubsub.log(error.toString());
      }
    }

    // Establishes connection to Solace message router
    pubsub.connect = function (callback) {
        if (pubsub.session !== null) {
            pubsub.log('Already connected and ready to send messages.');
            return;
        }

        var hosturl = account.HOSTURL;
        var username = account.USERNAME;
        var pass = account.PASS;
        var vpn = account.VPN;

        pubsub.log('Connecting to Solace message router using url: ' + hosturl);
        pubsub.log('Client username: ' + username);
        pubsub.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            pubsub.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
                publisherProperties: {
                    acknowledgeMode: solace.MessagePublisherAcknowledgeMode.PER_MESSAGE,
                },
            });
        } catch (error) {
            pubsub.log(error.toString());
        }
        // define session event listeners
        pubsub.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            pubsub.log('=== Successfully connected and ready to send messages. ===');
            callback();
        });
        pubsub.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            pubsub.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        pubsub.session.on(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE, function (sessionEvent) {
            pubsub.log('Delivery of message with correlation key = ' +
                JSON.stringify(sessionEvent.correlationKey) + ' confirmed.');
        });
        pubsub.session.on(solace.SessionEventCode.REJECTED_MESSAGE_ERROR, function (sessionEvent) {
            pubsub.log('Delivery of message with correlation key = ' + JSON.stringify(sessionEvent.correlationKey) +
                ' rejected, info: ' + sessionEvent.infoStr);
        });
        pubsub.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            pubsub.log('Disconnected.');
            pubsub.consuming = false;
            if (pubsub.session !== null) {
                pubsub.session.dispose();
                pubsub.session = null;
            }
        });
        pubsub.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
            pubsub.log('Cannot subscribe to topic: ' + sessionEvent.correlationKey);
        });
        pubsub.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
            if (pubsub.subscribed) {
                pubsub.subscribed = false;
                pubsub.log('Successfully unsubscribed from topic: ' + sessionEvent.correlationKey);
            } else {
                pubsub.subscribed = true;
                pubsub.log('Successfully subscribed to topic: ' + sessionEvent.correlationKey);
                pubsub.log('=== Ready to receive messages. ===');
            }
        });
        // define message event listener
        pubsub.session.on(solace.SessionEventCode.MESSAGE, function (message) {
            var e = document.getElementById("filtertype");
            e = e.options[e.selectedIndex].value;
            var result = message.getBinaryAttachment();
            if ((e == 'taxi'|| e == 'default') && String(message.getDestination()).indexOf('LTA/1/taxi_data/raw') >= 0){
                var dict = JSON.parse(result);
                var locations = [];
                for (var i in dict){
                    var res = {};
                    res['lat'] = dict[i][1];
                    res['lng'] = dict[i][0];
                    locations.push(res);
                    //addMarker(res, map);
                }
                try {
                    deleteMarkers(null, markers);
                    if (markerCluster){
                        markerCluster.clearMarkers();
                    }
                } catch(exception){}

                markers = locations.map(function(location, i) {
                    return new google.maps.Marker({
                      position: location,
                      //label: {color: 'black', fontWeight: 'bold', text: ""},
                      icon: {url:'image/frontal-taxi-cab.png', scaledSize: new google.maps.Size(20,20), anchor: new google.maps.Point(10, 10)},
                    });
                });
          
                // Add a marker clusterer to manage the markers.
                markerCluster = new MarkerClusterer(map, markers,
                    {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
                //markerCluster.clearMarkers();
                
            } else if ((e == 'temperature'|| e == 'default') && String(message.getDestination()).indexOf('NEA/1/temp_data/raw') >= 0){
                var dict2 = JSON.parse("{" + result + "}");
                console.log(result);
                var res2 = {};
                res2['lat'] = Number(dict2['lat']);
                res2['lng'] = Number(dict2['long']);
                var found = false;
                for (var ind in locations2) {
                    if (dict2['id'] == locations2[ind].getTitle()){
                        var setText =locations2[ind].getLabel();
                        setText.text=String(parseFloat(dict2['value']));
                        locations2[ind].setLabel(setText);
                        found = true;
                        break;
                    }
                }
                if(!found){
                    markers2 = new google.maps.Marker({
                        position: res2,
                        title: dict2['id'],
                        label: {color: 'black', fontWeight: 'bold', text: dict2['value']},
                        icon: {url:'image/thermometer.png', scaledSize: new google.maps.Size(30,30), anchor: new google.maps.Point(15, 30), labelOrigin: new google.maps.Point(15,-10)},
                        map: map
                    });
                    // markers2 = new CustomMarker({
                    //     position: res2,
                    //     setMap: map,
                    // });
                    locations2.push(markers2);
                }
                
            } else if (e != 'taxi' && String(message.getDestination()).indexOf("NEA/1/rain_data/start") >= 0 || String(message.getDestination()).indexOf("NEA/1/rain_data/stop") >= 0){
                var dict3 = JSON.parse(result);
                var found = false;
                for (var ind in locations2) {
                    if (dict3['id'] == locations2[ind].getTitle()){
                        var setIcon =locations2[ind].getIcon();
                        switch (dict3['value']){
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
                if(!found){
                    switch (dict3['value']){
                        case "1":
                            for (var ind in locations3){
                                if (dict3['id'] == locations3[ind].getTitle()){
                                    found = true;
                                }
                            }
                            if (!found){
                                markers3 = new google.maps.Marker({
                                    position: {'lat': Number(dict3['lat']), 'lng' : Number(dict3['long'])},
                                    title: dict3['id'],
                                    icon: {url:'image/rain.png', scaledSize: new google.maps.Size(30,30), anchor: new google.maps.Point(15, 15)},
                                    map: map
                                });
                                locations3.push(markers3);
                            }
                            console.log(JSON.stringify(locations3.length));
                            break;
                        case "0":
                            for (var ind in locations3){
                                if (dict3['id'] == locations3[ind].getTitle()){
                                    locations3[ind].setMap(null);
                                    locations3.splice(ind,1);
                                    console.log(JSON.stringify(locations3.length));
                                }
                            }
                            break;
                    }
                }
                
            } else if (e == 'temperature' && String(message.getDestination()).indexOf("NEA/1/temp_data/change") >= 0){
                var dict4 = JSON.parse(result);
                for (var ind in locations2) {
                    if (dict4['id'] == locations2[ind].getTitle()){
                        var tempurl =locations2[ind].getIcon().url;
                        var Iconset =locations2[ind].getIcon();
                        Iconset.url='image/thermometer-red.png';
                        locations2[ind].setIcon(Iconset);
                        placeholder = setTimeout(function(){
                            Iconset.url=tempurl;
                            locations2[ind].setIcon(Iconset);
                        }, 60000);
                        break;
                    }
                }
            } else if (e == 'default' && String(message.getDestination()).indexOf("LTA/1/img_data/filter") >= 0){
                var lst = JSON.parse(result);
                markers3 = new google.maps.Marker({
                    position: {'lat': Number(lst['location']['latitude']), 'lng' : Number(lst['location']['longitude'])},
                    title: lst['image'],
                    icon: {url:'image/thermometer-red.png', scaledSize: new google.maps.Size(30,30), anchor: new google.maps.Point(15, 15)},
                    map: map
                });
                placeholder = setTimeout(function(){
                    deleteMarkers(null, markers3);
                }, 60000);
            }
            
        });

        function validURL(str) {
          var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
          return !!pattern.test(str);
        }

        pubsub.connectToSolace();

    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    pubsub.connectToSolace = function () {
        try {
            pubsub.session.connect();
        } catch (error) {
            pubsub.log(error.toString());
        }
    };

    //***have to be revisited
    pubsub.sendMessages = function () {
        if (pubsub.session !== null) {
          try {
            if (document.getElementById(contentmsg).value != ''){
              pubsub.sendMessage();
            }
          } catch (error) {
              producer.log(error.toString());
          }
          try {
            if (document.getElementById(contentfile).value != ''){
              pubsub.sendImage();
            }
          } catch (error) {
              producer.log(error.toString());
          }
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    //Initiate govData Sending
    pubsub.sendgovdata = function () {
      govdataon = setInterval(pubsub.sendGovText, 5000);
      pubsub.log('Publishing, the interval has been started.');
    }

    pubsub.stopgovdata = function () {
      clearInterval(govdataon);
      pubsub.log('Publishing has been stopped.');
    }

    pubsub.sendGovText = function () {
        if (pubsub.session !== null) {
            processgov("https://api.data.gov.sg/v1/transport/traffic-images", function(resdict){
                resdict = resdict.items[0].cameras;
                pubsub.sendtrafficimg("LTA/1/img_data/raw", resdict[enumvalue]);
            });
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    //Initiate taxi availability
    pubsub.sendtaxidata = function () {
        taxidataon = setInterval(pubsub.sendTaxiText, 5000);
        pubsub.log('Publishing, the interval has been started.');
      }
  
      pubsub.stoptaxidata = function () {
        clearInterval(taxidataon);
        pubsub.log('Publishing has been stopped.');
      }
  
      pubsub.sendTaxiText = function () {
          if (pubsub.session !== null) {
              processgov("https://api.data.gov.sg/v1/transport/taxi-availability", function(resdict){
                resdict = resdict.features[0].geometry.coordinates;
                pubsub.sendtrafficimg("LTA/1/taxi_data/raw", resdict);
              });
          } else {
              pubsub.log('Cannot send messages because not connected to Solace message router.');
          }
      }



    pubsub.sendtrafficimg = function (topName, result) {
        try {
          enumvalue += 1;
          sequenceNr = enumvalue;
          var statictopicName = topName;
          var messageText = JSON.stringify(result);
          var message = solace.SolclientFactory.createMessage();
          message.setDestination(solace.SolclientFactory.createTopicDestination(statictopicName));
          message.setBinaryAttachment(messageText);
          message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
          try {
              pubsub.session.send(message);
              pubsub.log('Message #' + messageText + ' sent to topic "' + statictopicName + '"');
          } catch (error) {
              pubsub.log(error.toString());
          }
        } catch (error) {
            producer.log(error.toString());
        }
      };

    //Initiate tempData Sending
    pubsub.pubTemp = function () {
      TempOn = setInterval(pubsub.sendTempData, 5000);
      pubsub.log('Publishing, the interval has been started.');
    }

    pubsub.stoppubTemp = function () {
      clearInterval(TempOn);
      pubsub.log('Publishing has been stopped.');
    }

    pubsub.sendTempData = function () {
        if (pubsub.session !== null) {
            processTemp("https://api.data.gov.sg/v1/environment/air-temperature", function(resdict){
                pubsub.sendTempMsg("NEA/1/temp_data/raw", resdict);
            });
            processTemp("https://api.data.gov.sg/v1/environment/rainfall", function(resrain){
                pubsub.sendTempMsg("NEA/1/rain_data/raw", resrain);
            });
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    // Sends one picture with tags of topics
    pubsub.sendTempMsg = function (topName, result) {
        for (var i = 0; i < result.length; i ++){
          var messageText = '\"id\": \"' + result[i].id + '\", \"lat\": \"' + result[i].location.latitude + '\", \"long\": \"' + result[i].location.longitude + '\", \"value\": \"' + result[i].value + '\", \"timestamp\": \"' + result[i].timestamp + '\"';
          var message = solace.SolclientFactory.createMessage();
          setTopic(result[i].location.latitude, result[i].location.longitude);
        }

        function setTopic(x, y){
          message.setDestination(solace.SolclientFactory.createTopicDestination( topName + '/' + x + '/' + y));
          message.setBinaryAttachment(messageText);
          message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
          const correlationKey = {
              name: "MESSAGE_CORRELATIONKEY",
              id: messageText,
          };
          message.setCorrelationKey(correlationKey);
          try {
              pubsub.session.send(message);
              pubsub.log('Message #' + messageText + ' sent to queue "' + topName + '"' + JSON.stringify(correlationKey));
          } catch (error) {
              pubsub.log(error.toString());
          }
        }

    };

    // Sends one message
    pubsub.sendMessage = function () {
      try {
        enumvalue += 1;
        sequenceNr = enumvalue;
        var statictopicName = document.getElementById(topicID).value;
        var messageText = document.getElementById(contentmsg).value;
        var message = solace.SolclientFactory.createMessage();
        message.setDestination(solace.SolclientFactory.createTopicDestination(statictopicName));
        message.setBinaryAttachment(messageText);
        message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
        // Define a correlation key object
        const correlationKey = {
            name: "MESSAGE_CORRELATIONKEY",
            id: sequenceNr,
        };
        message.setCorrelationKey(correlationKey);
        try {
            pubsub.session.send(message);
            pubsub.log('Message #' + sequenceNr + ' sent to queue "' + statictopicName + '", correlation key = ' + JSON.stringify(correlationKey));
        } catch (error) {
            pubsub.log(error.toString());
        }
      } catch (error) {
        pubsub.log(error.toString());
      }
    };

    // Sends one image
    pubsub.sendImage = function () {
      try {
        enumvalue += 1;
        sequenceNr = enumvalue;
        var statictopicName = document.getElementById(topicID).value;
        var file = document.getElementById(contentfile).files[0];
        var reader = new FileReader();
        var fileByteArray = [];
        reader.readAsArrayBuffer(file);
        reader.onloadend = function (evt){
            if (evt.target.readyState == FileReader.DONE){
                var arrayBuffer = evt.target.result, array = new Uint8Array(arrayBuffer);
                for (var i = 0; i < array.length; i++){
                    fileByteArray.push(array[i]);
                }

                var message = solace.SolclientFactory.createMessage();
                message.setDestination(solace.SolclientFactory.createTopicDestination(statictopicName));
                message.setBinaryAttachment(fileByteArray.toString());
                message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
                // Define a correlation key object
                const correlationKey = {
                    name: "MESSAGE_CORRELATIONKEY",
                    id: sequenceNr,
                };
                message.setCorrelationKey(correlationKey);
                try {
                    pubsub.session.send(message);
                    pubsub.log('Message #' + sequenceNr + ' sent to queue "' + statictopicName + '", correlation key = ' + JSON.stringify(correlationKey));
                } catch (error) {
                    pubsub.log(error.toString());
                }

            }
        }
      } catch (error) {
          pubsub.log(error.toString());
      }
    };

    // Subscribes to topic on Solace message router
    pubsub.subscribe = function () {
      try {
        placeholder = document.getElementById(topicID).value;
        if (pubsub.session !== null) {
            if (pubsub.subscribed) {
                pubsub.log('Already subscribed to "' + placeholder
                    + '" and ready to receive messages.');
            } else {
                pubsub.log('Subscribing to topic: ' + placeholder);
                try {
                    pubsub.session.subscribe(
                        solace.SolclientFactory.createTopicDestination(placeholder),
                        true, // generate confirmation when subscription is added successfully
                        placeholder, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    pubsub.log(error.toString());
                }
            }
        } else {
            pubsub.log('Cannot subscribe because not connected to Solace message router.');
        }
      } catch (error) {
          pubsub.log(error.toString());
      }
    };

    // Unsubscribes from topic on Solace message router
    pubsub.unsubscribe = function () {
      try {
        if (pubsub.session !== null) {
            if (pubsub.subscribed) {
                pubsub.log('Unsubscribing from topic: ' + placeholder);
                try {
                    pubsub.session.unsubscribe(
                        solace.SolclientFactory.createTopicDestination(placeholder),
                        true, // generate confirmation when subscription is removed successfully
                        placeholder, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                    placeholder = "";
                } catch (error) {
                    pubsub.log(error.toString());
                }
            } else {
                pubsub.log('Cannot unsubscribe because not subscribed to the topic "'
                    + placeholder + '"');
            }
        } else {
            pubsub.log('Cannot unsubscribe because not connected to Solace message router.');
        }
      } catch (error) {
          producer.log(error.toString());
      }
    };

    // Starts consuming from a queue on Solace message router
    pubsub.startConsume = function () {
        if (pubsub.session !== null) {
            if (pubsub.consuming) {
                pubsub.log('Already started consumer for queue "' + pubsub.queueName + '" and ready to receive messages.');
            } else {
                pubsub.log('Starting consumer for queue: ' + pubsub.queueName);
                try {
                    // Create a message consumer
                    pubsub.messageConsumer = pubsub.session.createMessageConsumer({
                        // solace.MessageConsumerProperties
                        queueDescriptor: { name: pubsub.queueName, type: solace.QueueType.QUEUE },
                        acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT, // Enabling Client ack
                    });
                    // Define message consumer event listeners
                    pubsub.messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
                        pubsub.consuming = true;
                        pubsub.log('=== Ready to receive messages. ===');
                    });
                    pubsub.messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, function () {
                        pubsub.consuming = false;
                        pubsub.log('=== Error: the message consumer could not bind to queue "' + pubsub.queueName +
                            '" ===\n   Ensure this queue exists on the message router vpn');
                    });
                    pubsub.messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
                        pubsub.consuming = false;
                        pubsub.log('=== The message consumer is now down ===');
                    });
                    pubsub.messageConsumer.on(solace.MessageConsumerEventName.DOWN_ERROR, function () {
                        pubsub.consuming = false;
                        pubsub.log('=== An error happened, the message consumer is down ===');
                    });
                    // Define message received event listener
                    pubsub.messageConsumer.on(solace.MessageConsumerEventName.MESSAGE, function (message) {
                        var result = message.getBinaryAttachment();
                        if (String(message.getDestination()).indexOf('LTA/temp') >= 0){
                          var dict = JSON.parse("{" + result + "}");
                          pubsub.table(dict);
                          message.acknowledge();
                        } else {
                          // assuming if message is a message if less than 255, else image
                          if (result.length < 255) {
                              pubsub.log('Received message: "' + result + '",' +
                              ' details:\n' + message.dump());
                              // Need to explicitly ack otherwise it will not be deleted from the message router
                              pubsub.table(message.getBinaryAttachment());
                              message.acknowledge();
                              pubsub.temp = {'content' : result, 'topic' : message.getDestination(), 'delivery' : message.getDeliveryMode()};

                          } else {
                              //convert and show image
                              var imgbyte = result.split(",");
                              var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(imgbyte)));
                              pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"data:image/png;base64,' + base64String + '\" />');
                              pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + base64String + '\" />')
                              message.acknowledge();
                              pubsub.temp = {'image': '<img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + result.split(',')[0] + '\" />', 'content' : result, 'topic' : message.getDestination(), 'delivery' : message.getDeliveryMode()};
                          }

                        }

                    });
                    // Connect the message consumer
                    pubsub.messageConsumer.connect();
                } catch (error) {
                    pubsub.log(error.toString());
                }
            }
        } else {
            pubsub.log('Cannot start the queue consumer because not connected to Solace message router.');
        }
    };

    // Disconnects the consumer from queue on Solace message router
    pubsub.stopConsume = function () {
        if (pubsub.session !== null) {
            if (pubsub.consuming) {
                pubsub.consuming = false;
                pubsub.log('Disconnecting consumption from queue: ' + pubsub.queueName);
                try {
                    pubsub.messageConsumer.disconnect();
                    pubsub.messageConsumer.dispose();
                } catch (error) {
                    pubsub.log(error.toString());
                }
            } else {
                pubsub.log('Cannot disconnect the consumer because it is not connected to queue "' +
                    pubsub.queueName + '"');
            }
        } else {
            pubsub.log('Cannot disconnect the consumer because not connected to Solace message router.');
        }
    };


    // Gracefully disconnects from Solace message router
    pubsub.disconnect = function () {
        pubsub.log('Disconnecting from Solace message router...');
        if (pubsub.session !== null) {
            try {
                pubsub.session.disconnect();
            } catch (error) {
                pubsub.log(error.toString());
            }
        } else {
            pubsub.log('Not connected to Solace message router.');
        }
    };

    return pubsub;
};
