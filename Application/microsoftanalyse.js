function processImage() {
  // **********************************************
  // *** Update or verify the following values. ***
  // **********************************************

  // Replace <Subscription Key> with your valid subscription key.
  var subscriptionKey = "5eb74f8f5a844acaa8c29118c43c83a6";

  // You must use the same Azure region in your REST API method as you used to
  // get your subscription keys. For example, if you got your subscription keys
  // from the West US region, replace "westcentralus" in the URL
  // below with "westus".
  //
  // Free trial subscription keys are generated in the "westus" region.
  // If you use a free trial subscription key, you shouldn't need to change
  // this region.
  var uriBase =
      "https://southeastasia.api.cognitive.microsoft.com/vision/v2.0/analyze";

  // Request parameters.
  var params = {
      "visualFeatures": "Categories,Description,Color,Objects,Faces",
      "details": "",
      "language": "en",
  };

  // Display the image.
  //var sourceImageUrl = document.getElementById("inputImage").value;
  //document.querySelector("#sourceImage").src = sourceImageUrl;
  var sourceImageUrl = "https://peopledotcom.files.wordpress.com/2018/12/books-8.jpg?crop=0px%2C13px%2C2700px%2C1419px&resize=1200%2C630";

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
      // $("#responseTextArea").val(JSON.stringify(data, null, 2));
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
