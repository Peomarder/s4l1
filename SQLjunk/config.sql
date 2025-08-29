-- Create tables

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP 
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; 
    END LOOP; 
END $$;

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace) 
    LOOP 
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '() CASCADE'; 
    END LOOP; 
END $$;



CREATE TABLE user_privileges (
    id_privilege SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
	view_locks BOOLEAN DEFAULT false,
	view_users BOOLEAN DEFAULT false,
	view_logs BOOLEAN DEFAULT false,
	edit_locks BOOLEAN DEFAULT false,
	edit_users BOOLEAN DEFAULT false
);

CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    id_privilege INTEGER NOT NULL REFERENCES user_privileges(id_privilege),
    name VARCHAR(100),
	password VARCHAR(2047),
	token VARCHAR(2049),
	token_expiry TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) UNIQUE,
    login VARCHAR(50) UNIQUE,
	deleted BOOLEAN DEFAULT false
);

CREATE TABLE actions (
    id_action SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
-- Add this right after creating the actions table
SELECT setval('actions_id_action_seq', 1, false);

CREATE TABLE locks (
    id_lock SERIAL PRIMARY KEY,
    id_privilege INTEGER NOT NULL REFERENCES user_privileges(id_privilege),
    is_open BOOLEAN NOT NULL DEFAULT false,
	deleted BOOLEAN DEFAULT FALSE,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE log_entries (
    id_log SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES users(id_user),
    id_action INTEGER NOT NULL REFERENCES actions(id_action),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_lock INTEGER NOT NULL REFERENCES locks(id_lock) ON DELETE RESTRICT
);

CREATE TABLE system_log (
    id_system_log SERIAL PRIMARY KEY,
    id_action INTEGER NOT NULL REFERENCES actions(id_action),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    affected_ip INET NOT NULL,
    user_agent TEXT,
    user_id INTEGER REFERENCES users(id_user),
    endpoint VARCHAR(255),
    method VARCHAR(127),
    details TEXT
);

-- Create indexes for faster queries
CREATE INDEX idx_log_entries_user ON log_entries(id_user);
CREATE INDEX idx_log_entries_action ON log_entries(id_action);
CREATE INDEX idx_system_log_action ON system_log(id_action);
-----------
-- User-defined functions
-----------1
CREATE OR REPLACE FUNCTION get_user_privilege(user_id INTEGER)
RETURNS TABLE(privilege_id INT, privilege_name VARCHAR) AS $$
BEGIN
    RETURN QUERY 
    SELECT p.id_privilege, p.name
    FROM users u
    JOIN user_privileges p ON u.id_privilege = p.id_privilege
    WHERE u.id_user = user_id;
END;
$$ LANGUAGE plpgsql;
----2
CREATE OR REPLACE FUNCTION count_actions_by_user(
    user_id INTEGER, 
    start_time TIMESTAMP DEFAULT NOW() - INTERVAL '30 days', 
    end_time TIMESTAMP DEFAULT NOW()
) RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM log_entries 
        WHERE id_user = user_id 
        AND timestamp BETWEEN start_time AND end_time
    );
END;
$$ LANGUAGE plpgsql;
----3
CREATE OR REPLACE FUNCTION check_lock_status(lock_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT is_open FROM locks WHERE id_lock = lock_id);
END;
$$ LANGUAGE plpgsql;
----4
CREATE OR REPLACE FUNCTION get_failed_attempts(
    user_id INTEGER, 
    minutes_back INTEGER DEFAULT 15
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM log_entries l
        JOIN actions a ON l.id_action = a.id_action
        WHERE l.id_user = user_id
        AND l.timestamp > NOW() - (minutes_back * INTERVAL '1 minute')
        AND a.name LIKE '%Failed%'
    );
END;
$$ LANGUAGE plpgsql;

---------------------------------
--
-- Get user privilege
--SELECT * FROM get_user_privilege(1);
--
-- Count user actions
--SELECT count_actions_by_user(1);
--
-- Check lock status
--SELECT check_lock_status(1);
--
-- Get failed attempts
--SELECT get_failed_attempts(1);
--
---------------------------------
-----------
-- Triggers
-- 1. Prevent privilege deletion if in use
-----------

CREATE OR REPLACE FUNCTION prevent_privilege_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE id_privilege = OLD.id_privilege) THEN
        RAISE EXCEPTION 'Cannot delete privilege that is assigned to users';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER privilege_deletion_guard
BEFORE DELETE ON user_privileges
FOR EACH ROW EXECUTE FUNCTION prevent_privilege_deletion();

