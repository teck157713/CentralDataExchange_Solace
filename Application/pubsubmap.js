var PubSub = function (params) {
    //'use strict';
    var placeholder = "";
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
            //SELECTOR FILTERING
            // e gets the filtering categories
            var e = document.getElementById("filtertype");
            e = e.options[e.selectedIndex].value;
            var result = message.getBinaryAttachment();
            console.log(message.getDestination() + pubsub.topicName + topicID);
            // SELECTOR FILTERING FOR subscribing to Taxi data
            if ((e == 'taxi'|| e == 'default') && String(message.getDestination()).indexOf('LTA/1/taxi_data/raw') >= 0){
                selectorTaxi(result);
            }
            // SELECTOR FILTERING for temperature data
            else if ((e == 'temperature'|| e == 'default') && String(message.getDestination()).indexOf('NEA/1/temp_data/raw') >= 0){
                selectorTemperature(result);
            } 
            // SELECTOR FILTERING for rain data
            else if (e != 'taxi' && String(message.getDestination()).indexOf("NEA/1/rain_data/start") >= 0 || String(message.getDestination()).indexOf("NEA/1/rain_data/stop") >= 0){
                selectorRain(result);
            } 
            // SELECTOR FILTERING for drastic Temperature change
            else if ((e == 'temperature'|| e == 'default') && String(message.getDestination()).indexOf("NEA/1/temp_data/change") >= 0){
                selectorTemperatureChange(result);
            } 
            // SELECTOR FILTERING for image analysis
            else if ((e == 'event'|| e == 'default') && String(message.getDestination()).indexOf("LTA/1/img_data/filter") >= 0 && (pubsub.topicName.indexOf("filter/*/*") >= 0)){
                selectorImage(result);
            }
            else if ((e == 'event'|| e == 'default') && String(message.getDestination()).indexOf("LTA/1/img_data/filter") >= 0 && topicID == 'subscriberMarker'){
                // Add on to Google Maps InfoWindow that marker that has been selected
                // to signifiy the receival of event messages.
                if (infoWindow.getContent() && pubsub.topicName.indexOf("*/*/*") < 0){
                    // infoWindow.setContent(infoWindow.getContent() + "<br>" + result +  "</br>");
                    $.notify(result, "info");
                }
            }
        });
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

    // Subscribes to topic on Solace message router
    pubsub.subscribe = function () {
      try {
        placeholder = pubsub.topicName;
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
