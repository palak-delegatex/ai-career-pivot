-- Expand resume_versions template column to accept all 15 template keys.
-- The column is already TEXT with no CHECK constraint, so existing rows are safe.
-- Add a CHECK constraint to validate new inserts/updates.
alter table public.resume_versions
  add constraint resume_versions_template_check
  check (template in (
    'executive', 'classic', 'modern', 'minimal', 'bold',
    'creative', 'compact', 'tech', 'elegant', 'impact',
    'two-column', 'swiss', 'soft', 'metric', 'noir',
    'professional'
  ));

-- Migrate legacy 'professional' template to 'executive' (closest equivalent)
update public.resume_versions
  set template = 'executive'
  where template = 'professional';
