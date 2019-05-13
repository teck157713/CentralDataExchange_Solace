function processgov() {
  var subscriptionKey = "5eb74f8f5a844acaa8c29118c43c83a6";
  var uriBase =
      "https://api.data.gov.sg/v1/transport/traffic-images";

  // Request parameters.
  var now = new Date();
  var month = "0" + (now.getMonth()).toString().slice(-2);
  var today = now.getFullYear() + '-' + month + '-' + now.getDate() + 'T' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
  var params = {
      "date_time": today
  };

  var sourceImageUrl = "https://peopledotcom.files.wordpress.com/2018/12/books-8.jpg?crop=0px%2C13px%2C2700px%2C1419px&resize=1200%2C630";

  $.ajax({
      url: uriBase + "?" + $.param(params),

      beforeSend: function(xhrObj){
          xhrObj.setRequestHeader("Content-Type","application/json");
      },

      type: "GET",
  })

  .done(function(data) {

      alert(JSON.stringify(data,null,2));
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
