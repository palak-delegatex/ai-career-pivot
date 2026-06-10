import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || !secret || serviceKey.slice(-8) !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  const sql = `
    create table if not exists public.resume_versions (
      id              uuid default gen_random_uuid() primary key,
      email           text not null,
      name            text not null,
      target_role     text,
      target_company  text,
      job_description text,
      template        text not null default 'professional',
      status          text not null default 'draft' check (status in ('draft','ready','sent','archived')),
      match_score     int check (match_score is null or (match_score >= 0 and match_score <= 100)),
      content         jsonb not null default '{}',
      enabled_skills  jsonb not null default '[]',
      enabled_experience_indices jsonb not null default '[]',
      sections        jsonb not null default '{}',
      generated_text  text,
      created_at      timestamptz default now(),
      updated_at      timestamptz default now()
    );

    create index if not exists resume_versions_email_idx on public.resume_versions (email);
    create index if not exists resume_versions_status_idx on public.resume_versions (email, status);

    alter table public.resume_versions enable row level security;

    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename = 'resume_versions' and policyname = 'service_role_only_resume_versions'
      ) then
        create policy "service_role_only_resume_versions" on public.resume_versions
          using (auth.role() = 'service_role');
      end if;
    end $$;

    do $$ begin
      if not exists (
        select 1 from pg_trigger where tgname = 'resume_versions_updated_at'
      ) then
        create trigger resume_versions_updated_at
          before update on public.resume_versions
          for each row execute function public.set_updated_at();
      end if;
    end $$;
  `;

  const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).single();

  if (error) {
    const { error: rawError } = await supabase.from("resume_versions").select("id").limit(0);
    if (rawError) {
      return NextResponse.json({ error: rawError.message, note: "table does not exist and rpc failed — apply migration manually" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, note: "table already exists (rpc unavailable but table verified)" });
  }

  return NextResponse.json({ ok: true });
}
