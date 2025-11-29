#!/bin/bash

# Script to create test users and following relationships
# This script will:
# 1. Create 24 new users
# 2. Make 15 users follow meg123
# 3. Make meg123 follow 21 users

echo "🚀 Starting user creation script..."
echo "=================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it to your Supabase database URL"
    echo "Example: export DATABASE_URL='postgresql://postgres:password@host:port/database'"
    exit 1
fi

# Check if Python script exists
SCRIPT_PATH="scripts/create_test_users_simple.py"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Python script not found at $SCRIPT_PATH"
    exit 1
fi

# Check if asyncpg is installed
python3 -c "import asyncpg" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing required dependencies..."
    pip3 install asyncpg
fi

# Run the Python script
echo "🐍 Running Python script..."
python3 "$SCRIPT_PATH"

echo "=================================="
echo "✨ Script execution completed!"
