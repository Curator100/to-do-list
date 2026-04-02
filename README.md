# ✦ Taskr — Simple To-Do App

A minimal todo app with login, built with plain HTML/CSS/JS + Supabase + Netlify.

---

## Stack
- **Frontend**: HTML + CSS + Vanilla JS
- **Auth + Database**: Supabase
- **Hosting**: Netlify (via GitHub)

---

## Step-by-Step Setup

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) → **Start your project**
2. Create a new project (give it a name, set a DB password, pick a region)
3. Wait ~1 min for it to spin up

### 2. Create the `todos` Table
In your Supabase dashboard → **SQL Editor** → paste and run this:

```sql
create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  task text not null,
  is_complete boolean default false,
  inserted_at timestamp with time zone default now()
);

-- Only let users see/edit their own todos
alter table todos enable row level security;

create policy "Users can manage their own todos"
  on todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 3. Get Your API Keys
In Supabase dashboard → **Project Settings** → **API**:
- Copy **Project URL** → this is your `SUPABASE_URL`
- Copy **anon / public** key → this is your `SUPABASE_ANON_KEY`

### 4. Add Keys to `app.js`
Open `app.js` and replace lines 3–4:
```js
const SUPABASE_URL = 'https://xxxx.supabase.co';       // ← paste here
const SUPABASE_ANON_KEY = 'eyJhbGc...';                // ← paste here
```

### 5. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskr.git
git push -u origin main
```

### 6. Deploy on Netlify
1. Go to [https://netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Connect your GitHub and select the `taskr` repo
3. Build settings: leave everything blank (no build command needed)
4. Click **Deploy site**
5. Done — your site will be live in ~30 seconds!

---

## What You Get
- Email + password sign-up / sign-in
- Add tasks, check them off, delete them
- Tasks saved per user in Supabase
- Auto-login on page refresh (session persists)
- Fully responsive

---

## Files
```
todo-app/
├── index.html      ← app UI
├── style.css       ← all styles
├── app.js          ← auth + todo logic
├── netlify.toml    ← Netlify routing config
└── README.md
```
