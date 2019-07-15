// CONFIG FILE refers to all the required data that is needed for the application system. This includes the access to PubSub + Cloud for Solace, as well as required credential for
// local docker.
var account = {
    HOSTURL:    'ws://localhost',
    VPN:        'default',
    USERNAME:   'admin',
    PASS:       'admin'
}

var LTA = {
    HOSTURL:    'ws://mr8ksiwsp23vv.messaging.solace.cloud:20483',
    VPN:        'msgvpn-jfgwkefwydv',
    USERNAME:   'solace-cloud-client',
    PASS:       '9bsjj5sg7al2rj1ne5tkack131'
}

var NEA = {
    HOSTURL:    'ws://mr8ksiwsp23vv.messaging.solace.cloud:20451',
    VPN:        'msgvpn-jfgwkeg1ahl',
    USERNAME:   'solace-cloud-client',
    PASS:       'croo89sd2pkbmk49a325m21q1v'
}

