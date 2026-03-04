#!/usr/bin/env python3
"""
Automated Base44 to ConstructFlow Migration Script
Replaces all Base44 SDK calls with new API client
"""

import os
import re
from pathlib import Path

# Configuration
SRC_DIR = Path("src")
REPLACEMENTS = [
    # Import replacements
    (r"import\s*{\s*base44\s*}\s*from\s*['\"]@/api/base44Client['\"]", 
     "import constructflowClient from '@/api/constructflowClient'"),
    
    (r"from\s+['\"]@base44/sdk['\"]",
     "from '@/api/constructflowClient'"),
    
    (r"import\s*{\s*createClient\s*}\s*from\s+['\"]@base44/sdk['\"]",
     "import constructflowClient from '@/api/constructflowClient'"),
    
    # Auth replacements
    (r"base44\.auth\.me\(\)",
     "constructflowClient.getCurrentUser()"),
    
    (r"base44\.auth\.logout\(\)",
     "constructflowClient.logout()"),
    
    (r"base44\.auth\.login\(",
     "constructflowClient.login("),
    
    # Projects
    (r"base44\.projects\.list\(",
     "constructflowClient.getProjects("),
    
    (r"base44\.projects\.get\(",
     "constructflowClient.getProject("),
    
    (r"base44\.projects\.create\(",
     "constructflowClient.createProject("),
    
    (r"base44\.projects\.update\(",
     "constructflowClient.updateProject("),
    
    (r"base44\.projects\.delete\(",
     "constructflowClient.deleteProject("),
    
    # Bids
    (r"base44\.bids\.list\(",
     "constructflowClient.getBids("),
    
    (r"base44\.bids\.get\(",
     "constructflowClient.getBid("),
    
    (r"base44\.bids\.create\(",
     "constructflowClient.createBid("),
    
    (r"base44\.bids\.update\(",
     "constructflowClient.updateBid("),
    
    (r"base44\.bids\.delete\(",
     "constructflowClient.deleteBid("),
    
    # Tasks
    (r"base44\.tasks\.list\(",
     "constructflowClient.getTasks("),
    
    (r"base44\.tasks\.get\(",
     "constructflowClient.getTask("),
    
    (r"base44\.tasks\.create\(",
     "constructflowClient.createTask("),
    
    (r"base44\.tasks\.update\(",
     "constructflowClient.updateTask("),
    
    (r"base44\.tasks\.delete\(",
     "constructflowClient.deleteTask("),
    
    # Contacts
    (r"base44\.contacts\.list\(",
     "constructflowClient.getContacts("),
    
    (r"base44\.contacts\.get\(",
     "constructflowClient.getContact("),
    
    (r"base44\.contacts\.create\(",
     "constructflowClient.createContact("),
    
    (r"base44\.contacts\.update\(",
     "constructflowClient.updateContact("),
    
    (r"base44\.contacts\.delete\(",
     "constructflowClient.deleteContact("),
    
    # Documents
    (r"base44\.documents\.list\(",
     "constructflowClient.getDocuments("),
    
    (r"base44\.documents\.get\(",
     "constructflowClient.getDocument("),
    
    (r"base44\.documents\.create\(",
     "constructflowClient.createDocument("),
    
    (r"base44\.documents\.update\(",
     "constructflowClient.updateDocument("),
    
    (r"base44\.documents\.delete\(",
     "constructflowClient.deleteDocument("),
    
    # Estimates
    (r"base44\.estimates\.list\(",
     "constructflowClient.getEstimates("),
    
    (r"base44\.estimates\.get\(",
     "constructflowClient.getEstimate("),
    
    (r"base44\.estimates\.create\(",
     "constructflowClient.createEstimate("),
    
    (r"base44\.estimates\.update\(",
     "constructflowClient.updateEstimate("),
    
    (r"base44\.estimates\.delete\(",
     "constructflowClient.deleteEstimate("),
    
    # Invoices
    (r"base44\.invoices\.list\(",
     "constructflowClient.getInvoices("),
    
    (r"base44\.invoices\.get\(",
     "constructflowClient.getInvoice("),
    
    (r"base44\.invoices\.create\(",
     "constructflowClient.createInvoice("),
    
    (r"base44\.invoices\.update\(",
     "constructflowClient.updateInvoice("),
    
    (r"base44\.invoices\.delete\(",
     "constructflowClient.deleteInvoice("),
]

def migrate_file(filepath):
    """Migrate a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main migration function"""
    print("🔄 Starting Base44 to ConstructFlow migration...")
    
    files_to_migrate = list(SRC_DIR.rglob("*.jsx")) + list(SRC_DIR.rglob("*.js"))
    migrated_count = 0
    
    for filepath in files_to_migrate:
        if migrate_file(filepath):
            print(f"✅ Migrated: {filepath}")
            migrated_count += 1
    
    print(f"\n✅ Migration complete!")
    print(f"📊 Files migrated: {migrated_count}/{len(files_to_migrate)}")

if __name__ == "__main__":
    main()
