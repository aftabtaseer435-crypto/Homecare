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
      { title: 'Paisa kahan laga?', body: '"Fund ka hisaab" mein har kharcha raseed ke sath. Gali mein koi masla ho to "Masla report karein" — seedha aap ki gali ke welfare agent ko.', link: ['Masla report guide', '/guides/masla-report'] },
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
    slug: 'masla-report',
    title: 'Masla report karna (welfare)',
    who: 'Makan malik',
    summary: 'Gali ki light, pani, gutter, sarak, safai, security ya legal masla — ek click mein apni gali ke welfare agent tak, aur har qadam ka status.',
    time: '1 minute',
    steps: [
      { title: 'Welfare kholein', body: 'Menu → Society → "Masla report karein". Wahan aap ki gali ke welfare agent ka naam aur number bhi likha hota hai.', link: ['Welfare', '/welfare'] },
      { title: 'Masle ki qisam choose karein', body: '"Light ka masla" ya "Legal masla" ka button dabayein, ya "Koi aur masla" mein se choose karein. Paigham pehle se likha hota hai — zaroorat ho to badal lein.' },
      { title: 'Tasveer lagayein (optional)', body: 'Phone se seedha tasveer khinch kar lagayein — agent ko masla jaldi samajh aata hai.' },
      { title: 'Report karein', body: '"Report karein aur WhatsApp par bhejein" dabayein. Masle ka number (jaise M-1024) banta hai aur WhatsApp khul jata hai — agent ko paigham bhejne ke liye Send dabayein.', tip: 'Agar aap ki gali mein yehi masla pehle se report ho chuka ho to app batati hai — naya report karne ke bajaye "+1" karein, agent ko pata chalta hai kitne ghar mutasir hain.' },
      { title: 'Status dekhein', body: 'Laal = agent ka intezar, peela = agent ne dekh liya / kaam jari, hara = hal ho gaya. Har tabdeeli ki tareekh "Poori tareekh" mein likhi hoti hai, aur har masle ka ek waqt muqarrar hai (light 48 ghante, pani 24 ghante).' },
      { title: 'Confirm karein', body: 'Agent "hal ho gaya" kar de to aap ko WhatsApp aata hai. App mein masla kholein, rating dein aur "Haan, hal ho gaya" dabayein — dono taraf status hara. Agar theek nahi hua to "Dobara kholein".' },
      { title: 'Fund ka hisaab dekhein', body: '"Fund ka hisaab" mein har kharche ki tafseel, raseed aur har welfare agent ki karkardagi (kitne masle hal, kitni dair mein, rating) nazar aati hai.', link: ['Fund ka hisaab', '/hisaab'] },
    ],
    faq: [
      ['Mera masla kaun dekh sakta hai?', 'Sirf aap, aap ki gali ka welfare agent aur society admin. Legal aur "koi aur" masle private hain. Gali ke masle (light, pani) par padosi sirf +1 kar sakte hain — aap ka naam nahi dekhte.'],
      ['Agent ne jawab nahi diya to?', 'Waqt guzarte hi masla "late" ho jata hai aur society admin ki list mein laal nazar aata hai. Agent ki karkardagi sab residents ko dikhti hai.'],
    ],
  },
  {
    slug: 'welfare-agent',
    title: 'Welfare agent guide',
    who: 'Block ya gali ke welfare agent',
    summary: 'Apni gali ke masle hal karna, har ghar ko check karna, aur kharche ka hisaab dena.',
    time: '10 minute',
    steps: [
      { title: 'Muqarrar hona', body: 'Pehle apne number se app par login karein. Society admin "Welfare" tab se aap ko block ya gali ki zimmedari deta hai. Phir Dashboard aur Welfare page par "Agent panel" ka button aa jata hai.' },
      { title: 'Naye masle', body: 'Resident report karta hai to aap ko WhatsApp par paigham aata hai jis mein link hota hai. Agent panel → "Masle" mein sab khule masle hain — sab se urgent (late) sab se upar.' },
      { title: '"Dekh liya" dabayein', body: 'Masla kholte hi "Dekh liya" dabayein — resident ka status laal se peela ho jata hai aur usay pata chal jata hai ke kisi ne sun liya. Kaam shuru ho to "Kaam shuru".' },
      { title: 'Hal karein aur submit karein', body: 'Kaam ho jaye to "Kya kiya" likhein, kaam ke baad ki tasveer lagayein, aur agar fund se paisa laga to amount likhein. "Hal ho gaya — submit" dabayein.', tip: 'Amount likhne se kharcha khud "Kharcha" mein chala jata hai — admin approve karta hai, phir sab residents ko hisaab mein nazar aata hai.' },
      { title: 'Resident ko batayein', body: 'Submit ke baad "Resident ko batayein" button se WhatsApp karein. Resident confirm karta hai aur rating deta hai — dono taraf hara. 7 din tak confirm na ho to masla khud band ho jata hai.' },
      { title: 'Ghar check karein', body: 'Agent panel → "Ghar (checking)": aap ki galiyon ke sab ghar, owner ka naam aur number. Chakkar lagayein, haal poochein aur "Check ✓" karein (sab theek / masla mila / ghar par koi nahi). Masla mile to wahin "Masla darj" karein.' },
      { title: 'Kharcha darj karein', body: 'Agent panel → "Kharcha": jo bhi paisa fund se laga, raseed ki tasveer ke sath darj karein. Bina raseed ke admin reject kar sakta hai.' },
    ],
    faq: [
      ['Meri karkardagi kaun dekhta hai?', 'Har resident "Fund ka hisaab" page par dekh sakta hai: kitne masle hal kiye, kitne late hain, average waqt aur rating.'],
      ['Legal masle?', 'Woh private hote hain. Resident se rabta kar ke rehnumai karein; zaroorat ho to society admin ko shamil karein.'],
    ],
  },
  {
    slug: 'service-provider',
    title: 'Provider / dukaan guide',
    who: 'Electrician, plumber, masi, rickshaw — aur chicken, sabzi, kiryana, dawai ki dukaan',
    summary: 'Free profile, orders lena, din / raat ke auqaat aur mahine ka hisaab.',
    time: '10 minute',
    steps: [
      { title: 'Services → "Main kaam karta / bechta hoon"', body: 'Login karein, phir Services kholein aur doosra option chunein.', link: ['Shuru karein', '/provider'] },
      { title: 'Profile form', body: 'Naam ya dukaan ka naam, city, call aur WhatsApp number, tajurba, rates ya delivery charges, aur area.' },
      { title: 'Auqaat', body: '"Din ki service" aur / ya "Raat ki service" — kab se kab tak. Customer ko "Abhi khula" ya "Band — 8 PM se" nazar aata hai; raat wale filter mein sirf raat ki service wale aate hain.', tip: 'Raat 8 se 2 jaisa waqt bhi chalta hai — aadhi raat ke paar.' },
      { title: 'Kaam / saman chunein', body: 'Ek se zyada chun sakte hain — jaise Chicken + Rashan, ya Electrician + AC repair. Jin societies mein jate hain unhein tick karein.' },
      { title: 'Photo aur CNIC', body: 'CNIC sirf verification ke liye hai, kisi customer ko nazar nahi aata. Admin verify kare to aap list mein aa jate hain.' },
      { title: 'Orders', body: 'Customer ka order "Provider dashboard → Orders" mein aata hai: naam, number, pata, kya chahiye. "Qubool karein", phir saman de kar "Mukammal ✓" aur bill likhein.', link: ['Provider dashboard', '/provider/dashboard'] },
      { title: 'Mahine ka hisaab', body: '"History aur hisaab" tab mein har mahine ki calls, WhatsApp, profile views, orders, cancel aur kamai.', tip: 'Busy hon to "Abhi busy hoon" dabayein — list mein "Abhi khula" nahi dikhega.' },
    ],
  },
  {
    slug: 'service-lena',
    title: 'Saman mangwane / kaam karwane ki guide',
    who: 'Har ghar wala — jise chicken, sabzi, dawai ya electrician, plumber chahiye',
    summary: 'Sahi dukaan ya banda dhoondna, order bhejna, history aur kharch.',
    time: '2 minute',
    steps: [
      { title: 'Services → "Mujhe kuch chahiye"', body: 'Neeche menu se Services, phir pehla option. Category chunein.', link: ['Kuch mangwayein', '/services/find'] },
      { title: 'Filter', body: '"Abhi khule hue" ya "Raat ko service" chunein. Apni society wale pehle aate hain; rating aur auqaat sab nazar aata hai.' },
      { title: 'Order bhejein', body: '"Order" dabayein, likhein kya chahiye aur kab. Pata khud bhar jata hai. Agle page par ek click se order WhatsApp par bhi chala jata hai.' },
      { title: 'Mil gaya?', body: '"Meri orders" mein "Mil gaya ✓" dabayein aur kitne paise diye likhein — mahine ka kharch khud jud jata hai.', link: ['Meri orders', '/my/orders'] },
      { title: 'Review dein', body: 'Order mukammal hone ya call ke baad provider ki profile par stars dein. Masla ho to "Shikayat" karein — admin check karta hai.' },
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
