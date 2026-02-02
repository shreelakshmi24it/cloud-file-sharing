#!/bin/sh

echo "=================================================="
echo "🚀 Starting Application Script"
echo "=================================================="

echo "📝 Managing database migrations..."
# Run migrations using node directly to avoid npm overhead
node dist/database/migrate.js
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
    echo "❌ Migration failed with exit code $MIGRATE_EXIT"
    exit 1
fi

echo "✅ Migrations completed successfully"

echo "=================================================="
echo "🚀 Launching Server"
echo "=================================================="

# Use exec to replace shell with node process
exec node dist/server.js
