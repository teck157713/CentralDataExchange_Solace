// ** NEW BROKER: DATA EXAMPLE **
// var newReg = {
//     NAME:       'new',
//     HOSTURL:    'ws://mrzpfs1b9gh81.messaging.solace.cloud:20291',
//     remoteMsgVpnLocation:   'mrzpfs1b9gh81.messaging.solace.cloud:20288',
//     VPN:        'msgvpn-zpfs1b9w8wz',
//     USERNAME:   'solace-cloud-client',
//     PASS:       '4j4tmhhldn6kklhlvnq4ldsvmm',
//     SEMPURL:    'mrzpfs1b9gh81.messaging.solace.cloud:20302',
//     SEMPNAME:   'msgvpn-zpfs1b9w8wz-admin',
//     SEMPPASS:   'jd1hu487v6he5hotnr1hanl2ab'
// }

// ** EXECUTE EXAMPLE **
// BrokerRegistration(newReg);
// BrokerBridgingConnection(newReg);

// ** MAIN FUNCTION 1 **
BrokerRegistration = function (credentials) {
    SempAPIRegistration(
        "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/aclProfiles", 
        "POST", 
        {"aclProfileName" : credentials.NAME,
        "clientConnectDefaultAction" : "allow"}, 
        host
    )
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/clientUsernames", 
            "POST", 
            {
                "clientUsername" : credentials.NAME,
                "password" : credentials.NAME,
                "aclProfileName" : credentials.NAME,
                "enabled" : true
            }, 
            host
        ))
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/aclProfiles/ALL/subscribeExceptions", 
            "GET", 
            "", 
            host,
            credentials
        ));
}

// ** MAIN FUNCTION 2 **
BrokerBridgingConnection = function (credentials) {
    SempAPIRegistration(
        "https://" + credentials.SEMPURL + "/SEMP/v2/config/msgVpns/" + credentials.VPN + "/queues", 
        "POST", 
        {
            "queueName" : host.VPN + "_" + credentials.VPN,
            "egressEnabled": true,
            "ingressEnabled": true,
            "permission" : "modify-topic"
        }, 
        credentials
    )
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/queues", 
            "POST", 
            {
                "queueName" : host.VPN + "_" + credentials.VPN,
                "egressEnabled": true,
                "ingressEnabled": true,
                "permission" : "modify-topic",
                "owner" : credentials.NAME
            }, 
            host
        ))
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/queues/" + host.VPN + "_" + credentials.VPN + "/subscriptions", 
            "POST", 
            {
                "subscriptionTopic" : "*/>"
            }, 
            host
        ))
        .then(res => SempAPIRegistration(
            "https://" + credentials.SEMPURL + "/SEMP/v2/config/msgVpns/" + credentials.VPN + "/bridges", 
            "POST", 
            {
                "bridgeName" : "bridge_" + host.VPN + "_" + credentials.VPN,
                "bridgeVirtualRouter" : "auto",
                "enabled" : true,
                "msgVpnName" : credentials.VPN,
                "remoteAuthenticationScheme" : "basic",
                "remoteAuthenticationBasicClientUsername" : host.USERNAME,
                "remoteAuthenticationBasicPassword" : host.PASS
            }, 
            credentials
        ))
        .then(res => SempAPIRegistration(
            "https://" + credentials.SEMPURL + "/SEMP/v2/config/msgVpns/" + credentials.VPN + "/bridges/bridge_" + host.VPN + "_" + credentials.VPN + ",auto/remoteMsgVpns", 
            "POST", 
            {
                "remoteMsgVpnLocation": host.remoteMsgVpnLocation,
                "remoteMsgVpnName" : host.VPN,
                "enabled" : true,
                "queueBinding" : host.VPN + "_" + credentials.VPN
            }, 
            credentials
        ))
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/bridges", 
            "POST", 
            {
                "bridgeName" : "bridge_" + host.VPN + "_" + credentials.VPN,
                "bridgeVirtualRouter" : "auto",
                "enabled" : true,
                "msgVpnName" : host.VPN,
                "remoteAuthenticationScheme" : "basic",
                "remoteAuthenticationBasicClientUsername" : credentials.USERNAME,
                "remoteAuthenticationBasicPassword" : credentials.PASS
            }, 
            host
        ))
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/bridges/bridge_" + host.VPN + "_" + credentials.VPN + ",auto/remoteMsgVpns", 
            "POST", 
            {
                "remoteMsgVpnLocation": credentials.remoteMsgVpnLocation,
                "remoteMsgVpnName" : credentials.VPN,
                "enabled" : true,
                "queueBinding" : host.VPN + "_" + credentials.VPN
            }, 
            host
        ))
        .then(res => SempAPIRegistration(
            "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + host.VPN + "/bridges/bridge_" + host.VPN + "_" + credentials.VPN + ",auto/remoteSubscriptions", 
            "POST", 
            {
                "bridgeName": "bridge_" + host.VPN + "_" + credentials.VPN,
                "bridgeVirtualRouter": "auto",
                "deliverAlwaysEnabled": false,
                "remoteSubscriptionTopic": "*/>"
            }, 
            host
        ));
}

// ** API CALL FUNCTION **
function SempAPIRegistration(url, type, data, accountCredentials, add = "") {
  console.log(JSON.stringify(data));
  return new Promise(function(resolve, reject) {
      // Make the REST API call.
      $.ajax({
        url: url,

        // Request headers.
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader('Authorization', 'Basic ' + btoa( String(accountCredentials.SEMPNAME ? accountCredentials.SEMPNAME : accountCredentials.USERNAME) + ':' + String(accountCredentials.SEMPPASS ? accountCredentials.SEMPPASS : accountCredentials.PASS) ));
        },

        type: type,

        // Request body.
        data: type == 'POST' ? JSON.stringify(data) : undefined,
      })

      .done(function(data) {
        // Additional querying on result
        result = JSON.parse(JSON.stringify(data, null, 2));
        type == 'POST' ? 
            resolve() : 
            (
                result = result.data,
                addSubTopic = (a) => 
                    SempAPIRegistration(
                        "https://" + host.SEMPURL + "/SEMP/v2/config/msgVpns/" + accountCredentials.VPN + "/aclProfiles/" + add.NAME + "/subscribeExceptions", 
                        "POST", 
                        {"subscribeExceptionTopic" : a, "topicSyntax" : "smf"}, 
                        host
                    ),
                result
                    .map(result => result.subscribeExceptionTopic)
                    .map(addSubTopic)
            );
      })

      .fail(function(jqXHR, textStatus, errorThrown) {
        // Display error message.
        var errorString = (errorThrown === "") ? "Error. " :
            errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" :
            jQuery.parseJSON(jqXHR.responseText).message;
        alert(errorString);
        reject(errorString);
      });
  });

};