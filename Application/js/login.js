//This is javascript code to process the login inputs from login.html
var attempt = 3; // Variable to count number of attempts.
// Below function Executes on click of login button.
function validate() {
    var user = document.getElementById("uname").value;
    x = String(user)
    var password = document.getElementById("pwd").value;
    // maked a SEMP REST API call to see if user exists and returns "true" if exists and "false" if dont exist
    if (AccessListCall(user, "LOGIN", password) == 'true') {
        console.log("Login successfully");
        sessionStorage.setItem('username', x);
        // syntax from sweetalert.js library to create alrets
        swal({
                title: "Login successful",
                text: "Welcome Back!",
                icon: "success"
            })
            // Redirecting to other page.
            .then((value) => window.location.replace("homepage.html"));
        return false;
        // Hardcoded login details of admin for demo purpose
    } else if (user == "admin" && password == "pass") {
        console.log("Login successfully");
        sessionStorage.setItem('username', x);
        // syntax from sweetalert.js library to create alrets
        swal({
                title: "Login successful",
                text: "Welcome Back!",
                icon: "success"
            })
            // Redirecting to other page.
            .then((value) => window.location.replace("admin.html"));
        return false;
    } else {
        attempt--; // Decrementing by one.
        // syntax from sweetalert.js library to create alrets about no of attempts lefft
        swal({
            title: "Wrong Login Details!",
            text: "You have " + attempt + " attempts left",
            icon: "error"
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