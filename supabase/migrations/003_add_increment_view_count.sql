create or replace function increment_post_view_count(p_post_id uuid)
returns void
language sql
security definer
as $$
  update mdshare_posts set view_count = coalesce(view_count, 0) + 1 where id = p_post_id;
$$;
