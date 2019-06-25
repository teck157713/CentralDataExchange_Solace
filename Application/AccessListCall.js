    // EXAMPLE
    // NEED TO assign a ACL Profiles called ALL to handle subscription
    //   AccessInnerCall("LTA", "POST", "LOL/>"); post to all agent's subscribe list
    //   AccessInnerCall("LTA", "GET"); returns a list of published topics
    //   AccessInnerCall("LTA", "GETALL"); returns a list of topics available

function AccessListCall(username, type, value = '', counter = 0){
    var dict = [];
    var uriSEMP = "";
    AccessInnerCall(username, type, value, counter);
    function AccessInnerCall(username, type, value = '', counter = 0) {
        var result;
        insertedtype = "GET";
        insertedvalue = '';
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
                break;
        }
        if (counter == 0){
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/clientUsernames/" + username;
        } else if (counter == 1) {
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/aclProfiles/" + username + "/publishExceptions";
        } else if (counter == 2){
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/aclProfiles/" + username + "/subscribeExceptions";
        } else if (counter == 3){
            uriSEMP = "http://localhost:8080/SEMP/v2/config/msgVpns/default/aclProfiles";
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
            switch (counter){
                case 0:
                    result = (data['data']['aclProfileName']);
                    counter += 1;
                    if (type == 'GET'){
                        AccessInnerCall(result, type, value, counter);
                    } else if (type == 'POST'){
                        AccessInnerCall(result, type, value, counter);
                    } else if (type == 'GETALL'){
                        AccessInnerCall(result, type, value, 2);
                    }
                    break;
                case 1:
                    for (var k in data['data']){
                        dict.push(data['data'][k]['publishExceptionTopic']);
                    }
                    if (type == 'POST'){
                        counter = 3;
                        AccessInnerCall(username, type, value, counter);
                    }
                    break;
                case 2:
                    if (type == 'GETALL'){
                        dict = [];
                        for (var i in data['data']){
                            dict.push(data['data'][i]['subscribeExceptionTopic']);
                        }
                    }
                    break;
                case 3:
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
                jQuery.parseJSON(jqXHR.responseText).message;
            alert(errorString);
        });
    };
    if (dict[0]){
        return dict;
    }
}