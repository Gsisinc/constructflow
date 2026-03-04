#!/bin/bash

# Fix remaining base44 references with sed

cd /home/ubuntu/constructflow-migration

# LLM invocations
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.integrations\.Core\.InvokeLLM(/constructflowClient.post("\/llm\/invoke", /g'

# File uploads
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.integrations\.Core\.UploadFile(/constructflowClient.post("\/documents\/upload", /g'

# Entity filters (generic)
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.entities\.\([A-Za-z]*\)\.filter(/constructflowClient.get\1s(/g'

# Entity creates
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.entities\.\([A-Za-z]*\)\.create(/constructflowClient.create\1(/g'

# Entity updates
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.entities\.\([A-Za-z]*\)\.update(/constructflowClient.update\1(/g'

# Entity deletes
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.entities\.\([A-Za-z]*\)\.delete(/constructflowClient.delete\1(/g'

# Auth checks
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.auth\.isAuthenticated()/constructflowClient.getToken() !== null/g'

# Agents
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.agents\.createConversation(/constructflowClient.post("\/agents\/conversation", /g'
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's/base44\.agents\.addMessage(/constructflowClient.post("\/agents\/message", /g'

echo "✅ Fixed remaining base44 references"
