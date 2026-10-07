# Android app (Google Play) — TWA

Play Store app isi website ka wrapper hai (Trusted Web Activity). Code ek hi hai:
website update karo, app khud update ho jati hai. Nayi `.aab` sirf tab chahiye jab
naam, icon ya package badalna ho.

## Pehle se zaroori
- Website live ho apne domain par (HTTPS), jaise `societyhub.pk`.
- `https://YOUR-DOMAIN/manifest.webmanifest` browser mein khule.
- Google Play Developer account (one-time fee).
- Computer par Node.js 18+ aur Java 17 (Bubblewrap khud JDK / Android SDK download karne ki offer karta hai — "Yes" kar dein).

## 1. App build karein (pehli dafa ~20 minute)

```bash
npm i -g @bubblewrap/cli
mkdir societyhub-android && cd societyhub-android

# apne domain ke sath:
bubblewrap init --manifest https://YOUR-DOMAIN.com/manifest.webmanifest
```

Sawalon ke jawab (ya `android/twa-manifest.json` dekh kar wahi values):
- Domain: `YOUR-DOMAIN.com` · Start URL: `/dashboard?source=app`
- Application ID (package): `com.housingwelfare.app` — **yeh baad mein kabhi nahi badal sakta**, soch kar rakhein
- App name: Housing Welfare · Theme color `#059669`
- Signing key: naya bana lein. **`android.keystore` file aur password sambhal kar rakhein** (Google Drive / password manager). Gum ho jaye to naya update upload karne ke liye Google support se upload key reset karwani paregi — lamba kaam.

```bash
bubblewrap build
```
Is se do files banti hain: `app-release-bundle.aab` (Play Store ke liye) aur `app-release-signed.apk` (phone par khud test karne ke liye).

## 2. Play Console
1. play.google.com/console → **Create app** → naam, language, "App", "Free".
2. **App content** bharein:
   - Privacy policy URL: `https://YOUR-DOMAIN.com/privacy`
   - Account deletion URL: `https://YOUR-DOMAIN.com/account/delete`
   - Data safety: phone number, naam, photos (provider/listing), files (payment proof) — "collected", "not shared/sold", encrypted in transit, user can request deletion.
   - Ads: No · Target audience: 18+ · Content rating questionnaire.
3. Store listing: short + full description, 512px icon (`public/icons/icon-512.png`), feature graphic 1024×500, kam az kam 2 phone screenshots.
4. **Testing → Closed testing** track banayein, `.aab` upload karein, testers ke Gmail add karein. (Naye personal developer accounts ko production se pehle closed test chalana parta hai — Play Console mein requirement check kar lein.)

## 3. App aur website ko jorein (browser bar hatane ke liye)
1. Play Console → **Setup → App signing** → "App signing key certificate" ka **SHA-256** copy karein.
2. Local APK test karna ho to `bubblewrap fingerprint` / keystore ka SHA-256 bhi lein.
3. Vercel env mein:
   ```
   ANDROID_PACKAGE_NAME=com.housingwelfare.app
   ANDROID_SHA256_FINGERPRINTS=AA:BB:...,CC:DD:...
   ```
4. Redeploy → `https://YOUR-DOMAIN.com/.well-known/assetlinks.json` khol kar check karein ke package aur fingerprint nazar aa rahe hain.
5. App phone par kholein — upar browser ka URL bar **nahi** hona chahiye. Agar nazar aaye to fingerprint ghalat hai.

## Naya version
`twa-manifest.json` mein `appVersionCode` +1 karein → `bubblewrap update` → `bubblewrap build` → nayi `.aab` upload.
(Sirf website ke changes ke liye yeh zaroori nahi.)
