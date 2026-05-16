-- Per-item expiry notification preferences and scheduled local notification id storage.

alter table public.food_items
  add column if not exists notifications_enabled boolean default true;

alter table public.food_items
  add column if not exists notification_reminder_days integer default 7;

alter table public.food_items
  add column if not exists notification_time text default '13:00';

alter table public.food_items
  add column if not exists notification_repeat text default 'none';

alter table public.food_items
  add column if not exists notification_ids jsonb default '[]'::jsonb;

alter table public.food_items
  drop constraint if exists food_items_notification_reminder_days_check;

alter table public.food_items
  add constraint food_items_notification_reminder_days_check
  check (notification_reminder_days is null or notification_reminder_days >= 1);

alter table public.food_items
  drop constraint if exists food_items_notification_repeat_check;

alter table public.food_items
  add constraint food_items_notification_repeat_check
  check (
    notification_repeat is null
    or notification_repeat in ('none', 'daily', 'weekly', 'monthly')
  );
