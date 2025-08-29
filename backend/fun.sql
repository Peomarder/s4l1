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