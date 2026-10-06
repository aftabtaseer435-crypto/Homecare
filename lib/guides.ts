// Step-by-step help guides (Roman Urdu). Each step names the real screen /
// button in the app so users can follow along.

export type GuideStep = { title: string; body: string; tip?: string; link?: [label: string, href: string] };
export type Guide = {
  slug: string;
  title: string;
  who: string;
  summary: string;
  time: string;
  steps: GuideStep[];
  faq?: [string, string][];
};

export const guides: Guide[] = [
  {
    slug: 'society-admin',
    title: 'Society admin guide',
    who: 'Society committee, office ya secretary',
    summary: 'Society register karne se le kar pehli fund collection aur WhatsApp reminders tak — poora setup.',
    time: '30 minute',
    steps: [
      {
        title: 'Mobile number se login karein',
        body: 'Upar "Login" dabayein, apna mobile number likhein aur SMS mein aaya 6 digit code daalein. Pehli dafa apna naam likhna hoga.',
        link: ['Login', '/login'],
      },
      {
        title: 'Society register karne ki request bhejein',
        body: 'Society ka naam, city, address, andazan kitne ghar hain, aur admin ka mobile number likhein. Request free hai.',
        tip: 'Society ka letterhead ya registration number ho to likh dein — verification jaldi hoti hai.',
        link: ['Society register karein', '/societies/register'],
      },
      {
        title: 'Verification call ka intezar karein',
        body: 'Hamari team aap ko call kar ke confirm karti hai. Approve hote hi aap ke Dashboard par "Society admin panel" nazar aane lagta hai.',
      },
      {
        title: 'Ghar add karein — sab ek sath',
        body: 'Admin panel → "Ghar" tab. "Ghar ek sath banayein" form mein Block (agar hai), Gali from–to aur Ghar from–to likhein. Misal: Gali 1 se 40, Ghar 1 se 50 = 2000 ghar ek click mein.',
        tip: 'Agar ghar numbers seedhi tarteeb mein nahi (jaise 12-A, 12-B) to Excel se copy kar ke "Excel / CSV se import" box mein paste karein: block, gali, ghar, plot size, owner naam, owner mobile.',
      },
      {
        title: 'Khaas ghar mark karein',
        body: '"Ghar" tab mein gali choose karein. Khali plot, mosque, park ya committee ke ghar ko "Exempt" kar dein — un par fund nahi lagega. Rent pe diye ghar ko "Rent pe" mark kar sakte hain.',
      },
      {
        title: 'Fund plan banayein',
        body: '"Fund plans" tab → Naya fund plan. Naam (jaise Development Fund 2026), har ghar ka amount, kitni dafa (har mahine / 3 mahine / saal / ek dafa) aur due tareekh (1 se 28). Save karte hi is mahine ke dues ban jate hain.',
        tip: 'Agle mahinon ke dues app khud har roz subah check kar ke bana deti hai. Purane mahine ka hisaab daalna ho to "Dues banayein" ke saath us mahine ki koi tareekh choose karein.',
      },
      {
        title: 'Owners ko jorein',
        body: 'Do tareeqe: (1) Society ke WhatsApp group mein link bhejein — log khud "Meri society" se apna ghar choose kar ke request bhejte hain, aap "Owners" tab mein Approve karte hain. (2) Jo log app use nahi karte unka naam aur number "Owner khud add karein" se daal dein.',
        tip: 'Ek ghar par do log claim karein to "Conflict" ka label aata hai — call kar ke confirm karein phir sahi wale ko approve karein.',
      },
      {
        title: 'Overview — green aur red',
        body: '"Overview" par poori society gali-war plates mein nazar aati hai: green = jama, red = baqi, orange = aadha, grey = exempt. Upar total collection aur target. Kisi plate par click karein to us ghar ki payment screen khulti hai.',
      },
      {
        title: 'WhatsApp reminders bhejein',
        body: '"WhatsApp reminders" tab mein woh sab ghar hain jin ka fund agle 3 din mein due hai ya late ho chuka hai. Har naam ke saamne "WhatsApp" button dabayein — message pehle se likha hua aap ke WhatsApp mein khulega, bas Send dabayein.',
        link: ['WhatsApp reminders guide', '/guides/whatsapp-reminders'],
      },
      {
        title: 'Payments record karein',
        body: '"Payments" tab: Gali aur ghar number likh kar "Dhoondein". Amount aur tareeqa (cash, bank, JazzCash, Easypaisa) choose kar ke Save. Receipt number banta hai aur "Receipt bhejein" button se owner ko WhatsApp par receipt chali jati hai.',
        tip: 'Residents ki bheji hui screenshots isi page par "verify karein" section mein aati hain — screenshot dekh kar Verify ya Reject.',
      },
      {
        title: 'Defaulters list aur Excel',
        body: '"Defaulters" tab mein late gharon ki list, owner ka naam aur number. "CSV / Excel download" se file committee meeting ke liye nikal lein.',
      },
      {
        title: 'Team aur notices',
        body: '"Team" tab se collector add karein (woh sirf payment entry kar sakta hai, settings nahi). "Notices" mein notice likhein aur "WhatsApp group mein share" se society group mein bhej dein.',
      },
    ],
    faq: [
      ['Kya residents ek doosre ka status dekh sakte hain?', 'Nahi. Har owner sirf apna ghar dekhta hai. Poori list sirf admin aur collector ke paas hai.'],
      ['Agar ghalat payment entry ho jaye?', 'Payment "Recent payments" mein nazar aati hai. Abhi correction ke liye platform admin se rabta karein; edit ka option agle update mein aa raha hai.'],
      ['Ek se zyada admin ho sakte hain?', 'Haan, "Team" tab se kisi bhi registered number ko Admin ya Collector bana sakte hain.'],
    ],
  },
  {
    slug: 'makan-malik',
    title: 'Makan malik guide',
    who: 'Ghar ke owner / residents',
    summary: 'Apna ghar app mein add karna, fund ka status dekhna aur payment ka saboot bhejna.',
    time: '5 minute',
    steps: [
      { title: 'Login karein', body: '"Login" dabayein, mobile number likhein aur SMS code daalein. Naam likh kar continue.', link: ['Login', '/login'] },
      {
        title: 'Apni society dhoondein',
        body: '"Meri society" mein society ka naam ya city likh kar search karein aur apni society choose karein.',
        tip: 'Society nazar nahi aa rahi? Ho sakta hai abhi register na hui ho — committee ko bataein ya khud "Society register karein" se request bhejein.',
        link: ['Meri society', '/societies/join'],
      },
      { title: 'Gali aur ghar number choose karein', body: 'Block (agar hai), phir gali, phir ghar number list se choose karein. Apna naam check kar ke "Register karein".' },
      { title: 'Approval ka intezar', body: 'Society admin aap ki request approve karega. Tab tak Dashboard par "Verification pending" likha hoga.' },
      {
        title: 'Status dekhein',
        body: 'Dashboard par aap ke ghar ke saamne bara badge: green "Paid" ya red "Not paid", amount aur due date. "History aur payment" se poora record.',
      },
      {
        title: 'Online payment ka saboot bhejein',
        body: 'JazzCash / Easypaisa / bank se society ke account mein paise bhejein. Phir "History aur payment" → amount, tareeqa, transaction ID likhein aur screenshot upload karein.',
        tip: 'Admin verify karte hi status green ho jata hai aur receipt number milta hai.',
      },
      { title: 'Cash dena hai?', body: 'Society office ya collector ko dein. Woh app mein entry karega aur aap ko WhatsApp par receipt aa jayegi.' },
    ],
    faq: [
      ['Mera ghar kisi aur ke naam par dikh raha hai?', 'Society admin se rabta karein — woh "Owners" tab se theek kar sakta hai.'],
      ['WhatsApp messages band karne hain?', 'Society admin ko bata dein; aap ka opt-out record ho jayega.'],
    ],
  },
  {
    slug: 'collector',
    title: 'Collector guide',
    who: 'Fund collect karne wale',
    summary: 'Ghar ghar ya office mein cash le kar app mein entry aur receipt.',
    time: '5 minute',
    steps: [
      { title: 'Admin se add karwayein', body: 'Pehle apne number se app par login karein. Phir society admin aap ko "Team" tab se Collector bana dega. Dashboard par society panel nazar aane lagega.' },
      { title: 'Payments tab kholein', body: 'Society panel → "Payments".' },
      { title: 'Ghar dhoondein', body: 'Block, gali aur ghar number likh kar "Dhoondein". Us ghar ke saare dues aur jama shuda amount nazar aate hain.' },
      { title: 'Amount save karein', body: 'Due choose karein, amount (pehle se baqi amount bhara hota hai), tareeqa "Cash" aur "Save + receipt". Receipt number screen par aata hai.' },
      { title: 'Receipt bhejein', body: 'Hari patti mein "Receipt bhejein" dabayein — owner ko WhatsApp par receipt chali jati hai.' },
      { title: 'Apne hisse ke reminders', body: '"WhatsApp reminders" mein gali ka filter laga kar sirf apni galiyon ke baqi gharon ko message bhejein.' },
    ],
  },
  {
    slug: 'whatsapp-reminders',
    title: 'WhatsApp reminders guide',
    who: 'Admin aur collectors',
    summary: 'Baqi gharon ko apne WhatsApp se ek click mein reminder — bina kisi Meta account ya verification ke.',
    time: '3 minute',
    steps: [
      { title: '"WhatsApp reminders" tab kholein', body: 'Society panel mein. Do hisse hain: "Agle 3 din mein due" aur "Overdue".' },
      { title: 'List dekhein', body: 'Har line mein ghar, owner, baqi amount aur due date. Sirf woh ghar jin ka owner number record mein hai aur jin ka fund baqi hai.' },
      { title: 'WhatsApp dabayein', body: 'Phone par WhatsApp app khul jati hai, computer par WhatsApp Web. Message pehle se likha hota hai — naam, ghar, amount, tareekh aur status dekhne ka link. Send dabayein.' },
      { title: 'Wapas aa kar agla', body: 'Button grey ho jata hai aur "Bheja" ki tareekh aa jati hai, taake pata rahe kis ko bhej diya. "Message log" tab mein poora record.' },
    ],
    faq: [
      ['Kya ek sath 500 log ko message ja sakta hai?', 'Is mode mein ek ek kar ke bhejna hota hai (har message 2–3 second). Kaam galiyon ke hisaab se collectors mein baant lein. Fully automatic sending baad mein Meta WhatsApp API se on ho sakti hai.'],
      ['Mera number block to nahi hoga?', 'Sirf apni society ke logon ko, unke apne fund ke baare mein message bhejein aur ek din mein ek dafa. Spam na karein.'],
    ],
  },
  {
    slug: 'service-provider',
    title: 'Service provider guide',
    who: 'Electrician, plumber, masi, rickshaw, mistri — har kaam wale',
    summary: 'Free profile bana kar apne area ki societies se seedha kaam lena.',
    time: '10 minute',
    steps: [
      { title: 'Login karein', body: 'Apne mobile number se login karein.', link: ['Login', '/login'] },
      { title: 'Provider register form', body: 'Naam ya dukaan ka naam, city, call number, WhatsApp number (agar alag hai), tajurba aur rates.', link: ['Provider banein', '/provider/register'] },
      { title: 'Apna kaam choose karein', body: 'Ek se zyada choose kar sakte hain — jaise Electrician + AC repair.' },
      { title: 'Societies aur area', body: 'Jin societies mein kaam karte hain unhein tick karein. Un societies ke residents ko aap list mein sab se upar nazar aayenge.' },
      { title: 'Photo aur CNIC', body: 'Saaf photo lagayein. CNIC ki aage aur peeche ki photo upload karein — yeh sirf verification ke liye hai, kisi customer ko nazar nahi aati.' },
      { title: 'Verification', body: 'Admin CNIC check kar ke "Verified" karta hai. Tab tak aap ki profile public list mein nahi aati.' },
      { title: 'Kaam aur rating', body: 'Customer aap ko seedha call ya WhatsApp karta hai. Kaam ke baad woh rating deta hai. "Provider dashboard" par 30 din ki calls, WhatsApp aur rating nazar aati hai.', tip: 'Busy hon to dashboard se "Busy" kar dein — list mein neeche chale jayenge.' },
    ],
  },
  {
    slug: 'service-lena',
    title: 'Service lene ki guide',
    who: 'Residents jinhein electrician, plumber, masi waghera chahiye',
    summary: 'Sahi banda dhoondna, rabta karna aur rating dena.',
    time: '2 minute',
    steps: [
      { title: 'Services kholein', body: 'Neeche menu ya upar "Services" → category choose karein.', link: ['Services', '/services'] },
      { title: 'Filter', body: 'Apni society choose karein — us society mein kaam karne wale pehle aate hain. Verified, rating aur "abhi available" sab nazar aata hai.' },
      { title: 'Rabta', body: '"Call" ya "WhatsApp" dabayein. Rates aur waqt khud tay karein.' },
      { title: 'Rating dein', body: 'Kaam ke baad provider ki profile par stars aur review dein — doosron ki madad hoti hai.' },
      { title: 'Masla hua?', body: 'Profile ke neeche "Shikayat / report karein". Admin check karta hai aur zaroorat par provider ko band kar deta hai.' },
    ],
  },
  {
    slug: 'ghar-rent-sale',
    title: 'Ghar rent / sale guide',
    who: 'Owners aur kiraydar / kharidar',
    summary: 'Listing banana, verified badge, aur seedha owner se rabta.',
    time: '5 minute',
    steps: [
      { title: 'Listing banayein', body: '"Rent / Sale" → "Apna ghar list karein". Rent ya sale, title, city, size, kamre, portion, price aur advance.', link: ['Ghar list karein', '/properties/new'] },
      { title: 'Verified badge', body: '"Mera registered ghar" mein apna society wala ghar choose karein. Agar aap us ghar ke verified owner hain to listing par "Society verified" badge lagta hai.' },
      { title: 'Photos', body: '8–15 saaf photos: bahar, har kamra, kitchen, bathroom. Din ki roshni mein lein.' },
      { title: 'Rabta aur leads', body: 'Log aap ko call ya WhatsApp karte hain. Listing par kitne logon ne rabta kiya, yeh aap ko nazar aata hai.' },
      { title: 'Rent ho gaya / bik gaya', body: 'Listing kholein → "Rent ho gaya" ya "Bik gaya". Listing band ho jati hai.' },
      { title: 'Kiraye par ghar dhoond rahe hain?', body: '"Rent / Sale" mein city, society, budget aur bedrooms ka filter lagayein. Pasand aaye to "Save karein".' },
    ],
  },
  {
    slug: 'app-install',
    title: 'Phone par app install karein',
    who: 'Sab ke liye',
    summary: 'App ko home screen par lagayein — phir yeh baqi apps ki tarah khulti hai.',
    time: '1 minute',
    steps: [
      { title: 'Android (Chrome)', body: 'Website Chrome mein kholein → upar right teen dots (⋮) → "Add to Home screen" ya "Install app" → Install.' },
      { title: 'iPhone (Safari)', body: 'Website Safari mein kholein → neeche Share button (□↑) → "Add to Home Screen" → Add.' },
      { title: 'Kholein', body: 'Home screen par hara icon aa jata hai. Ek dafa login karne ke baad baar baar login nahi karna parta.' },
      { title: 'Play Store', body: 'Android app Play Store par jald aa rahi hai — wahi account, wahi data.' },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
