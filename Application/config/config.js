// Central Broker (localhost): required
var account = {
    HOSTURL:    '',
    VPN:        '',
    USERNAME:   '',
    PASS:       '',
    PUBLICURL:  ''
}
// Represents one agency: optional
var LTA = {
    HOSTURL:    '',
    VPN:        '',
    remoteMsgVpnLocation:     '',
    USERNAME:   '',
    PASS:       '',
    SEMPURL:    '',
    SEMPNAME:   '',
    SEMPPASS:   ''
}
// Represents another agency: optional
var NEA = {
    NAME:       '',
    HOSTURL:    '',
    VPN:        '',
    USERNAME:   '',
    PASS:       '',
    SEMPURL:    '',
    SEMPNAME:   '',
    SEMPPASS:   ''
}
// Microsoft Computer Vision API, Change if necessary
var AzureAPI = {
    subscriptionKey:    '',
}

var GoogleMapAPI = {
    subscriptionKey:    '',
}