//this javascript provides functions to aid in the functioing of user interfaces implemented on front facing html

//function to process the tab changes in admin.html and homepage.html
function openStuff(evt, name) {
  var i, x, tablinks;
  x = document.getElementsByClassName("pubsub");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < x.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" w3-red", "");
  }
  document.getElementById(name).style.display = "block";
  evt.currentTarget.className += " w3-red";
};


function connect() {
  var hosturl = account.HOSTURL;
  var username = account.USERNAME;
  var vpn = account.VPN;
  var connect = document.getElementById('connect');
  connect.innerHTML = 'Username: ' + username + '<br>' + 'Message URL: ' + hosturl + '<br>' + 'VPN Name: ' + vpn;
};

//function to search through table for the input entered 
function mySearch(inputs,tables) {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById(inputs);
  filter = input.value.toUpperCase();
  table = document.getElementById(tables);
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}