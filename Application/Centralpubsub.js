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
        console.log(timestamp + line);
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
    pubsub.table2 = function (messagee) {
      try {
        var table = document.getElementById('table1');
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        cell1.innerHTML = messagee;
      } catch (error) {
        pubsub.log(error.toString());
      }
    }
    pubsub.table3 = function (messagee) {
        var table = document.getElementById('table3');
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
            if (validURL(JSON.parse("{" + result + "}").imageurl)){
              pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"' + JSON.parse("{" + result + "}").imageurl + '\" />' + ', message: ' + result + ', details:\n' + message.dump());
              pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"' + JSON.parse("{" + result + "}").imageurl + '\" />' + result);
              pubsub.temp = {'image': '<img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"' + JSON.parse("{" + result + "}").imageurl + '\" />', 'content' : result, 'topic' : message.getDestination(), 'delivery' : message.getDeliveryMode()};
            } else if (result.length < 255){
              pubsub.log('Received message: "' + result + '", details:\n' + message.dump());
              pubsub.table(result);
              pubsub.temp = {'content' : result, 'topic' : message.getDestination(), 'delivery' : message.getDeliveryMode()};
            } else {
              var imgbyte = result.split(",");
              var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(imgbyte)));
              pubsub.log('Received Image: <br /><img id=\"ItemView\" src=\"data:image/png;base64,' + base64String + '\" />' + ', details:\n' + message.dump());
              pubsub.table('<br /><img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + base64String + '\" />');
              pubsub.temp = {'image': '<img id=\"ItemView\" style="display:block;" width="auto  " height="100px" src=\"data:image/png;base64,' + result.split(",") + '\" />', 'content' : result, 'topic' : message.getDestination(), 'delivery' : message.getDeliveryMode()};
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

    // Event-Driven Re-publish Topic
    pubsub.EventMsg = function (topicSend, result, addTopic = "") {
        try {
          enumvalue += 1;
          sequenceNr = enumvalue;
          var statictopicName = topicSend;
          var messageText = JSON.stringify(result);
          var message = solace.SolclientFactory.createMessage();
          message.setDestination(solace.SolclientFactory.createTopicDestination(statictopicName + '/' + result['lat'] + '/' + result['long'] + addTopic));
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
                      console.log(result);
                      if (String(message.getDestination()).indexOf('NEA/1/temp_data/raw') >= 0){
                        TempEventCall(result, pubsub);
                        message.acknowledge();
                      } else if (String(message.getDestination()).indexOf('NEA/1/rain_data/raw') >= 0){
                        RainEventCall(result, pubsub);
                        message.acknowledge();
                      } else if (String(message.getDestination()).indexOf('LTA/1/img_data/raw') >= 0){
                        ImageEventCall(result, pubsub, function(){});
                        message.acknowledge();
                      } else if (String(message.getDestination()).indexOf('LTA/1/taxi_data/raw') >= 0){
                        TaxiEventCall(result, pubsub, function(){});
                        message.acknowledge();
                      } else {
                        // assuming if message is a message if less than 255, else image
                        if (result.length < 555) {
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
                      if(document.getElementById('table1').innerHTML.indexOf(message.getDestination()) !== -1) {

                      } else {
                        pubsub.table2(message.getDestination());
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
