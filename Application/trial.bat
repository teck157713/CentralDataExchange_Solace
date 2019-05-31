@ECHO OFF
setlocal enabledelayedexpansion
ECHO Starting Publishing.

for /f "usebackq tokens=1-4 delims=," %%1 in ("TempData.csv") do (
      for /f "usebackq tokens=1-2 delims=," %%a in ("latlon.csv") do (
      set "message="id":"%%1","lat":"%%2","long":"%%3","value":"%%4""
      echo !message!>txt.txt
      sdkperf_c -cip=tcp://mr8ksiwsp23vv.messaging.solace.cloud:20448 -cu=solace-cloud-client@msgvpn-jfgwkeg1ahl -cp=croo89sd2pkbmk49a325m21q1v -stl=NEA/1/temp_data/raw/%%a/%%b -ptl=NEA/1/temp_data/raw/%%a/%%b -mn=1 -md -pal=txt.txt ))
    REM sdkperf_c -cip=ws://mr8ksiwsp23vv.messaging.solace.cloud:20483 -cu=solace-cloud-client@msgvpn-jfgwkefwydv -cp=9bsjj5sg7al2rj1ne5tkack131 -stl=NEA/1/temp_data/raw -ptl=NEA/1/temp_data/raw -mn=10 -md -pal=txt.txt )
PAUSE