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
    connect.innerHTML = 'Username: '+username+'<br>'+'Message URL: '+hosturl+'<br>'+'VPN Name: '+vpn;
  };