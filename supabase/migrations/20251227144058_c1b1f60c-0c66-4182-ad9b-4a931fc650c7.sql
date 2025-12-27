-- Update the default value for tutor_name from 'Alex' to 'Gilbert'
ALTER TABLE user_tutor_preferences 
ALTER COLUMN tutor_name SET DEFAULT 'Gilbert';