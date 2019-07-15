#!/bin/sh
 
echo "Press [CTRL+C] to stop.."
# SETUP commands
 
 
# use a variable for the Solace Router HOST before running the CURL commands
export hosturl='https://mr8ksiwsp23vv.messaging.solace.cloud:20494'
export username='msgvpn-jfgwkefwydv-admin'
export password='5ugnmo24ab72hd2fu5a84r1nfc'
export vpnname='msgvpn-jfgwkefwydv'
 
 
echo ' List profiles'
curl -X GET -u $username:$password $hosturl/SEMP/v2/config/msgVpns/msgvpn-jfgwkefwydv/aclProfiles -H "content-type: application/json"
 
echo ' specific profile'
 
curl -X GET -u $username:$password $hosturl/SEMP/v2/config/msgVpns/msgvpn-jfgwkefwydv/aclProfiles/default -H "content-type: application/json"