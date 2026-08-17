!macro customInit
  ; Auto-terminate running RP Assistant process before installation/update
  nsExec::Exec 'cmd.exe /c taskkill /F /IM "RP Assistant.exe" /T'
  Sleep 500
!macroend

!macro customInstall
  ; Additional custom post-install operations if needed
!macroend

!macro customUnInstall
  ; Auto-terminate running RP Assistant process before uninstall
  nsExec::Exec 'cmd.exe /c taskkill /F /IM "RP Assistant.exe" /T'
  Sleep 500
!macroend
