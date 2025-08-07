#!/bin/bash

echo "📦 Installing test dependencies..."

# Jest and Testing Library
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Mock libraries
npm install --save-dev msw whatwg-fetch

echo "✅ Test dependencies installed!"
echo "Run 'npm test' to execute tests"