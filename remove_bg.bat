@echo off
if "%~1"=="" (
    echo Usage: remove_bg.bat input.png [output.png]
    exit /b 1
)

set INPUT=%~1
set OUTPUT=%~2
if "%~2"=="" set OUTPUT=%~n1_transparent%~x1

if not exist ".venv" (
    echo Creating virtual environment and installing rembg...
    python -m venv .venv
    call .\.venv\Scripts\activate.bat
    pip install "rembg[cpu,cli]"
) else (
    call .\.venv\Scripts\activate.bat
)

echo Removing background from %INPUT%...
rembg i "%INPUT%" "%OUTPUT%"
echo Done! Saved to %OUTPUT%
