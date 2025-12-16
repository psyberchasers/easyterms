# ContractLens Product Roadmap

## Overview
AI-powered music contract analysis platform with user accounts, contract management, and premium features.

## Tech Stack
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Polar (when ready)
- **AI**: OpenAI GPT-4o
- **PDF Rendering**: react-pdf

---

## Phase 1: Foundation ⚡
> **Goal**: Users can sign up, save contracts, and view them later

### 1.1 Supabase Setup
- [ ] Create Supabase project
- [ ] Configure environment variables
- [ ] Set up database schema (users, contracts, versions, dates)
- [ ] Configure storage bucket for PDFs
- [ ] Set up Row Level Security (RLS) policies

### 1.2 Authentication
- [ ] Install Supabase client
- [ ] Create auth context/provider
- [ ] Login page (Google + Email/Password)
- [ ] Sign up page
- [ ] Protected routes middleware
- [ ] User profile dropdown in header

### 1.3 Contract Storage
- [ ] Save analysis results to database
- [ ] Upload PDFs to Supabase Storage
- [ ] Link contracts to user accounts
- [ ] Update analyze page to save after analysis

### 1.4 Dashboard
- [ ] Create `/dashboard` page
- [ ] List user's saved contracts
- [ ] Contract cards with status, type, risk level
- [ ] Star/favorite contracts
- [ ] Delete contracts
- [ ] Quick stats sidebar

---

## Phase 2: Core Premium Features 💎
> **Goal**: Features that justify a paid subscription

### 2.1 Contract Comparison
- [ ] Create `/compare` page
- [ ] Select 2+ contracts to compare
- [ ] Side-by-side diff view
- [ ] Highlight what changed (better/worse)
- [ ] AI summary of key differences

### 2.2 Financial Calculator
- [ ] Add to analysis results
- [ ] Streaming royalty calculator
- [ ] Break-even analysis for recoupment
- [ ] "Streams needed for profit" metric
- [ ] Export projections

### 2.3 Negotiation Assistant
- [ ] Add "Negotiate" button to each clause
- [ ] AI generates counter-proposal language
- [ ] Template responses library
- [ ] Copy-to-clipboard functionality

### 2.4 PDF Export
- [ ] Generate professional PDF report
- [ ] Include branding
- [ ] Summary + all analysis sections
- [ ] Shareable for lawyers/managers

---

## Phase 3: Power Features 🚀
> **Goal**: Workflow and organization tools

### 3.1 Version Tracking
- [ ] Add "Upload New Version" to contract detail
- [ ] Version history timeline
- [ ] Diff between versions
- [ ] Track negotiation progress

### 3.2 Portfolio Dashboard
- [ ] Enhanced dashboard with stats
- [ ] Rights inventory ("You own X% of Y songs")
- [ ] Contract status breakdown (pie chart)
- [ ] Expiration timeline view
- [ ] Total advance/royalty summary

### 3.3 Calendar & Alerts
- [ ] Extract key dates from contracts
- [ ] Calendar view of deadlines
- [ ] Email reminders (X days before)
- [ ] Google Calendar sync
- [ ] In-app notifications

### 3.4 Industry Benchmarks
- [ ] Aggregate anonymized contract data
- [ ] Compare user's terms to averages
- [ ] "Your royalty rate vs. industry" indicators
- [ ] Deal quality scoring

---

## Phase 4: Distribution & Growth 🌐
> **Goal**: Expand reach and B2B opportunities

### 4.1 Embeddable Widget
- [ ] Create standalone widget bundle
- [ ] `<script>` tag embed code
- [ ] Grammarly-style floating button
- [ ] Customizable styling
- [ ] "Powered by ContractLens" branding

### 4.2 Shareable Analysis
- [ ] Public share links (optional)
- [ ] Password-protected sharing
- [ ] Collaboration comments
- [ ] Invite lawyer/manager to review

### 4.3 API (Future)
- [ ] REST API for platforms
- [ ] API key management
- [ ] Usage tracking
- [ ] Documentation

---

## Subscription Tiers (Polar Integration)

### Free Tier
- 3 contracts/month
- Basic analysis
- No save/export
- ContractLens branding

### Pro - $19/month
- Unlimited contracts
- Contract comparison
- Financial projections
- Negotiation suggestions
- Version tracking
- Calendar alerts
- PDF export
- Portfolio dashboard

### Team - $49/month
- Everything in Pro
- 5 team members
- Shared workspace
- Lawyer collaboration
- Priority support
- Custom branding (reports)

---

## Database Schema

```sql
-- Users (managed by Supabase Auth, extended with profiles)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  subscription_id text,
  contracts_this_month int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contracts
create table contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  file_name text,
  file_url text,
  file_type text,
  extracted_text text,
  analysis jsonb,
  contract_type text,
  status text default 'active', -- active, expired, terminated, negotiating
  overall_risk text, -- high, medium, low
  is_starred boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contract Versions (for tracking negotiations)
create table contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete cascade,
  version_number int not null,
  file_url text,
  extracted_text text,
  analysis jsonb,
  changes_summary text,
  created_at timestamptz default now()
);

-- Key Dates (for calendar/alerts)
create table contract_dates (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete cascade,
  date_type text not null, -- option_period, termination_window, renewal, expiration, payment
  date date not null,
  description text,
  alert_days_before int default 30,
  alert_sent boolean default false,
  created_at timestamptz default now()
);

-- Comparisons
create table comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text,
  contract_ids uuid[] not null,
  diff_summary jsonb,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table contracts enable row level security;
alter table contract_versions enable row level security;
alter table contract_dates enable row level security;
alter table comparisons enable row level security;

-- Policies (users can only access their own data)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own contracts" on contracts for select using (auth.uid() = user_id);
create policy "Users can insert own contracts" on contracts for insert with check (auth.uid() = user_id);
create policy "Users can update own contracts" on contracts for update using (auth.uid() = user_id);
create policy "Users can delete own contracts" on contracts for delete using (auth.uid() = user_id);

-- Similar policies for other tables...
```

---

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (already have)
OPENAI_API_KEY=your-openai-key

# Polar (when ready)
POLAR_ACCESS_TOKEN=your-polar-token
POLAR_WEBHOOK_SECRET=your-webhook-secret
```

---

## Current Progress

### Completed ✅
- [x] Basic contract analysis (AI-powered)
- [x] PDF, Word, TXT file support
- [x] Side-by-side analysis view
- [x] PDF viewer with highlighting
- [x] Click-to-highlight functionality
- [x] Plain English breakdown
- [x] Key terms, financial, concerns, advice tabs
- [x] Landing page with features
- [x] ngrok deployment

### In Progress 🔄
- [ ] Phase 1: User accounts & contract storage

### Next Up 📋
- [ ] Phase 2: Premium features

---

## Notes

- Focus on artist/creator experience first
- Keep UI clean and non-intimidating
- Always explain legal terms in plain English
- Mobile-responsive is important (artists on phones)
- Consider accessibility (WCAG compliance)




