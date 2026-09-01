#!/usr/bin/env bash
set -euo pipefail

psql=(psql --username "$POSTGRES_USER" --dbname postgres --set ON_ERROR_STOP=1)

"${psql[@]}" \
  --set backend_password="$BACKEND_DB_PASSWORD" \
  --set auth_password="$AUTH_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE backend_app LOGIN PASSWORD %L', :'backend_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'backend_app')\gexec

SELECT format('CREATE ROLE auth_app LOGIN PASSWORD %L', :'auth_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'auth_app')\gexec

SELECT 'CREATE DATABASE backend_db OWNER backend_app'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'backend_db')\gexec

SELECT 'CREATE DATABASE auth_db OWNER auth_app'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec
SQL

psql=(psql --username "$POSTGRES_USER" --set ON_ERROR_STOP=1)
for database in backend_db auth_db; do
  role="${database%_db}_app"
  "${psql[@]}" --dbname "$database" <<SQL
REVOKE CONNECT ON DATABASE $database FROM PUBLIC;
GRANT CONNECT ON DATABASE $database TO $role;
SQL
done
