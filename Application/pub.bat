@ECHO OFF
ECHO Starting Publishing.

for /f "usebackq tokens=1-2 delims=," %%a in ("hello.csv") do (
      echo %%a> txt.txt 
      sdkperf_c -cip=tcp://mr8ksiwsp23vv.messaging.solace.cloud:20448 -cu=solace-cloud-client@msgvpn-jfgwkeg1ahl -cp=croo89sd2pkbmk49a325m21q1v -stl=a/topic -ptl=a/topic -mn=1 -md -pal=txt.txt)
PAUSE