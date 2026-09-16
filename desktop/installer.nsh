; Copy optional sidecar asset zips from the folder containing Setup.exe.
!macro customInstall
  CreateDirectory "$INSTDIR\resources\asset-packs"
  CopyFiles /SILENT "$EXEDIR\MapleEnchant-assets-*.zip" "$INSTDIR\resources\asset-packs"
!macroend
