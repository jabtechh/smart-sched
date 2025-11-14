#!/bin/bash

echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔨 Building functions..."
cd functions && npm run build && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Functions build failed!"
    exit 1
fi

echo "🚀 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment complete!"
    echo "🌐 Visit your site at your Firebase hosting URL"
else
    echo "❌ Deployment failed!"
    exit 1
fi
