@echo off
REM RAG Evaluation Cockpit — Desktop Launcher for Windows
echo Starting RAG Evaluation Cockpit (AI-04)...

SET ROOT_DIR=%~dp0
IF EXIST "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    "%ROOT_DIR%backend\.venv\Scripts\python.exe" "%ROOT_DIR%desktop\app.py"
) ELSE (
    python "%ROOT_DIR%desktop\app.py"
)
pause
