 /*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Solace Web Messaging API for JavaScript
 * Publish/Subscribe tutorial - Topic Publisher
 * Demonstrates publishing direct messages to a topic
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var RegPublisher = function (queueName) {
    'use strict';
    var publisher = {};
    publisher.session = null;
    publisher.queueName = queueName;

    // Logger
    publisher.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
    };

    publisher.log('\n*** Producer to queue "' + publisher.queueName + '" is ready to connect ***');

    // Establishes connection to Solace message router
    publisher.connect = function () {
        // extract params
        if (publisher.session !== null) {
            publisher.log('Already connected and ready to publish messages.');
            return;
        }
        var hosturl = account.HOSTURL;
        var username = account.USERNAME;
        var pass = account.PASS;
        var vpn = account.VPN;

        publisher.log('Connecting to Solace message router using url: ' + hosturl);
        publisher.log('Client username: ' + username);
        publisher.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            publisher.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
            });
        } catch (error) {
            publisher.log(error.toString());
        }
        // define session event listeners
        publisher.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            publisher.log('=== Successfully connected and ready to publish messages. ===');
            return true
        });
        publisher.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
            publisher.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });
        publisher.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            publisher.log('Disconnected.');
            if (publisher.session !== null) {
                publisher.session.dispose();
                publisher.session = null;
            }
        });
        publisher.connectToSolace();
    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    publisher.connectToSolace = function () {
        try {
            publisher.session.connect();
        } catch (error) {
            publisher.log(error.toString());
        }
    };

    // Gracefully disconnects from Solace message router
    publisher.disconnect = function () {
        publisher.log('Disconnecting from Solace message router...');
        if (publisher.session !== null) {
            try {
                publisher.session.disconnect();
            } catch (error) {
                publisher.log(error.toString());
            }
        } else {
            publisher.log('Not connected to Solace message router.');
        }
    };

     // Publishes one message
     publisher.publish = function () {
        if (publisher.session !== null) {
            var aname = document.getElementById('aname').value;
            var uname = document.getElementById('uname').value;
            var pwd = document.getElementById('pwd').value;
            var messageText = aname+","+uname+","+pwd;
            var message = solace.SolclientFactory.createMessage();
            publisher.log('Sending message "' + messageText + '" to queue "' + publisher.queueName + '"...');
            message.setDestination(solace.SolclientFactory.createDurableQueueDestination(publisher.queueName));
            message.setBinaryAttachment(messageText);
            message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
            publisher.log('Publishing message "' + messageText + '" to topic "' + publisher.queueName + '"...');
            try {
                publisher.session.send(message);
                publisher.log('Message sent.');
            } catch (error) {
                publisher.log(error.toString());
            }
        } else {
            publisher.log('Cannot send messages because not connected to Solace message router.');
        }
    };
    publisher.connect()
    return publisher;
};