-- 2. Auto-log privilege changes
CREATE OR REPLACE FUNCTION log_privilege_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.id_privilege <> NEW.id_privilege THEN
        INSERT INTO system_log (id_action, affected_ip)
        VALUES (
            (SELECT id_action FROM actions WHERE name = 'Privilege Change'), 
            '0.0.0.0'  -- Placeholder IP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_privilege_change_audit
AFTER UPDATE OF id_privilege ON users
FOR EACH ROW EXECUTE FUNCTION log_privilege_changes();

-- 3. Prevent action deletion if logged
CREATE OR REPLACE FUNCTION prevent_action_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM log_entries 
        WHERE id_action = OLD.id_action
        UNION
        SELECT 1 
        FROM system_log 
        WHERE id_action = OLD.id_action
    ) THEN
        RAISE EXCEPTION 'Cannot delete action with existing log entries';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_deletion_guard
BEFORE DELETE ON actions
FOR EACH ROW EXECUTE FUNCTION prevent_action_deletion();

-- 4. Auto-close locks after 5 failed attempts
CREATE OR REPLACE FUNCTION auto_lock_account()
RETURNS TRIGGER AS $$
BEGIN
    IF get_failed_attempts(NEW.id_user) >= 5 THEN
        UPDATE locks 
        SET is_open = false 
        WHERE id_lock IN (
            SELECT l.id_lock 
            FROM locks l
            JOIN user_privileges p ON l.id_privilege = p.id_privilege
            JOIN users u ON u.id_privilege = p.id_privilege
            WHERE u.id_user = NEW.id_user
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function first
CREATE OR REPLACE FUNCTION is_failed_action(action_id INT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM actions 
        WHERE id_action = action_id 
        AND name LIKE '%Failed%'
    );
END;
$$ LANGUAGE plpgsql;

-- -- Then modify the trigger
-- CREATE OR REPLACE FUNCTION auto_lock_account()
-- RETURNS TRIGGER AS $$
-- BEGIN
    -- -- Your locking logic here
    -- RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 5. Audit user deletions
CREATE OR REPLACE FUNCTION audit_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_log (id_action, affected_ip)
    VALUES (
        (SELECT id_action FROM actions WHERE name = 'User Deletion'), 
        '0.0.0.0'  -- Placeholder IP
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_deletion_audit
AFTER DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_user_deletion();

---- token hsit


-- Create tokens table for refresh tokens
CREATE TABLE tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id_user),
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION validate_token(token_to_check VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE token = token_to_check 
    AND token_expiry > CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql;

-- Add these to your existing schema

-- Create refresh token function
-- CREATE OR REPLACE FUNCTION refresh_user_token(user_id INTEGER)
-- RETURNS VARCHAR AS $$
-- DECLARE
  -- new_token VARCHAR;
-- BEGIN
  -- SELECT jwt_sign(
    -- json_build_object(
      -- 'id_user', id_user,
      -- 'login', login,
      -- 'email', email,
      -- 'id_privilege', id_privilege,
      -- 'exp', EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour')
    -- ),
    -- 'energy_security_token'
  -- ) INTO new_token
  -- FROM users WHERE id_user = user_id;

  -- UPDATE users 
  -- SET token = new_token, 
      -- tokenexpiry = NOW() + INTERVAL '1 hour'
  -- WHERE id_user = user_id;

  -- RETURN new_token;
-- END;
-- $$ LANGUAGE plpgsql;

-- Create token validation function
CREATE OR REPLACE FUNCTION validate_user_token(token_to_check VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE token = token_to_check 
      AND token_expiry > NOW()
  );
END;
$$ LANGUAGE plpgsql;


-- stuff

-- Set default privileges
INSERT INTO user_privileges (name, description, view_locks, view_users, view_logs, edit_locks, edit_users)
VALUES 
  ('Admin', 'Administrator with full access', true, true, true, true, true),
  ('Employee', 'Employee with limited access', true, false, false, true, false),
  ('Guest', 'Guest with read-only access', true, false, false, false, false);


-- Set default privileges
UPDATE user_privileges SET 
    view_locks = true,
    view_users = true,
    view_logs = true,
    edit_locks = true,
    edit_users = true
WHERE name = 'Admin';

UPDATE user_privileges SET 
    view_locks = true,
    edit_locks = true
WHERE name = 'Employee';

UPDATE user_privileges SET 
    view_locks = true
WHERE name = 'Guest';


  -- 1. Log all privilege changes (more detailed than your current one)
-- CREATE OR REPLACE FUNCTION log_privilege_changes()
-- RETURNS TRIGGER AS $$
-- DECLARE
    -- old_priv_name TEXT;
    -- new_priv_name TEXT;
-- BEGIN
    -- SELECT name INTO old_priv_name FROM user_privileges WHERE id_privilege = OLD.id_privilege;
    -- SELECT name INTO new_priv_name FROM user_privileges WHERE id_privilege = NEW.id_privilege;
    
    -- INSERT INTO system_log (id_action, affected_ip, details)
    -- VALUES (
        -- (SELECT id_action FROM actions WHERE name = 'Privilege Change'),
        -- inet_client_addr(),
        -- json_build_object(
            -- 'user_id', NEW.id_user,
            -- 'old_privilege', old_priv_name,
            -- 'new_privilege', new_priv_name
        -- )::TEXT
    -- );
    -- RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 2. Log all lock state changes
--CREATE OR REPLACE FUNCTION log_lock_changes()
--RETURNS TRIGGER AS $$
--BEGIN
--    IF OLD.is_open <> NEW.is_open THEN
        -- INSERT INTO system_log (id_action, affected_ip, details)
        -- VALUES (
            -- (SELECT id_action FROM actions WHERE name = 'Lock Status Change'),
            -- inet_client_addr(),
            -- json_build_object(
                -- 'lock_id', NEW.id_lock,
                -- 'old_state', OLD.is_open,
                -- 'new_state', NEW.is_open,
                -- 'privilege_id', NEW.id_privilege
            -- )::TEXT
        -- );
    -- END IF;
    -- RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER lock_state_change_audit
-- AFTER UPDATE OF is_open ON locks
-- FOR EACH ROW EXECUTE FUNCTION log_lock_changes();

-- 3. Log all failed login attempts
CREATE OR REPLACE FUNCTION log_failed_logins()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM actions WHERE id_action = NEW.id_action AND name LIKE '%Failed%') THEN
        INSERT INTO system_log (id_action, affected_ip, details)
        VALUES (
            NEW.id_action,
            inet_client_addr(),
            json_build_object(
                'user_id', NEW.id_user,
                'attempt_time', NEW.timestamp
            )::TEXT
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER failed_login_audit
--AFTER INSERT ON log_entries
--FOR EACH ROW
--WHEN (EXISTS (SELECT 1 FROM actions WHERE id_action = NEW.id_action AND name LIKE '%Failed%'))
--EXECUTE FUNCTION log_failed_logins();

-- 4. Log all administrative actions
CREATE OR REPLACE FUNCTION log_admin_actions()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM users u
        JOIN user_privileges p ON u.id_privilege = p.id_privilege
        WHERE u.id_user = NEW.id_user AND p.edit_users = true
    ) THEN
        INSERT INTO system_log (id_action, affected_ip, details)
        VALUES (
            NEW.id_action,
            inet_client_addr(),
            json_build_object(
                'admin_id', NEW.id_user,
                'target_lock_id', NEW.id_lock,
                'action_time', NEW.timestamp
            )::TEXT
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_action_audit
AFTER INSERT ON log_entries
FOR EACH ROW EXECUTE FUNCTION log_admin_actions();
  
  
  
  -- Action types and their IDs:
-- 1: Create
-- 2: Update
-- 3: Delete
-- 4: System Event
-- 5: Login
-- 6: Login Failed
-- 7: Privilege Change
-- 8: User Deletion
-- 9: User Creation
-- 10: Lock Creation
-- 11: Lock Status Change
-- 12: Page View
-- 13: API Call
-- 14: Unauthorized Access Attempt

INSERT INTO actions (id_action, name, description) VALUES
  (1, 'Create', 'Generic creation action'),
  (2, 'Update', 'Generic update action'),
  (3, 'Delete', 'Generic deletion action'),
  (4, 'System Event', 'System-level event'),
  (5, 'Login', 'Successful user authentication'),
  (6, 'Login Failed', 'Failed authentication attempt'),
  --(7, 'Privilege Change', 'User privilege modification'),
  (8, 'User Deletion', 'User account removal'),
  (9, 'User Creation', 'User account created'),
 -- (10, 'Lock Creation', 'Security lock created'),
--  (11, 'Lock Status Change', 'Security lock modification'),
  (12, 'Page View', 'User viewed a page'),
  (13, 'API Call', 'API endpoint was called'),
  (14, 'Unauthorized Access Attempt', 'Attempt to access restricted resource')
ON CONFLICT (id_action) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description;