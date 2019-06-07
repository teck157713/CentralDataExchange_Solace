var attempt = 3; // Variable to count number of attempts.
// Below function Executes on click of login button.
function validate(){
    var username = document.getElementById("uname").value;
    var password = document.getElementById("pwd").value;
    if ( username == "admin" && password == "pass"){
    alert ("Login successfully");
    window.location.replace("homepage.html"); // Redirecting to other page.
    return false;
    }
    else{
    attempt --;// Decrementing by one.
    alert("You have left "+attempt+" attempt;");
    // Disabling fields after 3 attempts.
    if( attempt == 0){
    document.getElementById("uname").disabled = true;
    document.getElementById("pwd").disabled = true;
    document.getElementById("submit").disabled = true;
    return false;
    }
    }
}