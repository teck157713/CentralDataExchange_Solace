var PubSub = function (params) {
    //'use strict';
    var enumvalue = 0;
    var govdataon = 0;
    var pubsub = {};
    pubsub.session = null;
    pubsub.numOfMessages = 10;
    pubsub.subscribed = false;
    pubsub.topicName = params.topicName || 'topicName';
    pubsub.queueName = params.queueName || 'queueName';
    var logname = params.logname || 'logname'; //logger input id
    var contentmsg = params.contentmsg || ''; //plain text or object file input if sendImage()
    var tableName = params.tableName || 'table1'; //table input id

    //Logger
    pubsub.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById(logname);
        logTextArea.innerHTML += timestamp + line + '<br />';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    pubsub.log('\n*** Broker is ready to connect ***');

    //table Log
    pubsub.table = function (messagee) {
        var table = document.getElementById(tableName);
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        cell1.innerHTML = messagee;
    }

    // Establishes connection to Solace message router
    pubsub.connect = function () {
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
            producer.log(error.toString());
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
            pubsub.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' +
                message.dump());
            pubsub.table(message.getBinaryAttachment());
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

    pubsub.sendMessages = function () {
        if (pubsub.session !== null) {
            enumvalue += 1;
            pubsub.sendMessage(enumvalue);
            //Or can send some image.
            enumvalue += 1;
            pubsub.sendImage(enumvalue);
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    //Initiate govData Sending
    pubsub.sendgovdata = function () {
      govdataon = setInterval(pubsub.sendGovText, 10000);
      pubsub.log('Publishing, the interval has been started.');
    }

    pubsub.stopgovdata = function () {
      clearInterval(govdataon);
      pubsub.log('Publishing has been stopped.');
    }

    pubsub.sendGovText = function () {
        if (pubsub.session !== null) {
            processgov(function(resdict){
              pubsub.sendviaTopics(resdict);
            });
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    // Sends one picture with tags of topics
    pubsub.sendviaTopics = function (result) {
        for (var i = 0; i < result.length; i ++){
          var messageText = result[i].image + ', lat: ' + result[i].location.latitude + ', long: ' + result[i].location.longitude;
          var topicDest = result[i].tags;
          //alert(messageText + ' ' + topicDest);
          var message = solace.SolclientFactory.createMessage();
          setTopic(topicDest);
        }

        function setTopic(x){
          if (x.length == 0){

          } else {
            message.setDestination(solace.SolclientFactory.createTopicDestination( pubsub.topicName + '/' + x.pop()));
            message.setBinaryAttachment(messageText);
            message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
            // Define a correlation key object
            const correlationKey = {
                name: "MESSAGE_CORRELATIONKEY",
                id: messageText,
            };
            message.setCorrelationKey(correlationKey);
            try {
                pubsub.session.send(message);
                pubsub.log('Message #' + messageText + ' sent to queue "' + pubsub.topicName + '"' + JSON.stringify(correlationKey));
            } catch (error) {
                pubsub.log(error.toString());
            }
            return setTopic(x);
          }
        }

    };

    //Initiate tempData Sending
    pubsub.pubTemp = function () {
      TempOn = setInterval(pubsub.sendTempData, 1000);
      pubsub.log('Publishing, the interval has been started.');
    }

    pubsub.stoppubTemp = function () {
      clearInterval(TempOn);
      pubsub.log('Publishing has been stopped.');
    }

    pubsub.sendTempData = function () {
        if (pubsub.session !== null) {
            processTemp(function(resdict){
              pubsub.sendTempMsg(resdict);
            });
        } else {
            pubsub.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    // Sends one picture with tags of topics
    pubsub.sendTempMsg = function (result) {
        for (var i = 0; i < result.length; i ++){
          var messageText = 'id: ' + result[i].id + ', lat: ' + result[i].location.latitude + ', long: ' + result[i].location.longitude + ', value: ' + result[i].value;
          var message = solace.SolclientFactory.createMessage();
          setTopic(result[i].location.latitude, result[i].location.longitude);
        }

        function setTopic(x, y){
          message.setDestination(solace.SolclientFactory.createTopicDestination( pubsub.topicName + '/' + x + '/' + y));
          message.setBinaryAttachment(messageText);
          message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
          const correlationKey = {
              name: "MESSAGE_CORRELATIONKEY",
              id: messageText,
          };
          message.setCorrelationKey(correlationKey);
          try {
              pubsub.session.send(message);
              pubsub.log('Message #' + messageText + ' sent to queue "' + pubsub.topicName + '"' + JSON.stringify(correlationKey));
          } catch (error) {
              pubsub.log(error.toString());
          }
        }

    };

    // Sends one message
    pubsub.sendMessage = function (sequenceNr) {
        contentmsg = document.getElementById("content").value;
        pubsub.topicName = document.getElementById("publishtopic").value;
        var messageText = contentmsg;
        var message = solace.SolclientFactory.createMessage();
        message.setDestination(solace.SolclientFactory.createTopicDestination(pubsub.topicName));
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
            pubsub.log('Message #' + sequenceNr + ' sent to queue "' + pubsub.topicName + '", correlation key = ' + JSON.stringify(correlationKey));
        } catch (error) {
            pubsub.log(error.toString());
        }
    };

    // Sends one image
    pubsub.sendImage = function (sequenceNr) {
        pubsub.topicName = "tutorial/queue/image";
        contentmsg = document.getElementById('fileimg').files[0];
        var file = contentmsg;
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
                message.setDestination(solace.SolclientFactory.createTopicDestination(pubsub.topicName));
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
                    pubsub.log('Message #' + sequenceNr + ' sent to queue "' + pubsub.topicName + '", correlation key = ' + JSON.stringify(correlationKey));
                } catch (error) {
                    pubsub.log(error.toString());
                }

            }
        }

    };

    // Subscribes to topic on Solace message router
    pubsub.subscribe = function () {
        pubsub.topicName = document.getElementById('topicname').value;
        if (pubsub.session !== null) {
            if (pubsub.subscribed) {
                pubsub.log('Already subscribed to "' + pubsub.topicName
                    + '" and ready to receive messages.');
            } else {
                pubsub.log('Subscribing to topic: ' + pubsub.topicName);
                try {
                    pubsub.session.subscribe(
                        solace.SolclientFactory.createTopicDestination(pubsub.topicName),
                        true, // generate confirmation when subscription is added successfully
                        pubsub.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    pubsub.log(error.toString());
                }
            }
        } else {
            pubsub.log('Cannot subscribe because not connected to Solace message router.');
        }
    };

    // Unsubscribes from topic on Solace message router
    pubsub.unsubscribe = function () {
        if (pubsub.session !== null) {
            if (pubsub.subscribed) {
                pubsub.log('Unsubscribing from topic: ' + pubsub.topicName);
                try {
                    pubsub.session.unsubscribe(
                        solace.SolclientFactory.createTopicDestination(pubsub.topicName),
                        true, // generate confirmation when subscription is removed successfully
                        pubsub.topicName, // use topic name as correlation key
                        10000 // 10 seconds timeout for this operation
                    );
                } catch (error) {
                    pubsub.log(error.toString());
                }
            } else {
                pubsub.log('Cannot unsubscribe because not subscribed to the topic "'
                    + pubsub.topicName + '"');
            }
        } else {
            pubsub.log('Cannot unsubscribe because not connected to Solace message router.');
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
                        // assuming if message is a message if less than 255, else image
                        if (result.length < 255) {
                            pubsub.log('Received message: "' + result + '",' +
                            ' details:\n' + message.dump());
                            // Need to explicitly ack otherwise it will not be deleted from the message router
                            pubsub.table(message.getBinaryAttachment())
                            message.acknowledge();
                        } else {
                            //convert and show image
                            var imgbyte = result.split(",");
                            var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(imgbyte)));
                            pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"data:image/png;base64,' + base64String + '\" />');
                            pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="400px  " height="50%" src=\"data:image/png;base64,' + base64String + '\" />')
                            message.acknowledge();
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
