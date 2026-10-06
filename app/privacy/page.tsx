export const metadata = { title: 'Privacy Policy', description: 'Hum kaun sa data lete hain, kaise use karte hain, aur account delete kaise karein.', alternates: { canonical: '/privacy' } };

// NOTE: review this text with your own details (company name, contact email)
// before submitting to Google Play.
export default function Privacy() {
  const app = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';
  return (
    <article className="card mx-auto max-w-3xl space-y-4 text-sm leading-relaxed">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <h2>Hum kya data lete hain</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Account:</b> mobile number (OTP login ke liye) aur naam.</li>
        <li><b>Society record:</b> society, block, gali, ghar number, owner ka naam aur number, development fund ke dues aur payments.</li>
        <li><b>Payment proof:</b> agar aap JazzCash / Easypaisa / bank ka screenshot upload karein.</li>
        <li><b>Service providers:</b> naam, number, photo, kaam ki categories, area aur CNIC images (sirf verification ke liye — public nahi hoti).</li>
        <li><b>Property listings:</b> jo details aur photos aap khud daalein.</li>
        <li><b>Usage:</b> provider ya listing par call / WhatsApp button dabane ka record (leads aur reviews ke liye).</li>
      </ul>

      <h2>Data kaise use hota hai</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Aap ki society ka admin aap ke ghar ka fund status dekhta aur payments record karta hai.</li>
        <li>Fund reminders, receipts aur society notices WhatsApp par bheje ja sakte hain (aap opt-out kar sakte hain).</li>
        <li>Provider ka naam, number, rating aur area public list mein dikhte hain; CNIC sirf admin dekhta hai.</li>
        <li>Property listing ka contact number buyers / tenants ko dikhta hai.</li>
      </ul>

      <h2>Sharing</h2>
      <p>Hum aap ka data bechte nahi. Data sirf aap ki society ke admin/collector aur platform admin dekh sakte hain, aur hosting (Supabase, Vercel) ke zariye secure tareeqe se store hota hai. Qanooni zaroorat par hi kisi authority ko diya ja sakta hai.</p>

      <h2>Security</h2>
      <p>Har society ka data alag rakha jata hai (row-level security). CNIC aur payment screenshots private storage mein hain aur sirf authorised admin ko temporary link se dikhte hain.</p>

      <h2>Account aur data delete</h2>
      <p>App mein <a href="/account/delete">Account delete</a> page se aap apna account khud delete kar sakte hain, ya {email} par request bhej sakte hain. Society ke fund payment records society ke hisaab kitaab ke liye society ke paas reh sakte hain, lekin aap ka login aur provider / listing profile delete ho jati hai.</p>

      <h2>Rabta</h2>
      <p>{app} — {email}</p>
    </article>
  );
}
