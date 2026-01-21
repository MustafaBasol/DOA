#!/bin/bash

# Test script for DOA Backend API

echo "🧪 Testing DOA Backend API"
echo "=========================="
echo ""

BASE_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "${BASE_URL}/health")
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi
echo ""

# Test 2: Login with admin
echo "2️⃣  Testing Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@autoviseo.com","password":"Admin123!"}')

if [[ $LOGIN_RESPONSE == *"accessToken"* ]]; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}❌ Admin login failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
fi
echo ""

# Test 3: Get current user
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo "3️⃣  Testing Get Current User..."
    ME_RESPONSE=$(curl -s -X GET "${BASE_URL}/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if [[ $ME_RESPONSE == *"admin@autoviseo.com"* ]]; then
        echo -e "${GREEN}✅ Get current user successful${NC}"
        echo "   Response: $ME_RESPONSE"
    else
        echo -e "${RED}❌ Get current user failed${NC}"
    fi
    echo ""

    # Test 4: List users (admin only)
    echo "4️⃣  Testing List Users (Admin)..."
    USERS_RESPONSE=$(curl -s -X GET "${BASE_URL}/users?page=1&limit=10" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if [[ $USERS_RESPONSE == *"users"* ]]; then
        echo -e "${GREEN}✅ List users successful${NC}"
        echo "   Found users in response"
    else
        echo -e "${RED}❌ List users failed${NC}"
    fi
    echo ""
fi

# Test 5: Login with client
echo "5️⃣  Testing Client Login..."
CLIENT_LOGIN=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Client123!"}')

if [[ $CLIENT_LOGIN == *"accessToken"* ]]; then
    echo -e "${GREEN}✅ Client login successful${NC}"
    CLIENT_TOKEN=$(echo $CLIENT_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    # Test 6: Get profile
    echo ""
    echo "6️⃣  Testing Get Profile (Client)..."
    PROFILE=$(curl -s -X GET "${BASE_URL}/users/profile/me" \
        -H "Authorization: Bearer $CLIENT_TOKEN")
    
    if [[ $PROFILE == *"test@example.com"* ]]; then
        echo -e "${GREEN}✅ Get profile successful${NC}"
    else
        echo -e "${RED}❌ Get profile failed${NC}"
    fi
else
    echo -e "${RED}❌ Client login failed${NC}"
fi

echo ""
echo "=========================="
echo "🎉 Tests completed!"
