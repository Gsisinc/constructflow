#!/bin/bash

# Fix Calendar.jsx
sed -i '216,217s/isLoading ? <TableSkeleton \/>\:/{isLoading ? (/' src/pages/Calendar.jsx

# Fix Budget.jsx  
sed -i '153,154s/isLoading ? <DashboardSkeleton \/>\:/{isLoading ? (/' src/pages/Budget.jsx

# Fix Issues.jsx
sed -i '189,190s/isLoading ? <TableSkeleton \/>\:/{isLoading ? (/' src/pages/Issues.jsx

# Fix Materials.jsx
sed -i '193,194s/isLoading ? <TableSkeleton \/>\:/{isLoading ? (/' src/pages/Materials.jsx

# Fix PurchaseOrders.jsx
sed -i '104,105s/isLoading ? <TableSkeleton \/>\:/{isLoading ? (/' src/pages/PurchaseOrders.jsx

echo "Fixed all ternaries"
