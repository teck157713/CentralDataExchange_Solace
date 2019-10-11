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
    var contentfile = params.contentfile || 'file'; //object file input id if sendImage()
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
            if (logTextArea.innerHTML.lastIndexOf('<br>') >= 1000) {
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
    pubsub.connect = function () {
        if (pubsub.session !== null) {
            pubsub.log('Already connected and ready to send messages.');
            return;
        }
        switch (topicID) {
            case "publishtopicLTA":
                var hosturl = LTA.HOSTURL;
                var username = LTA.USERNAME;
                var pass = LTA.PASS;
                var vpn = LTA.VPN;
                break;
            case "publishtopicNEA":
                var hosturl = NEA.HOSTURL;
                var username = NEA.USERNAME;
                var pass = NEA.PASS;
                var vpn = NEA.VPN;
                break;
            case "newReg":
                var hosturl = newReg.HOSTURL;
                var username = newReg.USERNAME;
                var pass = newReg.PASS;
                var vpn = newReg.VPN;
                break;
            default:
                var hosturl = host.HOSTURL;
                var username = host.USERNAME;
                var pass = host.PASS;
                var vpn = host.VPN;
                break;
        }

        pubsub.log('Connecting to Solace message router using url: ' + hosturl);
        pubsub.log('Client username: ' + username);
        pubsub.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            pubsub.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url: hosturl,
                vpnName: vpn,
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
            var result = message.getBinaryAttachment();
            // assuming message is not an image if less than 255 character, instead it's a msg
            if (validURL(JSON.parse("{" + result + "}").imageurl)) {
                pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"' + JSON.parse("{" + result + "}").imageurl + '\" />' + ', message: ' + result + ', details:\n' + message.dump());
                pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"' + JSON.parse("{" + result + "}").imageurl + '\" />' + result);
                pubsub.temp = {
                    'image': '<img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"' + JSON.parse("{" + result + "}").imageurl + '\" />',
                    'content': result,
                    'topic': message.getDestination(),
                    'delivery': message.getDeliveryMode()
                };
            } else if (result.length < 255) {
                pubsub.log('Received message: "' + result + '", details:\n' + message.dump());
                pubsub.table(result);
                pubsub.temp = {
                    'content': result,
                    'topic': message.getDestination(),
                    'delivery': message.getDeliveryMode()
                };
            } else {
                var imgbyte = result.split(",");
                var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(imgbyte)));
                pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"data:image/png;base64,' + base64String + '\" />' + ', details:\n' + message.dump());
                pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + base64String + '\" />');
                pubsub.temp = {
                    'image': '<img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + result.split(",") + '\" />',
                    'content': result,
                    'topic': message.getDestination(),
                    'delivery': message.getDeliveryMode()
                };
            }


        });

        function validURL(str) {
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
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
                if (document.getElementById(contentmsg).value != '') {
                    pubsub.sendMessage();
                }
            } catch (error) {
                producer.log(error.toString());
            }
            try {
                if (document.getElementById(contentfile).value != '') {
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
            processgov("https://api.data.gov.sg/v1/transport/traffic-images", function lambda(resdict) {
                resdict = resdict.items[0].cameras;
                if (resdict.length > enumvalue) {
                    if (enumvalue % 10 == 0) {
                        resdict[enumvalue]['image'] = "https://i2-prod.bristolpost.co.uk/news/bristol-news/article2573914.ece/ALTERNATES/s1200/2_D0BBDEHXcAM47uY.jpg";
                    }
                    pubsub.sendtrafficimg("GOV/LTA/1/img_data/raw", resdict[enumvalue]);
                } else {
                    enumvalue = 0;
                }
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
            processgov("https://api.data.gov.sg/v1/transport/taxi-availability", function (resdict) {
                resdict = resdict.features[0].geometry.coordinates;
                pubsub.sendtrafficimg("GOV/LTA/1/taxi_data/raw", resdict);
            });
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    pubsub.sendTaxiInterval = function () {
        taxidataon = setInterval(pubsub.sendRealTimeTaxi, 100);
        pubsub.log('Publishing, the interval has been started.');
    }

    var taxitemp = {};
    pubsub.sendRealTimeTaxi = function () {
        if (pubsub.session !== null) {
            var taxiid = "T" + String(Math.floor(Math.random() * 30) + 1);
            if (taxitemp[taxiid]) {
                taxitemp[taxiid][0] = parseFloat((taxitemp[taxiid][0] + rand_move()).toFixed(4));
                taxitemp[taxiid][1] = parseFloat((taxitemp[taxiid][1] + rand_move()).toFixed(4));
                pubsub.sendtrafficimg("GOV/LTA/1/taxi_data/raw", {
                    [taxiid]: taxitemp[taxiid]
                });
            } else {
                processgov("https://api.data.gov.sg/v1/transport/taxi-availability", function (resdict) {
                    resdict = resdict.features[0].geometry.coordinates;
                    var rand = Math.floor(Math.random() * (resdict.length - 1));
                    var taxi_x = parseFloat(resdict[rand][1].toFixed(4));
                    var taxi_y = parseFloat(resdict[rand][0].toFixed(4));
                    taxitemp[taxiid] = [taxi_x, taxi_y];
                    pubsub.sendtrafficimg("GOV/LTA/1/taxi_data/raw", {
                        [taxiid]: taxitemp[taxiid]
                    });
                });
            }

        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }

        function rand_move() {
            return parseFloat((Math.random() * 0.0008 + (-0.0004)).toFixed(4));
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
            pubsub.log(error.toString());
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
            // const ChangeRainValue = x => x.value = Math.round(Math.random());
            processTemp("https://api.data.gov.sg/v1/environment/air-temperature", function (resdict) {
                pubsub.sendTempMsg("GOV/NEA/1/temp_data/raw", resdict);
            });
            processTemp("https://api.data.gov.sg/v1/environment/rainfall", function (resrain) {
                // resrain.map(ChangeRainValue);
                pubsub.sendTempMsg("GOV/NEA/1/rain_data/raw", resrain);
            });
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    
    // Sends one picture with tags of topics
    pubsub.sendTempMsg = function (topName, result) {
        returnvalue = x => (topName.indexOf('NEA/1/temp_data/raw') >= 0) ? String(parseFloat((x + parseFloat((Math.random() * 0.2)) - 0.1).toFixed(1))) : String(x);
        for (var i = 0; i < result.length; i++) {
            var messageText = '\"id\": \"' + result[i].id + '\", \"lat\": \"' + result[i].location.latitude + '\", \"long\": \"' + result[i].location.longitude + '\", \"value\": \"' + returnvalue(result[i].value) + '\", \"timestamp\": \"' + result[i].timestamp + '\"';
            var message = solace.SolclientFactory.createMessage();
            setTopic(result[i].location.latitude, result[i].location.longitude);
        }

        function setTopic(x, y) {
            message.setDestination(solace.SolclientFactory.createTopicDestination(topName + '/' + x + '/' + y));
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
            reader.onloadend = function (evt) {
                if (evt.target.readyState == FileReader.DONE) {
                    var arrayBuffer = evt.target.result,
                        array = new Uint8Array(arrayBuffer);
                    for (var i = 0; i < array.length; i++) {
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
                    pubsub.log('Already subscribed to "' + placeholder +
                        '" and ready to receive messages.');
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
                    pubsub.log('Cannot unsubscribe because not subscribed to the topic "' +
                        placeholder + '"');
                }
            } else {
                pubsub.log('Cannot unsubscribe because not connected to Solace message router.');
            }
        } catch (error) {
            pubsub.log(error.toString());
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
                        queueDescriptor: {
                            name: pubsub.queueName,
                            type: solace.QueueType.QUEUE
                        },
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
                        if (String(message.getDestination()).indexOf('LTA/temp') >= 0) {
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
                                pubsub.temp = {
                                    'content': result,
                                    'topic': message.getDestination(),
                                    'delivery': message.getDeliveryMode()
                                };

                            } else {
                                //convert and show image
                                var imgbyte = result.split(",");
                                var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(imgbyte)));
                                pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"data:image/png;base64,' + base64String + '\" />');
                                pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + base64String + '\" />')
                                message.acknowledge();
                                pubsub.temp = {
                                    'image': '<img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + result.split(',')[0] + '\" />',
                                    'content': result,
                                    'topic': message.getDestination(),
                                    'delivery': message.getDeliveryMode()
                                };
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
