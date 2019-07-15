function processImage(sourceImageUrl, location, callback) {
  // **********************************************
  // *** Update or verify the following values. ***
  // **********************************************

  // Replace <Subscription Key> with your valid subscription key.
  var subscriptionKey = "3ba325cc4e724a70b6a73b0395f262bb";

  // You must use the same Azure region in your REST API method as you used to
  // get your subscription keys. For example, if you got your subscription keys
  // from the West US region, replace "southeastasia" in the URL
  // below with "westus".
  //
  // Free trial subscription keys are generated in the "westus" region.
  // If you use a free trial subscription key, you shouldn't need to change
  // this region.
  var uriBase =
      "https://southeastasia.api.cognitive.microsoft.com/vision/v2.0/analyze";

  // Request parameters.
  var params = {
      "visualFeatures": "Tags",
      "details": "",
      "language": "en",
  };
  // Display the image.
  //var sourceImageUrl = document.getElementById("inputImage").value;
  //document.querySelector("#sourceImage").src = sourceImageUrl;

  // Make the REST API call.
  $.ajax({
      url: uriBase + "?" + $.param(params),

      // Request headers.
      beforeSend: function(xhrObj){
          xhrObj.setRequestHeader("Content-Type","application/json");
          xhrObj.setRequestHeader(
              "Ocp-Apim-Subscription-Key", subscriptionKey);
      },

      type: "POST",

      // Request body.
      data: '{"url": ' + '"' + sourceImageUrl + '"}',
  })

  .done(function(data) {
      // Show formatted JSON on webpage.
      result = JSON.parse(JSON.stringify(data, null, 2));
      callback(sourceImageUrl, location, result);

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
