@echo off
echo Building project...
call npm run build

if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo Building functions...
cd functions
call npm run build
cd ..

if %errorlevel% neq 0 (
    echo Functions build failed!
    exit /b %errorlevel%
)

echo Deploying to Firebase...
call firebase deploy

if %errorlevel% equ 0 (
    echo Deployment complete!
    echo Visit your site at your Firebase hosting URL
) else (
    echo Deployment failed!
    exit /b %errorlevel%
)
