# SocietyHub

Housing society ke liye ek hi app:

1. **Society + Development Fund** — society free register, ghar/owners ka record, har ghar ka fund status (green = jama, red = baqi), payment entry, receipts, defaulters list, notices, aur due date se 3 din pehle automatic WhatsApp reminder.
2. **Home Services** — electrician, plumber, masi, rickshaw, AC repair waghera. Provider apni profile banata hai (CNIC verification), consumer category choose kar ke seedha Call / WhatsApp karta hai, phir rating deta hai.
3. **Property Rent / Sale** — owner ghar list karta hai (society-verified badge), buyer/tenant search, filter, call/WhatsApp, save.

Stack: **Next.js 14 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind + Meta WhatsApp Cloud API**, Vercel par deploy. Mobile par PWA ki tarah install hota hai.

---

## 1. Setup (pehli dafa, ~30 minute)

### a) Supabase project
1. [supabase.com](https://supabase.com) par naya project banayein (region: Singapore ya Mumbai).
2. **SQL Editor** mein ye do files order se chalayein:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_storage_seed.sql`
3. **Authentication → Providers → Phone** enable karein aur ek SMS provider connect karein (Twilio / MessageBird / Vonage / Textlocal).
   Testing ke liye **Authentication → Phone → Test phone numbers** mein apna number + fixed OTP (jaise `923001234567=123456`) daal dein — SMS ka kharcha nahi hoga.
4. **Project Settings → API** se `URL`, `anon key`, `service_role key` copy karein.

### b) Local run
```bash
cp .env.example .env.local     # values bharein
npm install
npm run dev                    # http://localhost:3000
```

### c) Apne aap ko Super Admin banayein
Pehle app par apne number se login karein, phir Supabase SQL Editor mein:
```sql
update public.profiles set is_super_admin = true where phone = '923001234567';
```
Ab header mein **Super Admin** link aayega.

### d) Vercel deploy
1. Repo ko Vercel par import karein.
2. `.env.example` ke saare variables Vercel → Settings → Environment Variables mein daalein (`CRON_SECRET` lambi random string).
3. `vercel.json` mein daily cron already hai: roz **05:00 UTC = 10:00 AM Pakistan** par `/api/cron/daily` chalta hai (naye dues + reminders).
4. Supabase → Authentication → URL Configuration mein apna domain daal dein.

---

## 2. WhatsApp setup (Meta Cloud API)

Jab tak `WHATSAPP_TOKEN` aur `WHATSAPP_PHONE_NUMBER_ID` khali hain, system **dry-run** mein chalta hai: messages `messages_log` mein `dry_run` status ke sath save hote hain lekin bheje nahi jate. Is se poora flow bina WhatsApp ke test ho jata hai.

Live karne ke liye:
1. [Meta Business](https://business.facebook.com) account + business verification.
2. developers.facebook.com → App banayein → WhatsApp product add karein → ek naya number (jo kisi WhatsApp par na ho) add karein.
3. Permanent access token (System User) banayein → `WHATSAPP_TOKEN`; number ka ID → `WHATSAPP_PHONE_NUMBER_ID`.
4. **WhatsApp Manager → Message templates** mein ye 4 templates (category: **Utility**) banayein aur approve karwayein. Naam `.env` mein badal bhi sakte hain, lekin `{{n}}` variables ki tarteeb yahi rakhein:

**fund_reminder**
```
Assalam o Alaikum {{1}}, {{2}} ka {{3}} — {{4}} ({{5}}) ki due date {{6}} hai. Abhi tak jama nahi hua, meharbani kar ke waqt par jama karwa dein. Shukriya.
```
**fund_overdue**
```
Assalam o Alaikum {{1}}, {{2}} ka {{3}} — {{4}} ({{5}}) ki due date {{6}} guzar chuki hai. Meharbani kar ke jald jama karwayein.
```
**payment_receipt**
```
Shukriya {{1}}! {{2}} jama ho gaye — {{3}}, {{4}}, {{5}}. Receipt no: {{6}}.
```
**society_notice**
```
Assalam o Alaikum {{1}}, {{2}} ki taraf se naya notice: {{3}}. Detail app mein dekhein.
```

Reminder schedule har society ka admin **Fund plans** page se badal sakta hai (default: `-3, 0, 3, 7` = 3 din pehle, due wale din, 3 aur 7 din baad). Payment verify hote hi reminders khud band.

> Meta har template message ka charge leta hai — current Pakistan rate Meta ki pricing page par check karein. Sirf un owners ko message jata hai jinhone opt-in kiya ho.

---

## 3. Poora flow (A to Z)

### Society
1. Society admin `/societies/register` par free request bhejta hai.
2. Super Admin `/admin` par call kar ke verify karta hai → **Approve** → society ban jati hai aur requester uska admin.
3. Admin `/s/<id>/houses` par ghar banata hai: range (Gali 1–40 × Ghar 1–50) ya Excel/CSV paste (`block, gali, ghar, plot_size, owner_name, owner_mobile`).
4. Admin `/s/<id>/funds` par fund plan banata hai (amount, monthly/quarterly/yearly/one-time, due tareekh). Dues foran ban jate hain; aage har period ke roz cron se.
5. Owners `/societies/join` par society → gali → ghar choose kar ke claim karte hain; admin `/s/<id>/owners` par approve karta hai. Admin khud bhi owner add kar sakta hai — woh owner jab isi number se login karega, ghar khud link ho jayega.
6. **Overview** page par poori society grid mein: har ghar green (paid) / red (not paid) / orange (partial) / grey (exempt).
7. Payment: collector `/s/<id>/payments` par cash entry karta hai → receipt number + WhatsApp receipt. Ya owner `/my/houses/<id>` par JazzCash/Easypaisa screenshot upload karta hai → admin verify.
8. Defaulters list + CSV/Excel download, notices (WhatsApp broadcast optional), team (admin / collector), WhatsApp log.

### Services
1. Provider `/provider/register`: naam, number, kaam (multiple), area, societies, rates, photo, CNIC front/back.
2. Super Admin `/admin/providers` par CNIC dekh kar **Verify**.
3. Consumer `/services` → category (e.g. Electrician) → apni society ke providers pehle, rating ke hisaab se → **Call** / **WhatsApp**.
4. Call/WhatsApp karne wala hi review de sakta hai (fake reviews se bachao). Complaints `/admin/complaints` par.
5. Provider `/provider/dashboard`: calls/WhatsApp leads (30 din), rating, available/busy toggle, profile edit.

### Property
1. `/properties/new`: rent ya sale, details, photos (15 tak). Agar owner ka ghar society mein verified hai to **Society verified** badge.
2. `/properties`: filters (rent/sale, city, society, price, bedrooms). Detail page par call/WhatsApp, save, report.
3. Owner: rented / sold / hide / delete, leads count; `/my/listings`.

---

## 4. Code structure

```
app/
  page.tsx                  landing
  login/ onboarding/        OTP login, naam
  dashboard/                user ka home: ghar + status, admin panels, provider, listings
  societies/register|join   society request, ghar claim
  my/houses/[id]            owner: dues, history, payment proof upload
  my/listings               meri + saved listings
  s/[sid]/...               SOCIETY ADMIN: overview grid, houses, owners, funds, payments,
                            defaulters (+export), notices, team, messages
  admin/...                 SUPER ADMIN: requests, societies, providers, categories, complaints
  services/ services/[slug] categories + providers list
  providers/[id]            provider profile, reviews, complaint
  provider/register|dashboard
  properties/ new/ [id]/    listings
  api/cron/daily            daily dues + reminders (Vercel Cron)
lib/
  auth.ts                   requireUser / requireSocietyStaff / requireSuperAdmin
  notify.ts                 reminders, receipts, notice broadcast
  whatsapp.ts               Meta Cloud API (dry-run without keys)
  supabase/                 server, browser, service-role clients
supabase/migrations/        schema, RLS security, triggers, functions, seed
```

**Security:** har table par Row Level Security hai — ek society ka admin doosri society ka data nahi dekh sakta; owner sirf apne ghar ke dues; provider apna status ya rating khud nahi badal sakta; resident payment ko khud "verified" nahi kar sakta; CNIC aur payment screenshots private bucket mein (sirf admins signed link se dekhte hain).

---

## 5. Aage kya (roadmap)
- JazzCash / Easypaisa online payment gateway (merchant account ke baad)
- In-app booking (time slot, "on the way" status), provider commission
- Call masking / in-app chat (number hide karne ke liye)
- Featured listings, provider subscription plans, society premium plan
- Expense ledger (fund kahan kharch hua), late fee auto-apply
- Urdu UI toggle, native Android app (Flutter / Capacitor)
