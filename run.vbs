Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
pythonwPath = fso.BuildPath(scriptDir, "venv\Scripts\pythonw.exe")
appPath = fso.BuildPath(scriptDir, "app.py")
WshShell.Run """" & pythonwPath & """ """ & appPath & """", 0, False
