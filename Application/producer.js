var QueueProducer = function (queueName) {
    var enumvalue = 0;
    'use strict';
    var producer = {};
    producer.session = null;
    producer.queueName = queueName;
    producer.numOfMessages = 10;

    //Logger
    producer.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2), ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        var logTextArea = document.getElementById('publishlog');
        logTextArea.innerHTML += timestamp + line + '<br />';
        logTextArea.scrollTop = logTextArea.scrollHeight;
    };

    producer.log('\n*** Publisher is ready to connect ***');



    // Establishes connection to Solace message router
    producer.connect = function () {
        if (producer.session !== null) {
            producer.log('Already connected and ready to send messages.');
            return;
        }

        var hosturl = account.HOSTURL;
        var username = account.USERNAME;
        var pass = account.PASS;
        var vpn = account.VPN;

        producer.log('Connecting to Solace message router using url: ' + hosturl);
        producer.log('Client username: ' + username);
        producer.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            producer.session = solace.SolclientFactory.createSession({
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
        producer.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            producer.log('=== Successfully connected and ready to send messages. ===');
        });
        producer.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            producer.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        producer.session.on(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE, function (sessionEvent) {
            producer.log('Delivery of message with correlation key = ' +
                JSON.stringify(sessionEvent.correlationKey) + ' confirmed.');
        });
        producer.session.on(solace.SessionEventCode.REJECTED_MESSAGE_ERROR, function (sessionEvent) {
            producer.log('Delivery of message with correlation key = ' + JSON.stringify(sessionEvent.correlationKey) +
                ' rejected, info: ' + sessionEvent.infoStr);
        });
        producer.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            producer.log('Disconnected.');
            if (producer.session !== null) {
                producer.session.dispose();
                producer.session = null;
            }
        });

        producer.connectToSolace();   

    };



    // Actually connects the session triggered when the iframe has been loaded - see in html code
    producer.connectToSolace = function () {
        try {
            producer.session.connect();
        } catch (error) {
            producer.log(error.toString());
        }
    };

    producer.sendMessages = function () {
        if (producer.session !== null) {
            enumvalue += 1;
            producer.sendMessage(enumvalue);
            enumvalue += 1;
            producer.sendImage(enumvalue);
        } else {
            producer.log('Cannot send messages because not connected to Solace message router.');
        }
    }

    // Sends one message
    producer.sendMessage = function (sequenceNr) {
        var messageText = document.getElementById('content').value;
        var message = solace.SolclientFactory.createMessage();
        message.setDestination(solace.SolclientFactory.createTopicDestination(document.getElementById('publishtopic').value));
        message.setBinaryAttachment(messageText);
        message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
        // Define a correlation key object
        const correlationKey = {
            name: "MESSAGE_CORRELATIONKEY",
            id: sequenceNr,
        };
        message.setCorrelationKey(correlationKey);
        try {
            producer.session.send(message);
            producer.log('Message #' + sequenceNr + ' sent to queue "' + producer.queueName + '", correlation key = ' + JSON.stringify(correlationKey));
        } catch (error) {
            producer.log(error.toString());
        }
    };

    // Sends one image
    producer.sendImage = function (sequenceNr) {
        var file = document.getElementById('fileimg').files[0];
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
                message.setDestination(solace.SolclientFactory.createTopicDestination("tutorial/queue/image"));
                message.setBinaryAttachment(fileByteArray.toString());
                message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
                // Define a correlation key object
                const correlationKey = {
                    name: "MESSAGE_CORRELATIONKEY",
                    id: sequenceNr,
                };
                message.setCorrelationKey(correlationKey);
                try {
                    producer.session.send(message);
                    producer.log('Message #' + sequenceNr + ' sent to queue "' + producer.queueName + '", correlation key = ' + JSON.stringify(correlationKey));
                } catch (error) {
                    producer.log(error.toString());
                }

            }
        }
        
    };

    // Gracefully disconnects from Solace message router
    producer.disconnect = function () {
        producer.log('Disconnecting from Solace message router...');
        if (producer.session !== null) {
            try {
                producer.session.disconnect();
            } catch (error) {
                producer.log(error.toString());
            }
        } else {
            producer.log('Not connected to Solace message router.');
        }
    };

    return producer;
};
