/** Upper bounds for auth-related text fields (paste / abuse protection, aligns with common DB varchar sizes). */

/** Per field; typical DB varchar(50) — enough for normal names without huge pastes. */
export const MAX_NAME_LENGTH = 50;

/** Editable full name on profile: two capped parts plus a space. */
export const MAX_FULL_NAME_LENGTH = MAX_NAME_LENGTH * 2 + 1;

/**
 * Paste/abuse cap for the email field. The SMTP spec allows up to 254 chars for a pathological
 * address; real inboxes are almost always under ~80. 128 keeps the UI sane while fitting any normal address.
 */
export const MAX_EMAIL_LENGTH = 128;

/** Bcrypt (Supabase) only hashes the first 72 bytes; this cap matches that and blocks absurd pastes. */
export const MAX_PASSWORD_LENGTH = 72;
