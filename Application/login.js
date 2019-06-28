//This is javascript code to process the login inputs from login.html
var attempt = 3; // Variable to count number of attempts.
// Below function Executes on click of login button.
function validate() {
    var user = document.getElementById("uname").value;
    var password = document.getElementById("pwd").value;
    // Hardcoded login details for demo purpose
    // if (username == "NEA" && password == "pass") {
    if (AccessListCall(user, "LOGIN", password)) {
        console.log("Login successfully");
        setCookie('username',user);
        var x = getCookie('username')
        alert(x)
        // syntax from sweetalert.js library to create alrets
        swal({title: "Login successful", text: "Welcome Back!", icon: "success"
            })
        // Redirecting to other page.
        .then((value) => window.location.replace("homepage.html"));
        return false;
     // Hardcoded login details for demo purpose
    } else if (username == "admin" && password == "pass") {
        console.log("Login successfully");
         // syntax from sweetalert.js library to create alrets
        swal({title: "Login successful", text: "Welcome Back!", icon: "success"
            })
        // Redirecting to other page.
        .then((value) => window.location.replace("admin.html"));
        return false;
    } else {
        attempt--; // Decrementing by one.
        // syntax from sweetalert.js library to create alrets about no of attempts lefft
        swal({title: "Wrong Login Details!", text: "You have " + attempt + " attempts left", icon: "error"
            });
        // Disabling fields after 3 attempts.
        if (attempt == 0) {
            document.getElementById("uname").disabled = true;
            document.getElementById("pwd").disabled = true;
            document.getElementById("submit").disabled = true;
            return false;
        // once attempt equals 0 user has to refresh page to rest the attempt rate
        }
    }
}