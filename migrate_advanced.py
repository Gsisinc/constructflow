#!/usr/bin/env python3
"""Advanced Base44 migration for complex patterns"""

import os
import re
from pathlib import Path

SRC_DIR = Path("src")

# Advanced patterns that require more careful replacement
ADVANCED_REPLACEMENTS = [
    # Auth checks
    (r"base44\.auth\.isAuthenticated\(\)",
     "constructflowClient.getToken() !== null"),
    
    # Entity operations (generic pattern)
    (r"base44\.entities\.(\w+)\.filter\(",
     r"constructflowClient.get\1s("),
    
    (r"base44\.entities\.(\w+)\.create\(",
     r"constructflowClient.create\1("),
    
    (r"base44\.entities\.(\w+)\.update\(",
     r"constructflowClient.update\1("),
    
    (r"base44\.entities\.(\w+)\.delete\(",
     r"constructflowClient.delete\1("),
    
    # Agents
    (r"base44\.agents\.createConversation\(",
     "constructflowClient.post('/agents/conversation',"),
    
    (r"base44\.agents\.subscribeToConversation\(",
     "constructflowClient.get('/agents/conversation/"),
    
    (r"base44\.agents\.addMessage\(",
     "constructflowClient.post('/agents/message',"),
    
    # Integrations
    (r"base44\.integrations\.Core\.UploadFile\(",
     "constructflowClient.post('/documents/upload',"),
]

def migrate_file(filepath):
    """Migrate a single file with advanced patterns"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in ADVANCED_REPLACEMENTS:
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error: {filepath}: {e}")
        return False

def main():
    files = list(SRC_DIR.rglob("*.jsx")) + list(SRC_DIR.rglob("*.js"))
    migrated = 0
    
    for filepath in files:
        if migrate_file(filepath):
            print(f"✅ Advanced migration: {filepath}")
            migrated += 1
    
    print(f"\n✅ Advanced migration complete! {migrated} files updated")

if __name__ == "__main__":
    main()
