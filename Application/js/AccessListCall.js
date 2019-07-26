    // EXAMPLE
    // Recursive API Calls to handle clients for ACL Admin
    //   AccessListCall("LTA", "POST", "LOL/>"); post to all agent's subscribe list
    //   AccessListCall("LTA", "POST", "LOL/>", "NEA, MOE"); post to all listed agent's subscribe list
    //   AccessListCall("LTA", "GET"); returns a list of published topics
    //   AccessListCall("LTA", "GETALL"); returns a list of topics available
    //   AccessListCall("LTA", "LOGIN", "password"); returns true/false with the right authentication
var dict;
var UriSEMP;
function AccessListCall(username, type, value = '', filter = ''){
    dict = [];
    UriSEMP = "";
    AccessInnerCall(username, type, value, 0, filter = (('LOGIN' === type) ? 'login' : filter));
    function AccessInnerCall(username, type, value = '', counter = 0, filter = '') {
        var result;
        insertedtype = "GET";
        insertedvalue = '';
        // To Assign the respective API calls with the right data for body
        switch(type){
            case "POST":
                if (counter == 1){
                    insertedtype = "POST";
                    insertedvalue = '{"publishExceptionTopic": "' + value + '", "topicSyntax" : "smf" }';
                }
                if (counter == 2){
                    insertedtype = "POST";
                    insertedvalue = '{"subscribeExceptionTopic": "' + value + '", "topicSyntax" : "smf" }';
                }
                if (counter == 4){
                    insertedtype = "POST";
                    insertedvalue = '{"subscriptionTopic": "' + value + '"}';
                }
                break;
        }
        // Assign the right URI based on subsequent API calls
        if (counter == 0){
            if (!filter){
                uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/clientUsernames/" + username;
            } else {
                uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/clientUsernames";
            }
        } else if (counter == 1) {
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/aclProfiles/" + username + "/publishExceptions";
        } else if (counter == 2){
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/aclProfiles/" + username + "/subscribeExceptions";
        } else if (counter == 3){
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/aclProfiles";
        } else if (counter == 4){
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/queues/SOLACE_ALL/subscriptions";
        }
        var data = '';
        // Make the REST API call.
        $.ajax({
            url: uriSEMP,
            // Request headers.
            beforeSend: function(xhrObj){
                xhrObj.setRequestHeader("Content-Type","application/json");
                xhrObj.setRequestHeader(
                    "Authorization", "Basic " + btoa("admin" + ":" + "admin"));
            },

            type: insertedtype,
            async: false,
            // Request body.
            data: insertedvalue,
        })

        .done(function(data) {
            // counter is the integer for assignment to determine API sequences being called
            switch (counter){
                // reference to the URI that is being called (counter = 0)
                case 0:
                    result = (data['data']['aclProfileName']);
                    counter += 1;
                    if (type == 'GET'){
                        AccessInnerCall(result, type, value, counter);
                    } else if (type == 'POST'){
                        if (filter) {
                            var acllist = [];
                            for (var i in data['data']){
                                // get the list of acl profiles from selected clients to post on each subscription list
                                if (String(filter).indexOf(data['data'][i]['clientUsername']) >= 0){
                                    acllist.push(data['data'][i]['aclProfileName']);
                                } else if (String(username).indexOf(data['data'][i]['clientUsername']) >= 0){
                                    username = data['data'][i]['aclProfileName'];
                                }
                            }
                            // recursive function call to execute next step
                            AccessInnerCall(username, type, value, counter, acllist);
                        } else {
                            AccessInnerCall(result, type, value, counter);
                        }
                    } else if (type == 'GETALL'){
                        AccessInnerCall(result, type, value, 2);
                    } else if (type == 'LOGIN'){
                        for (var i in data['data']){
                            if (username == data['data'][i]['clientUsername']){
                                dict = "true";
                            }
                        }
                        if (dict.length === 0){
                            dict = "false";
                        }
                    }
                    break;
                // reference to the URI that is being called (counter = 1)
                case 1:
                    // GET published topic and return
                    for (var k in data['data']){
                        dict.push(data['data'][k]['publishExceptionTopic']);
                    }
                    if (type == 'POST'){
                        AccessInnerCall(username, type, value, 4);
                        // Add topic to subscribe list to each of the broker
                        if (filter) {
                            for (var i in filter) {
                                AccessInnerCall(filter[i], type, value, 2);
                            }
                        } else {
                            AccessInnerCall(username, type, value, 3);
                        }
                    }
                    break;
                // reference to the URI that is being called (counter = 2)
                case 2:
                    // Topics that has been subscribed by Broker and return
                    if (type == 'GETALL'){
                        dict = [];
                        for (var i in data['data']){
                            dict.push(data['data'][i]['subscribeExceptionTopic']);
                        }
                    }
                    break;
                case 3:
                    // GET the rest of the aclprofile other than the broker and proceed to put the topic to each of the subscribe list
                    for (var i in data['data']){
                        if (username != data['data'][i]['aclProfileName'] && data['data'][i]['aclProfileName'] != "#acl-profile"){
                            AccessInnerCall(data['data'][i]['aclProfileName'], type, value, 2);
                        }
                    }
                    break;
            }

        })

        .fail(function(jqXHR, textStatus, errorThrown) {
            // Display error message.
            var errorString = (errorThrown === "") ? "Error. " :
                errorThrown + " (" + jqXHR.status + "): ";
            errorString += (jqXHR.responseText === "") ? "" :
            console.log(errorString);

        });
    };
    if (dict[0]){
        return dict;
    }
}
