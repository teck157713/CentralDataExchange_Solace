@ECHO OFF
setlocal enabledelayedexpansion
ECHO Starting Publishing.

for /f "usebackq tokens=1-5 delims=," %%a in ("TempData.csv") do (
      set "message="id":"%%a","lat":"%%b","long":"%%c","value":"%%d","timestamp":"%%e""
      echo !message!>txt.txt
      sdkperf_c -cip=tcp://mr8ksiwsp23vv.messaging.solace.cloud:20448 -cu=solace-cloud-client@msgvpn-jfgwkeg1ahl -cp=croo89sd2pkbmk49a325m21q1v -stl=NEA/1/temp_data/raw/%%b/%%c -ptl=NEA/1/temp_data/raw/%%b/%%c -mn=1 -md -pal=txt.txt )
    REM sdkperf_c -cip=ws://mr8ksiwsp23vv.messaging.solace.cloud:20483 -cu=solace-cloud-client@msgvpn-jfgwkefwydv -cp=9bsjj5sg7al2rj1ne5tkack131 -stl=NEA/1/temp_data/raw -ptl=NEA/1/temp_data/raw -mn=10 -md -pal=txt.txt )
PAUSE