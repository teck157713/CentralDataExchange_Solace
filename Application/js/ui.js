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
    tablinks[i].className = tablinks[i].className.replace(" w3-theme", "");
  }
  document.getElementById(name).style.display = "block";
  evt.currentTarget.className += " w3-theme";
};

function hiderMain(hide, show, sub1, sub2) {
  document.getElementById(show).style.display = "block"
  document.getElementById(hide).style.display = "none"
  if (document.getElementById(sub1).style.display == "none" && document.getElementById(sub2).style.display == "block") {
    document.getElementById(sub2).style.display = "none"
  } else if (document.getElementById(sub1).style.display == "none" && document.getElementById(sub2).style.display == "none") {
    document.getElementById(sub1).style.display = "block"
  } else(
    document.getElementById(sub1).style.display = "none"
  )
}

function hiderSub(hide, show, ) {
  document.getElementById(show).style.display = "block"
  document.getElementById(hide).style.display = "none"
}

function connect() {
  var hosturl = host.HOSTURL;
  var username = host.USERNAME;
  var vpn = host.VPN;
  var connect = document.getElementById('connect');
  connect.innerHTML = 'Username: ' + username + '<br>' + 'Message URL: ' + hosturl + '<br>' + 'VPN Name: ' + vpn;
};

//function to search through table for the input entered 
function mySearch(inputs, tables) {
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

function openPub() {
  openStuff(event, 'Published')
  var user = sessionStorage.getItem('username')
  var published = AccessListCall(user, "GET");
  var table = document.getElementById('publishTopic');
  for (var i = table.rows.length - 1; i > 0; i--) {
    table.deleteRow(i);
  }
  for (var i = 0; i < published.length; i++) {
    // iterates through the published topic list and populates a table
    var row = table.insertRow(i + 1);
    var cell1 = row.insertCell(0);
    cell1.innerHTML = published[i];
  }
}

function openSub() {
  openStuff(event, 'AvilTopics')
  var user = sessionStorage.getItem('username')
  var subscribed = AccessListCall(user, "GETALL");
  var table = document.getElementById('avilTopic');
  for (var i = table.rows.length - 1; i > 0; i--) {
    table.deleteRow(i);
  }
  for (var x = 0; x < subscribed.length; x++) {
    // iterates through the subscribed topic list and populates a table
    var row = table.insertRow(i + 1);
    var cell1 = row.insertCell(0);
    cell1.innerHTML = subscribed[x];
  }
}

function DeleteRowFunction() {
  // event.target will be the input element.
  var td = event.target.parentNode;
  var tr = td.parentNode; // the row to be removed
  tr.parentNode.removeChild(tr);
}

function CreateTopic(clicked) {
  var text = document.getElementById(clicked).value
  var arr = text.split("-")
  if (arr[3] == "all") {
    AccessListCall(arr[0], "POST", arr[1]);
  } else {
    // alert(arr[3])
    AccessListCall(arr[0], "POST", arr[1], arr[3])
  }
  DeleteRowFunction()
}

function CreateAgency(clicked) {
  var text = document.getElementById(clicked).value
  var arr = text.split(",")
  var newReg = {
    NAME: arr[0],
    HOSTURL: arr[1],
    remoteMsgVpnLocation: arr[2],
    VPN: arr[3],
    USERNAME: arr[4],
    PASS: arr[5],
    SEMPURL: arr[6],
    SEMPNAME: arr[7],
    SEMPPASS: arr[8]
  }
  console.log(JSON.stringify(newReg));
  BrokerRegistration(newReg);
  BrokerBridgingConnection(newReg);
  // function call to SEMP to create the agency here
  DeleteRowFunction()
}