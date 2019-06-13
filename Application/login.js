var attempt = 3; // Variable to count number of attempts.
// Below function Executes on click of login button.
function validate() {
    var username = document.getElementById("uname").value;
    var password = document.getElementById("pwd").value;
    if (username == "NEA" && password == "pass") {
        console.log("Login successfully");
        // window.location.replace("homepage.html"); // Redirecting to other page.
        swal({title: "Login successful", text: "Welcome Back!", icon: "success"
            })
        .then((value) => window.location.replace("homepage.html"));
        return false;
    } else if (username == "admin" && password == "pass") {
        console.log("Login successfully");
         // Redirecting to other page.
        swal({title: "Login successful", text: "Welcome Back!", icon: "success"
            })
        .then((value) => window.location.replace("admin.html"));
        return false;
    } else {
        attempt--; // Decrementing by one.
        // alert("You have left " + attempt + " attempt;");
        swal({title: "Wrong Login Details!", text: "You have " + attempt + " attempts left", icon: "error"
            });
        // Disabling fields after 3 attempts.
        if (attempt == 0) {
            document.getElementById("uname").disabled = true;
            document.getElementById("pwd").disabled = true;
            document.getElementById("submit").disabled = true;
            return false;
        }
    }
}