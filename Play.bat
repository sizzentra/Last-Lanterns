@echo off
rem Starts the game on this computer and opens it in your browser.
rem Keep this black window open while you play. Close it when you are done.
start "" http://localhost:8123/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1"
