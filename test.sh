#/bin/bash

API_URL="https://348y3w30hk.execute-api.us-east-1.amazonaws.com/prod/"

curl -X POST $API_URL/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "bio": "Software engineer who loves building things"
  }'
