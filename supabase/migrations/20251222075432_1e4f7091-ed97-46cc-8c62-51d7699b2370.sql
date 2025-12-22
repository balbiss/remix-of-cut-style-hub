-- Add super_admin role to inoovawebpro@gmail.com
INSERT INTO user_roles (user_id, role)
VALUES ('d70db03f-36c2-4d07-bdb7-c3fea5e64b07', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;