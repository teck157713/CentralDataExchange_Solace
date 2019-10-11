// Central Broker (localhost): required
var account = {
    HOSTURL:    '',
    VPN:        '',
    USERNAME:   '',
    PASS:       '',
    PUBLICURL:  ''
}
// Represents one agency: optional, required for publishing data on console
var LTA = {
    HOSTURL:    'ws://mr8ksiwsp23vv.messaging.solace.cloud:20483',
    VPN:        'msgvpn-jfgwkefwydv',
    remoteMsgVpnLocation:     'mr8ksiwsp23vv.messaging.solace.cloud:20480',
    USERNAME:   'solace-cloud-client',
    PASS:       '9bsjj5sg7al2rj1ne5tkack131',
    SEMPURL:    'mr8ksiwsp23vv.messaging.solace.cloud:20494',
    SEMPNAME:   'msgvpn-jfgwkefwydv-admin',
    SEMPPASS:   '5ugnmo24ab72hd2fu5a84r1nfc'
}
// Represents another agency: optional, required for console for simulating publish data
var NEA = {
    NAME:       'NEA',
    HOSTURL:    'ws://mr8ksiwsp23vv.messaging.solace.cloud:20451',
    VPN:        'msgvpn-jfgwkeg1ahl',
    USERNAME:   'solace-cloud-client',
    PASS:       'croo89sd2pkbmk49a325m21q1v',
    SEMPURL:    'mr8ksiwsp23vv.messaging.solace.cloud:20462',
    SEMPNAME:   'msgvpn-jfgwkeg1ahl-admin',
    SEMPPASS:   'j2h5k373182c86h1nsa1quismk'
}
// Microsoft Computer Vision API, Change if necessary
var AzureAPI = {
    subscriptionKey:    '',
}

var GoogleMapAPI = {
    subscriptionKey:    '',
}
//required
var host = {
    HOSTURL:    'wss://mr1dns3dpz5wkd.messaging.solace.cloud:443',
    VPN:        'centraleventxchange',
    USERNAME:   'solace-cloud-client',
    PASS:       'imb02ttjvvfnv9olr4ngijf4i4',
    SEMPURL:    'mr1dns3dpz5wkd.messaging.solace.cloud:943',
    SEMPNAME:   'centraleventxchange-admin',
    SEMPPASS:   'knvorlmnr9d3buomevbpq8jil7',
    PUBLICURL:  'v:single-aws-ap-southeast-1a-1dns3dpz5wkd',
    remoteMsgVpnLocation:     'mr1dns3dpz5wkd.messaging.solace.cloud:440'
}