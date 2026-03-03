-- Step 2: Add SU user with telegram_id 597397363
INSERT INTO "users" (
    id,
    telegram_id,
    telegram_username,
    first_name,
    last_name,
    phone,
    avatar_url,
    role,
    language,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    597397363,
    'su',
    'Super',
    'User',
    NULL,
    NULL,
    'su',
    'uk',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (telegram_id) DO UPDATE SET
    role = 'su',
    is_active = true,
    updated_at = NOW();
