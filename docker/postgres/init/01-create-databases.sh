#!/usr/bin/env bash
set -euo pipefail

psql=(psql --username "$POSTGRES_USER" --dbname postgres --set ON_ERROR_STOP=1)

"${psql[@]}" \
  --set backend_password="$BACKEND_DB_PASSWORD" \
  --set backend_migration_password="$BACKEND_MIGRATION_DB_PASSWORD" \
  --set auth_password="$AUTH_DB_PASSWORD" \
  --set auth_migration_password="$AUTH_MIGRATION_DB_PASSWORD" <<'SQL'
SELECT format(
  'CREATE ROLE backend_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
  :'backend_password'
)
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'backend_app')\gexec

SELECT format(
  'CREATE ROLE backend_migration_user LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
  :'backend_migration_password'
)
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'backend_migration_user')\gexec

SELECT format(
  'CREATE ROLE auth_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
  :'auth_password'
)
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'auth_app')\gexec

SELECT format(
  'CREATE ROLE auth_migration_user LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
  :'auth_migration_password'
)
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'auth_migration_user')\gexec

SELECT 'CREATE DATABASE backend_db OWNER backend_migration_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'backend_db')\gexec

SELECT 'CREATE DATABASE auth_db OWNER auth_migration_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec
SQL

psql=(psql --username "$POSTGRES_USER" --set ON_ERROR_STOP=1)
for database in backend_db auth_db; do
  app_role="${database%_db}_app"
  migration_role="${database%_db}_migration_user"
  "${psql[@]}" --dbname "$database" <<SQL
REVOKE CONNECT ON DATABASE $database FROM PUBLIC;
GRANT CONNECT ON DATABASE $database TO $app_role, $migration_role;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO $app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $app_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO $app_role;

ALTER DEFAULT PRIVILEGES FOR ROLE $migration_role IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $app_role;
ALTER DEFAULT PRIVILEGES FOR ROLE $migration_role IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO $app_role;
SQL
done
