-- Allow anonymous users to look up email by username for login purposes
-- This function is safe as it only returns the email address, which is necessary for authentication

CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.users
    WHERE LOWER(username) = LOWER(p_username)
    LIMIT 1;
    
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users for login
GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon;

