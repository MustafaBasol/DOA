(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const translations = {
    tr: {
      'lang.label': 'Dil',
      'lang.aria': 'Dil seçimi',
      'header.toggle': 'Menüyü aç/kapat',
      'nav.services': 'Hizmetler',
      'nav.contact': 'İletişim',
      'header.cta': 'Ücretsiz Ön Analiz',
      'header.login': 'Panel Girişi',
      'header.contact': 'İletişim',
      'home.meta.title': 'Autoviseo | Dijital Otomasyon Ajansı',
      'home.meta.desc': 'Autoviseo, iş süreçlerinizi otomasyonla hızlandırır: entegrasyonlar, CRM akışları, raporlama ve AI destekli iş akışları.',
      'hero.eyebrow': 'Dijital Otomasyon Ajansı',
      'hero.title': 'İşini otomasyonla hızlandır.',
      'hero.desc': 'Autoviseo; entegrasyonlar, CRM akışları, raporlama ve AI destekli otomasyonlarla operasyonlarını sadeleştirir. Az eforla daha çok çıktı.',
      'hero.primary': 'Görüşme planla',
      'hero.secondary': 'Ne yapıyoruz?',
      'hero.login': 'Panel Girişi',
      'flow.tag': 'Örnek Otomasyon',
      'flow.duration': '3–7 gün',
      'flow.title': 'Lead → CRM → Teklif → Bildirim',
      'flow.subtitle': 'Teknik olmayan biri için bile anlaşılır bir akış.',
      'flow.steps.aria': 'Otomasyon adımları',
      'flow.step1.title': 'Form / Mail gelir',
      'flow.step1.desc': 'Web formu veya e-posta',
      'flow.step2.title': 'CRM kaydı açılır',
      'flow.step2.desc': 'Salesforce / HubSpot',
      'flow.step3.title': 'Otomatik teklif/yanıt',
      'flow.step3.desc': 'Şablon + AI destekli taslak',
      'flow.step4.title': 'Telegram bildirim',
      'flow.step4.desc': 'Ekip anında haberdar',
      'flow.step5.title': 'Haftalık rapor',
      'flow.step5.desc': 'Sheets / Airtable / DB',
      'flow.tools.label': 'Araçlar',
      'flow.tools.value': 'n8n · Webhooks · Sheets · Telegram',
      'flow.more': 'Diğer akışlar →',
      'services.eyebrow': 'Hizmetler',
      'services.title': 'Net, ölçülebilir otomasyonlar.',
      'services.card1.title': 'Entegrasyon & İş Akışı',
      'services.card1.desc': 'Sistemlerini birbirine bağlar, manuel işleri otomatikleştiririz.',
      'services.card1.item1': 'Webhook / API entegrasyonları',
      'services.card1.item2': 'Google Sheets / Airtable veri akışları',
      'services.card1.item3': 'Telegram / e-posta bildirimleri',
      'services.card2.title': 'CRM & RevOps',
      'services.card2.desc': 'Lead → fırsat → teklif → fatura akışlarını hızlandırırız.',
      'services.card2.item1': 'Salesforce akışları ve otomasyonlar',
      'services.card2.item2': 'Pipeline hijyeni, görev otomasyonu',
      'services.card2.item3': 'Raporlama ve dashboard',
      'services.card3.title': 'AI Destekli Otomasyon',
      'services.card3.desc': 'İçerik, sınıflandırma ve özetleme işlerini AI ile ölçekleriz.',
      'services.card3.item1': 'Otomatik e-posta/mesaj taslakları',
      'services.card3.item2': 'Ticket/lead sınıflandırma',
      'services.card3.item3': 'Bilgi tabanı / SOP üretimi',
      'services.card4.title': 'Sosyal Medya İçerik Otomasyonu',
      'services.card4.desc': 'Kampanya, ürün/hizmet ve duyuru içeriklerini tek akışta üretip yayın planına bağlarız.',
      'services.card4.item1': 'Haftalık/aylık içerik planı + otomatik taslak üretim',
      'services.card4.item2': 'Ürün/hizmet bilgisinden post/story metni, brief ve hashtag seti',
      'services.card4.item3': 'Onay akışı (WhatsApp/Telegram) + yayınlama hatırlatmaları',
      'services.card5.title': 'WhatsApp Chatbot',
      'services.card5.desc': 'Sık soruları yanıtlayan, talep toplayan ve doğru ekibe yönlendiren botu kurarız.',
      'services.card5.item1': 'SSS + fiyatlandırma + süreç bilgilendirme otomasyonu',
      'services.card5.item2': 'Form / teklif talebi → Sheets/CRM’e kayıt',
      'services.card5.item3': 'Canlı destek devri + etiketleme/segmentasyon',
      'services.card6.title': 'Sesli Asistan & Çağrı Otomasyonu',
      'services.card6.desc': 'Telefonla gelen talepleri karşılayan, özetleyen ve sisteme düşüren sesli asistan kurarız.',
      'services.card6.item1': 'Gelen çağrı → ihtiyaç alma → otomatik özet + kayıt',
      'services.card6.item2': 'Randevu/geri arama yönlendirme ve teyit mesajı',
      'services.card6.item3': 'CRM/Sheets/Slack/Telegram entegrasyonu + takip görevi',
      'cta.eyebrow': 'İletişim',
      'cta.title': 'Ne otomatikleştirmek istiyorsun?',
      'cta.desc': '1–2 cümle yaz. Sana uygun bir yol haritasıyla geri döneyim.',
      'form.name.label': 'İsim',
      'form.name.placeholder': 'Mustafa',
      'form.email.label': 'E-posta',
      'form.email.placeholder': 'you@company.com',
      'form.message.label': 'Kısaca hedef',
      'form.message.placeholder': 'Örn: CRM → Telegram bildirimleri, teklif/fatura akışı...',
      'form.submit': 'Gönder',
      'form.hint.email.prefix': 'İstersen doğrudan:',
      'form.hint.privacy.prefix': 'Göndererek',
      'form.hint.privacy.link': 'Gizlilik Politikası',
      'form.hint.privacy.suffix': '\'nı kabul etmiş olursun.',
      'badge.pill': 'Hızlı Başlangıç',
      'badge.days': '7 gün',
      'badge.promise': 'İlk çalışan otomasyonu canlıya alırız.',
      'badge.steps.aria': 'Hızlı başlangıç adımları',
      'badge.steps': 'Keşif → Akış Tasarımı → Canlıya Alma',
      'badge.chips.aria': 'Hızlı başlangıç detayları',
      'badge.chip1': '1–2 görüşme',
      'badge.chip2': 'Net kapsam',
      'badge.chip3': 'Demo + dokümantasyon',
      'badge.cta': 'Formu doldur, 24 saat içinde yol haritasıyla döneyim.',
      'footer.tagline': 'Otomasyon. Entegrasyon. Operasyonel sadeleşme.',
      'footer.privacy': 'Gizlilik Politikası',
      'footer.cookies': 'Çerez Politikası',
      'footer.legal': 'Yasal Bilgiler',
      'footer.terms': 'Hizmet Şartları',
      'footer.dataDeletion': 'Veri Silme',
      'cookie.aria': 'Çerez bildirimi',
      'cookie.title': 'Çerez tercihleri',
      'cookie.desc': 'Zorunlu çerezler dışında analiz amaçlı çerezleri yalnızca onay verildiğinde kullanırız. Detaylar için',
      'cookie.link': 'Çerez Politikası',
      'cookie.after': '\'na göz atabilirsin.',
      'cookie.reject': 'Reddet',
      'cookie.accept': 'Kabul et',
      'form.sending': 'Gönderiliyor...',
      'form.sent': 'Gönderildi',
      'form.retry': 'Tekrar dene',
      'form.toast.success': 'Mesajınız başarıyla gönderildi!',
      'form.toast.error': 'Gönderim sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      'privacy.meta.title': 'Gizlilik Politikası | Autoviseo',
      'privacy.meta.desc': 'Autoviseo gizlilik politikası ve kişisel veri işleme bilgileri.',
      'privacy.eyebrow': 'Gizlilik',
      'privacy.title': 'Gizlilik Politikası',
      'privacy.p1': 'Autoviseo olarak kişisel verilerinizi yalnızca size geri dönüş yapmak ve hizmet talebinizi değerlendirmek amacıyla işleriz. İsim, e-posta ve otomasyon ihtiyacı bilgilerini iletişim formu üzerinden toplarız.',
      'privacy.li1': 'İşlenen veriler: isim, e-posta, mesaj/otomasyon ihtiyacı, sayfa adresi ve zaman damgası.',
      'privacy.li2': 'Hukuki dayanak: açık rıza ve talep üzerine sözleşme öncesi adımlar.',
      'privacy.li3': 'Saklama süresi: talebiniz sonuçlanana kadar ve yasal yükümlülükler kapsamında.',
      'privacy.li4': 'Paylaşım: yalnızca zorunlu hizmet sağlayıcılar (ör. n8n webhook altyapısı).',
      'privacy.li5': 'Haklarınız: erişim, düzeltme, silme, itiraz ve veri taşınabilirliği.',
      'privacy.p2': 'Herhangi bir talep için',
      'privacy.p2.after': ' adresine yazabilirsiniz.',
      'cookies.meta.title': 'Çerez Politikası | Autoviseo',
      'cookies.meta.desc': 'Autoviseo çerez politikası ve tercih yönetimi.',
      'cookies.eyebrow': 'Çerezler',
      'cookies.title': 'Çerez Politikası',
      'cookies.p1': 'Zorunlu çerezler sitenin temel işlevleri için kullanılır. Analiz çerezleri ise yalnızca açık rızanız olduğunda etkinleştirilir.',
      'cookies.li1': 'Zorunlu çerezler: güvenlik ve temel site işlevleri için.',
      'cookies.li2': 'Analiz çerezleri: ziyaretçi trafiğini anlamak için (GA4).',
      'cookies.li3': 'Tercihler: çerez bildirimi üzerinden güncellenebilir.',
      'cookies.p2': 'Rızanızı değiştirmek için sayfanın altındaki çerez bildirimini tekrar görüntüleyebilirsiniz.',
      'legal.meta.title': 'Yasal Bilgiler | Autoviseo',
      'legal.meta.desc': 'Autoviseo yasal bilgiler ve yayıncı/hosting detayları.',
      'legal.eyebrow': 'Yasal',
      'legal.title': 'Yasal Bilgiler',
      'legal.p1': 'Bu sayfa Fransa\'da “Mentions légales” kapsamındaki temel bilgileri sunar.',
      'legal.li1': 'Yayıncı: Mustafa Basol - Peaknova.',
      'legal.li2': 'Adres: Albertville, Fransa.',
      'legal.li3.prefix': 'İletişim:',
      'legal.li4': 'Hosting sağlayıcısı: Hostinger.',
      'terms.meta.title': 'Hizmet Şartları | Autoviseo',
      'terms.meta.desc': 'Autoviseo hizmet şartları ve kullanım koşulları.',
      'terms.eyebrow': 'Hizmet Şartları',
      'terms.title': 'Hizmet Şartları',
      'terms.intro': 'Bu Hizmet Şartları, Autoviseo tarafından sağlanan otomasyon, chatbot ve iletişim sistemleri hizmetlerinin kullanımına ilişkin koşulları açıklar. Bu web sitesini ve sunduğumuz servisleri kullanarak aşağıdaki şartları kabul etmiş olursunuz.',
      'terms.section1.title': '1. Hizmetin Kapsamı',
      'terms.section1.content': 'Autoviseo, işletmeler için iletişim akışlarını otomatikleştiren yazılım çözümleri sunar. Instagram, WhatsApp veya diğer platformlar üzerinden alınan mesajlar yalnızca otomatik yanıt üretmek, talepleri sınıflandırmak ve kullanıcıya dönüş sağlamak için işlenir.',
      'terms.section2.title': '2. Kullanıcı Yükümlülükleri',
      'terms.section2.content': 'Kullanıcı, hizmetleri yalnızca yasal amaçlar doğrultusunda kullanacağını kabul eder. Platformlar üzerinden alınan mesajların içeriğinden kullanıcı sorumludur.',
      'terms.section3.title': '3. Veri İşleme',
      'terms.section3.content': 'Kişisel veriler, yalnızca hizmetin sunulabilmesi amacıyla ve Gizlilik Politikası\'nda açıklandığı şekilde işlenir.',
      'terms.section4.title': '4. Üçüncü Taraf Servisleri',
      'terms.section4.content': 'Autoviseo, hizmetlerini sağlamak için n8n gibi üçüncü taraf otomasyon altyapıları kullanabilir. Bu servislerin sağladığı güvenlik ve gizlilik standartları çerçevesinde hareket edilir.',
      'terms.section5.title': '5. Sorumluluğun Sınırlandırılması',
      'terms.section5.content': 'Autoviseo, hizmetlerin kesintisiz çalışacağını garanti etmez ve üçüncü taraf platformlardaki değişikliklerden veya erişim sorunlarından sorumlu tutulamaz.',
      'terms.section6.title': '6. Değişiklikler',
      'terms.section6.content': 'Bu şartlar gerektiğinde güncellenebilir. Güncellemeler web sitesinde yayımlandığı anda geçerlidir.',
      'terms.contact.prefix': 'Her türlü soru için:',
      'dataDeletion.meta.title': 'Veri Silme Talimatları | Autoviseo',
      'dataDeletion.meta.desc': 'Autoviseo veri silme talep süreci ve talimatları.',
      'dataDeletion.eyebrow': 'Veri Silme',
      'dataDeletion.title': 'Veri Silme Talimatları',
      'dataDeletion.intro': 'Autoviseo tarafından işletmeler için sağlanan otomasyon çözümleri kapsamında, Instagram veya WhatsApp gibi platformlardan alınan mesajlar yalnızca otomatik yanıt oluşturma ve iş sürecini destekleme amacıyla geçici olarak işlenir.',
      'dataDeletion.howTo': 'Kullanıcı verilerinizin silinmesini talep etmek için aşağıdaki adımları izleyebilirsiniz:',
      'dataDeletion.step1.title': '1. Silme Talebi Gönderin',
      'dataDeletion.step1.p1': 'Veri silme talebinizi info@autoviseo.com adresine e-posta ile iletebilirsiniz.',
      'dataDeletion.step1.p2': 'E-postada aşağıdaki bilgilerin bulunması yeterlidir:',
      'dataDeletion.step1.item1': 'Adınız',
      'dataDeletion.step1.item2': 'İlgili hesapla ilişkili Instagram veya WhatsApp kullanıcı adınız',
      'dataDeletion.step1.item3': 'Silme talebinizin nedeni (isteğe bağlı)',
      'dataDeletion.step2.title': '2. İşleme Süresi',
      'dataDeletion.step2.content': 'Talebiniz alındıktan sonra verileriniz en geç 72 saat içerisinde sistemlerimizden silinir. Silme işlemi tamamlandığında tarafınıza onay e-postası gönderilir.',
      'dataDeletion.step3.title': '3. Hangi Veriler Silinir?',
      'dataDeletion.step3.item1': 'Instagram DM mesaj içerikleri',
      'dataDeletion.step3.item2': 'WhatsApp mesaj içerikleri',
      'dataDeletion.step3.item3': 'Talep formu üzerinden ilettiğiniz bilgiler',
      'dataDeletion.step3.item4': 'Otomasyon süreçlerine dahil edilen tüm metin kayıtları',
      'dataDeletion.step4.title': '4. Yasal Yükümlülükler',
      'dataDeletion.step4.content': 'Zorunlu saklama yükümlülükleri bulunmadığı sürece tüm kullanıcı verileri talep üzerine tamamen silinir.',
      'dataDeletion.contact': 'Her türlü veri işleme veya silme talebiniz için:'
    },
    en: {
      'lang.label': 'Language',
      'lang.aria': 'Language selection',
      'header.toggle': 'Toggle menu',
      'nav.services': 'Services',
      'nav.contact': 'Contact',
      'header.cta': 'Free Audit',
      'header.login': 'Panel Login',
      'header.contact': 'Contact',
      'home.meta.title': 'Autoviseo | Digital Automation Agency',
      'home.meta.desc': 'Autoviseo accelerates your operations with integrations, CRM flows, reporting, and AI-powered automations.',
      'hero.eyebrow': 'Digital Automation Agency',
      'hero.title': 'Accelerate your work with automation.',
      'hero.desc': 'Autoviseo accelerates your operations with integrations, CRM flows, reporting, and AI-powered automations. More output with less effort.',
      'hero.primary': 'Schedule a call',
      'hero.secondary': 'What do we do?',
      'hero.login': 'Panel Login',
      'flow.tag': 'Sample Automation',
      'flow.duration': '3–7 days',
      'flow.title': 'Lead → CRM → Proposal → Notification',
      'flow.subtitle': 'A flow clear even for non-technical teams.',
      'flow.steps.aria': 'Automation steps',
      'flow.step1.title': 'Form / Email arrives',
      'flow.step1.desc': 'Web form or email',
      'flow.step2.title': 'CRM record created',
      'flow.step2.desc': 'Salesforce / HubSpot',
      'flow.step3.title': 'Automated proposal/response',
      'flow.step3.desc': 'Template + AI-assisted draft',
      'flow.step4.title': 'Telegram notification',
      'flow.step4.desc': 'Team is notified instantly',
      'flow.step5.title': 'Weekly report',
      'flow.step5.desc': 'Sheets / Airtable / DB',
      'flow.tools.label': 'Tools',
      'flow.tools.value': 'n8n · Webhooks · Sheets · Telegram',
      'flow.more': 'Other flows →',
      'services.eyebrow': 'Services',
      'services.title': 'Clear, measurable automations.',
      'services.card1.title': 'Integration & Workflow',
      'services.card1.desc': 'We connect your systems and automate manual work.',
      'services.card1.item1': 'Webhook / API integrations',
      'services.card1.item2': 'Google Sheets / Airtable data flows',
      'services.card1.item3': 'Telegram / email notifications',
      'services.card2.title': 'CRM & RevOps',
      'services.card2.desc': 'We accelerate lead → opportunity → proposal → invoice flows.',
      'services.card2.item1': 'Salesforce flows and automations',
      'services.card2.item2': 'Pipeline hygiene, task automation',
      'services.card2.item3': 'Reporting and dashboards',
      'services.card3.title': 'AI-Powered Automation',
      'services.card3.desc': 'We scale content, classification, and summarization with AI.',
      'services.card3.item1': 'Automated email/message drafts',
      'services.card3.item2': 'Ticket/lead classification',
      'services.card3.item3': 'Knowledge base / SOP generation',
      'services.card4.title': 'Social Media Content Automation',
      'services.card4.desc': 'We produce campaign, product/service, and announcement content in one flow and connect it to the publishing plan.',
      'services.card4.item1': 'Weekly/monthly content plan + automated draft generation',
      'services.card4.item2': 'Post/story copy, brief, and hashtag set from product/service info',
      'services.card4.item3': 'Approval flow (WhatsApp/Telegram) + publishing reminders',
      'services.card5.title': 'WhatsApp Chatbot',
      'services.card5.desc': 'We build a bot that answers FAQs, collects requests, and routes them to the right team.',
      'services.card5.item1': 'FAQ + pricing + process info automation',
      'services.card5.item2': 'Form / proposal request → record in Sheets/CRM',
      'services.card5.item3': 'Live support handoff + tagging/segmentation',
      'services.card6.title': 'Voice Assistant & Call Automation',
      'services.card6.desc': 'We build a voice assistant that handles inbound calls, summarizes, and logs them into your system.',
      'services.card6.item1': 'Inbound call → needs intake → automatic summary + record',
      'services.card6.item2': 'Appointment/callback routing and confirmation message',
      'services.card6.item3': 'CRM/Sheets/Slack/Telegram integration + follow-up task',
      'cta.eyebrow': 'Contact',
      'cta.title': 'What do you want to automate?',
      'cta.desc': 'Write 1–2 sentences. I’ll get back with a tailored roadmap.',
      'form.name.label': 'Name',
      'form.name.placeholder': 'Alex',
      'form.email.label': 'Email',
      'form.email.placeholder': 'you@company.com',
      'form.message.label': 'Goal in brief',
      'form.message.placeholder': 'e.g. CRM → Telegram notifications, proposal/invoice flow...',
      'form.submit': 'Send',
      'form.hint.email.prefix': 'Or email us directly:',
      'form.hint.privacy.prefix': 'By sending, you accept the',
      'form.hint.privacy.link': 'Privacy Policy',
      'form.hint.privacy.suffix': '.',
      'badge.pill': 'Quick Start',
      'badge.days': '7 days',
      'badge.promise': 'We launch your first working automation live.',
      'badge.steps.aria': 'Quick start steps',
      'badge.steps': 'Discovery → Flow Design → Go Live',
      'badge.chips.aria': 'Quick start details',
      'badge.chip1': '1–2 meetings',
      'badge.chip2': 'Clear scope',
      'badge.chip3': 'Demo + documentation',
      'badge.cta': 'Fill out the form and I’ll reply within 24 hours with a roadmap.',
      'footer.tagline': 'Automation. Integration. Operational clarity.',
      'footer.privacy': 'Privacy Policy',
      'footer.cookies': 'Cookie Policy',
      'footer.legal': 'Legal Notice',
      'footer.terms': 'Terms of Service',
      'footer.dataDeletion': 'Data Deletion',
      'cookie.aria': 'Cookie notice',
      'cookie.title': 'Cookie preferences',
      'cookie.desc': 'We use analytics cookies only with your consent, aside from essential cookies. See the',
      'cookie.link': 'Cookie Policy',
      'cookie.after': ' for details.',
      'cookie.reject': 'Reject',
      'cookie.accept': 'Accept',
      'form.sending': 'Sending...',
      'form.sent': 'Sent',
      'form.retry': 'Try again',
      'form.toast.success': 'Your message has been sent!',
      'form.toast.error': 'Something went wrong while sending. Please try again.',
      'privacy.meta.title': 'Privacy Policy | Autoviseo',
      'privacy.meta.desc': 'Autoviseo privacy policy and personal data processing details.',
      'privacy.eyebrow': 'Privacy',
      'privacy.title': 'Privacy Policy',
      'privacy.p1': 'At Autoviseo, we process your personal data only to get back to you and evaluate your service request. We collect name, email, and automation needs through the contact form.',
      'privacy.li1': 'Processed data: name, email, message/automation need, page URL, and timestamp.',
      'privacy.li2': 'Legal basis: explicit consent and pre-contractual steps upon request.',
      'privacy.li3': 'Retention period: until your request is resolved and as required by legal obligations.',
      'privacy.li4': 'Sharing: only with required service providers (e.g., n8n webhook infrastructure).',
      'privacy.li5': 'Your rights: access, rectification, deletion, objection, and data portability.',
      'privacy.p2': 'For any request, you can write to',
      'privacy.p2.after': '.',
      'cookies.meta.title': 'Cookie Policy | Autoviseo',
      'cookies.meta.desc': 'Autoviseo cookie policy and preference management.',
      'cookies.eyebrow': 'Cookies',
      'cookies.title': 'Cookie Policy',
      'cookies.p1': 'Essential cookies are used for core site functions. Analytics cookies are enabled only with your explicit consent.',
      'cookies.li1': 'Essential cookies: for security and core site functionality.',
      'cookies.li2': 'Analytics cookies: to understand visitor traffic (GA4).',
      'cookies.li3': 'Preferences: can be updated via the cookie banner.',
      'cookies.p2': 'To change your consent, you can reopen the cookie banner at the bottom of the page.',
      'legal.meta.title': 'Legal Notice | Autoviseo',
      'legal.meta.desc': 'Autoviseo legal notice and publisher/hosting details.',
      'legal.eyebrow': 'Legal',
      'legal.title': 'Legal Notice',
      'legal.p1': 'This page provides the basic information required for “Mentions légales” in France.',
      'legal.li1': 'Publisher: Mustafa Basol - Peaknova.',
      'legal.li2': 'Address: Albertville, France.',
      'legal.li3.prefix': 'Contact:',
      'legal.li4': 'Hosting provider: Hostinger.',
      'terms.meta.title': 'Terms of Service | Autoviseo',
      'terms.meta.desc': 'Autoviseo terms of service and conditions of use.',
      'terms.eyebrow': 'Terms of Service',
      'terms.title': 'Terms of Service',
      'terms.intro': 'These Terms of Service describe the conditions for using the automation, chatbot, and communication system services provided by Autoviseo. By using this website and the services we offer, you agree to the following terms.',
      'terms.section1.title': '1. Scope of Service',
      'terms.section1.content': 'Autoviseo provides software solutions that automate communication flows for businesses. Messages received via Instagram, WhatsApp, or other platforms are processed solely to generate automated responses, classify requests, and provide feedback to users.',
      'terms.section2.title': '2. User Obligations',
      'terms.section2.content': 'The user agrees to use the services only for lawful purposes. The user is responsible for the content of messages received via the platforms.',
      'terms.section3.title': '3. Data Processing',
      'terms.section3.content': 'Personal data is processed solely for the purpose of providing the service and as described in the Privacy Policy.',
      'terms.section4.title': '4. Third-Party Services',
      'terms.section4.content': 'Autoviseo may use third-party automation infrastructures such as n8n to provide its services. We operate within the security and privacy standards provided by these services.',
      'terms.section5.title': '5. Limitation of Liability',
      'terms.section5.content': 'Autoviseo does not guarantee uninterrupted service and cannot be held responsible for changes or access issues on third-party platforms.',
      'terms.section6.title': '6. Changes',
      'terms.section6.content': 'These terms may be updated as necessary. Updates are effective as soon as they are published on the website.',
      'terms.contact.prefix': 'For any questions:',
      'dataDeletion.meta.title': 'Data Deletion Instructions | Autoviseo',
      'dataDeletion.meta.desc': 'Autoviseo data deletion request process and instructions.',
      'dataDeletion.eyebrow': 'Data Deletion',
      'dataDeletion.title': 'Data Deletion Instructions',
      'dataDeletion.intro': 'As part of the automation solutions provided by Autoviseo for businesses, messages received from platforms such as Instagram or WhatsApp are processed temporarily solely for the purpose of generating automated responses and supporting business processes.',
      'dataDeletion.howTo': 'To request the deletion of your user data, you can follow these steps:',
      'dataDeletion.step1.title': '1. Submit a Deletion Request',
      'dataDeletion.step1.p1': 'You can submit your data deletion request via email to info@autoviseo.com.',
      'dataDeletion.step1.p2': 'The following information is sufficient in the email:',
      'dataDeletion.step1.item1': 'Your name',
      'dataDeletion.step1.item2': 'Your Instagram or WhatsApp username associated with the relevant account',
      'dataDeletion.step1.item3': 'Reason for your deletion request (optional)',
      'dataDeletion.step2.title': '2. Processing Time',
      'dataDeletion.step2.content': 'After your request is received, your data will be deleted from our systems within 72 hours at the latest. A confirmation email will be sent to you once the deletion is completed.',
      'dataDeletion.step3.title': '3. What Data is Deleted?',
      'dataDeletion.step3.item1': 'Instagram DM message contents',
      'dataDeletion.step3.item2': 'WhatsApp message contents',
      'dataDeletion.step3.item3': 'Information you submitted via the request form',
      'dataDeletion.step3.item4': 'All text records included in automation processes',
      'dataDeletion.step4.title': '4. Legal Obligations',
      'dataDeletion.step4.content': 'All user data is completely deleted upon request, unless there are mandatory retention obligations.',
      'dataDeletion.contact': 'For any data processing or deletion requests:'
    },
    fr: {
      'lang.label': 'Langue',
      'lang.aria': 'Sélection de langue',
      'header.toggle': 'Ouvrir/fermer le menu',
      'nav.services': 'Services',
      'nav.contact': 'Contact',
      'header.cta': 'Audit gratuit',
      'header.login': 'Connexion Panneau',
      'header.contact': 'Contact',
      'home.meta.title': 'Autoviseo | Agence d\'automatisation digitale',
      'home.meta.desc': 'Autoviseo accélère vos opérations grâce aux intégrations, aux flux CRM, au reporting et aux automatisations assistées par l\'IA.',
      'hero.eyebrow': 'Agence d\'automatisation digitale',
      'hero.title': 'Accélérez votre activité avec l\'automatisation.',
      'hero.desc': 'Autoviseo accélère vos opérations grâce aux intégrations, aux flux CRM, au reporting et aux automatisations assistées par l\'IA. Plus de résultats avec moins d\'effort.',
      'hero.primary': 'Planifier un échange',
      'hero.secondary': 'Que faisons-nous ?',
      'hero.login': 'Connexion Panneau',
      'flow.tag': 'Exemple d’automatisation',
      'flow.duration': '3–7 jours',
      'flow.title': 'Lead → CRM → Proposition → Notification',
      'flow.subtitle': 'Un flux compréhensible même pour les équipes non techniques.',
      'flow.steps.aria': 'Étapes d’automatisation',
      'flow.step1.title': 'Formulaire / Email reçu',
      'flow.step1.desc': 'Formulaire web ou email',
      'flow.step2.title': 'Création d’une fiche CRM',
      'flow.step2.desc': 'Salesforce / HubSpot',
      'flow.step3.title': 'Proposition/réponse automatisée',
      'flow.step3.desc': 'Modèle + brouillon assisté par IA',
      'flow.step4.title': 'Notification Telegram',
      'flow.step4.desc': 'L’équipe est informée instantanément',
      'flow.step5.title': 'Rapport hebdomadaire',
      'flow.step5.desc': 'Sheets / Airtable / DB',
      'flow.tools.label': 'Outils',
      'flow.tools.value': 'n8n · Webhooks · Sheets · Telegram',
      'flow.more': 'Autres flux →',
      'services.eyebrow': 'Services',
      'services.title': 'Des automatisations claires et mesurables.',
      'services.card1.title': 'Intégration & flux de travail',
      'services.card1.desc': 'Nous connectons vos systèmes et automatisons le travail manuel.',
      'services.card1.item1': 'Intégrations webhook / API',
      'services.card1.item2': 'Flux de données Google Sheets / Airtable',
      'services.card1.item3': 'Notifications Telegram / email',
      'services.card2.title': 'CRM & RevOps',
      'services.card2.desc': 'Nous accélérons les flux lead → opportunité → proposition → facture.',
      'services.card2.item1': 'Flux et automatisations Salesforce',
      'services.card2.item2': 'Hygiène du pipeline, automatisation des tâches',
      'services.card2.item3': 'Reporting et tableaux de bord',
      'services.card3.title': 'Automatisation assistée par IA',
      'services.card3.desc': 'Nous mettons à l’échelle la création de contenu, la classification et la synthèse avec l’IA.',
      'services.card3.item1': 'Brouillons d’e-mails/messages automatisés',
      'services.card3.item2': 'Classification des tickets/leads',
      'services.card3.item3': 'Base de connaissances / génération de SOP',
      'services.card4.title': 'Automatisation de contenu social',
      'services.card4.desc': 'Nous produisons les contenus de campagne, produit/service et annonce dans un seul flux, relié au planning de publication.',
      'services.card4.item1': 'Plan de contenu hebdo/mensuel + génération automatique de brouillons',
      'services.card4.item2': 'Texte de post/story, brief et hashtags à partir des infos produit/service',
      'services.card4.item3': 'Flux de validation (WhatsApp/Telegram) + rappels de publication',
      'services.card5.title': 'Chatbot WhatsApp',
      'services.card5.desc': 'Nous mettons en place un bot qui répond aux FAQ, collecte les demandes et les dirige vers la bonne équipe.',
      'services.card5.item1': 'Automatisation FAQ + tarifs + infos de processus',
      'services.card5.item2': 'Formulaire / demande de devis → enregistrement dans Sheets/CRM',
      'services.card5.item3': 'Transfert vers support humain + marquage/segmentation',
      'services.card6.title': 'Assistant vocal & automatisation des appels',
      'services.card6.desc': 'Nous mettons en place un assistant vocal qui répond aux appels entrants, résume et enregistre dans votre système.',
      'services.card6.item1': 'Appel entrant → recueil des besoins → résumé automatique + enregistrement',
      'services.card6.item2': 'Orientation prise de rendez-vous/rappel et message de confirmation',
      'services.card6.item3': 'Intégration CRM/Sheets/Slack/Telegram + tâche de suivi',
      'cta.eyebrow': 'Contact',
      'cta.title': 'Que souhaitez-vous automatiser ?',
      'cta.desc': 'Écrivez 1–2 phrases. Je reviens avec une feuille de route adaptée.',
      'form.name.label': 'Nom',
      'form.name.placeholder': 'Camille',
      'form.email.label': 'Email',
      'form.email.placeholder': 'you@company.com',
      'form.message.label': 'Objectif en bref',
      'form.message.placeholder': 'Ex : CRM → notifications Telegram, flux devis/facture…',
      'form.submit': 'Envoyer',
      'form.hint.email.prefix': 'Ou écrivez-nous directement :',
      'form.hint.privacy.prefix': 'En envoyant, vous acceptez la',
      'form.hint.privacy.link': 'Politique de confidentialité',
      'form.hint.privacy.suffix': '.',
      'badge.pill': 'Démarrage rapide',
      'badge.days': '7 jours',
      'badge.promise': 'Nous mettons en ligne votre première automatisation opérationnelle.',
      'badge.steps.aria': 'Étapes du démarrage rapide',
      'badge.steps': 'Découverte → Conception du flux → Mise en ligne',
      'badge.chips.aria': 'Détails du démarrage rapide',
      'badge.chip1': '1–2 rendez-vous',
      'badge.chip2': 'Périmètre clair',
      'badge.chip3': 'Démo + documentation',
      'badge.cta': 'Remplissez le formulaire et je reviens sous 24 h avec une feuille de route.',
      'footer.tagline': 'Automatisation. Intégration. Clarté opérationnelle.',
      'footer.privacy': 'Politique de confidentialité',
      'footer.cookies': 'Politique de cookies',
      'footer.legal': 'Mentions légales',
      'footer.terms': 'Conditions d\'utilisation',
      'footer.dataDeletion': 'Suppression de données',
      'cookie.aria': 'Avis de cookies',
      'cookie.title': 'Préférences de cookies',
      'cookie.desc': 'Nous n’utilisons les cookies d’analyse qu’avec votre consentement, en dehors des cookies essentiels. Consultez la',
      'cookie.link': 'Politique de cookies',
      'cookie.after': ' pour plus de détails.',
      'cookie.reject': 'Refuser',
      'cookie.accept': 'Accepter',
      'form.sending': 'Envoi...',
      'form.sent': 'Envoyé',
      'form.retry': 'Réessayer',
      'form.toast.success': 'Votre message a bien été envoyé !',
      'form.toast.error': 'Une erreur est survenue lors de l’envoi. Veuillez réessayer.',
      'privacy.meta.title': 'Politique de confidentialité | Autoviseo',
      'privacy.meta.desc': 'Politique de confidentialité Autoviseo et informations sur le traitement des données.',
      'privacy.eyebrow': 'Confidentialité',
      'privacy.title': 'Politique de confidentialité',
      'privacy.p1': 'Chez Autoviseo, nous traitons vos données personnelles uniquement pour vous répondre et évaluer votre demande de service. Nous collectons le nom, l’e-mail et le besoin d’automatisation via le formulaire de contact.',
      'privacy.li1': 'Données traitées : nom, e-mail, message/besoin d’automatisation, URL de la page et horodatage.',
      'privacy.li2': 'Base légale : consentement explicite et étapes précontractuelles sur demande.',
      'privacy.li3': 'Durée de conservation : jusqu’à la résolution de votre demande et selon les obligations légales.',
      'privacy.li4': 'Partage : uniquement avec les prestataires nécessaires (ex. infrastructure webhook n8n).',
      'privacy.li5': 'Vos droits : accès, rectification, suppression, opposition et portabilité des données.',
      'privacy.p2': 'Pour toute demande, vous pouvez écrire à',
      'privacy.p2.after': '.',
      'cookies.meta.title': 'Politique de cookies | Autoviseo',
      'cookies.meta.desc': 'Politique de cookies Autoviseo et gestion des préférences.',
      'cookies.eyebrow': 'Cookies',
      'cookies.title': 'Politique de cookies',
      'cookies.p1': 'Les cookies essentiels sont utilisés pour les fonctions de base du site. Les cookies d’analyse ne sont activés qu’avec votre consentement explicite.',
      'cookies.li1': 'Cookies essentiels : pour la sécurité et les fonctions de base du site.',
      'cookies.li2': 'Cookies d’analyse : pour comprendre le trafic des visiteurs (GA4).',
      'cookies.li3': 'Préférences : peuvent être mises à jour via le bandeau de cookies.',
      'cookies.p2': 'Pour modifier votre consentement, vous pouvez réafficher le bandeau de cookies en bas de la page.',
      'legal.meta.title': 'Mentions légales | Autoviseo',
      'legal.meta.desc': 'Mentions légales Autoviseo et informations éditeur/hébergeur.',
      'legal.eyebrow': 'Mentions légales',
      'legal.title': 'Mentions légales',
      'legal.p1': 'Cette page présente les informations de base requises pour les “Mentions légales” en France.',
      'legal.li1': 'Éditeur : Mustafa Basol - Peaknova.',
      'legal.li2': 'Adresse : Albertville, France.',
      'legal.li3.prefix': 'Contact :',
      'legal.li4': 'Hébergeur : Hostinger.',
      'terms.meta.title': 'Conditions d\'utilisation | Autoviseo',
      'terms.meta.desc': 'Conditions d\'utilisation Autoviseo et modalités de service.',
      'terms.eyebrow': 'Conditions d\'utilisation',
      'terms.title': 'Conditions d\'utilisation',
      'terms.intro': 'Ces Conditions d\'utilisation décrivent les modalités d\'utilisation des services d\'automatisation, de chatbot et de systèmes de communication fournis par Autoviseo. En utilisant ce site web et les services que nous proposons, vous acceptez les conditions suivantes.',
      'terms.section1.title': '1. Portée du service',
      'terms.section1.content': 'Autoviseo propose des solutions logicielles qui automatisent les flux de communication pour les entreprises. Les messages reçus via Instagram, WhatsApp ou d\'autres plateformes sont traités uniquement pour générer des réponses automatisées, classifier les demandes et fournir des retours aux utilisateurs.',
      'terms.section2.title': '2. Obligations de l\'utilisateur',
      'terms.section2.content': 'L\'utilisateur s\'engage à utiliser les services uniquement à des fins légales. L\'utilisateur est responsable du contenu des messages reçus via les plateformes.',
      'terms.section3.title': '3. Traitement des données',
      'terms.section3.content': 'Les données personnelles sont traitées uniquement dans le but de fournir le service et comme décrit dans la Politique de confidentialité.',
      'terms.section4.title': '4. Services tiers',
      'terms.section4.content': 'Autoviseo peut utiliser des infrastructures d\'automatisation tierces telles que n8n pour fournir ses services. Nous opérons dans le cadre des normes de sécurité et de confidentialité fournies par ces services.',
      'terms.section5.title': '5. Limitation de responsabilité',
      'terms.section5.content': 'Autoviseo ne garantit pas un service ininterrompu et ne peut être tenu responsable des modifications ou des problèmes d\'accès sur les plateformes tierces.',
      'terms.section6.title': '6. Modifications',
      'terms.section6.content': 'Ces conditions peuvent être mises à jour si nécessaire. Les mises à jour sont effectives dès leur publication sur le site web.',
      'terms.contact.prefix': 'Pour toute question :',
      'dataDeletion.meta.title': 'Instructions de suppression de données | Autoviseo',
      'dataDeletion.meta.desc': 'Processus et instructions de demande de suppression de données Autoviseo.',
      'dataDeletion.eyebrow': 'Suppression de données',
      'dataDeletion.title': 'Instructions de suppression de données',
      'dataDeletion.intro': 'Dans le cadre des solutions d\'automatisation fournies par Autoviseo pour les entreprises, les messages reçus de plateformes telles qu\'Instagram ou WhatsApp sont traités temporairement uniquement dans le but de générer des réponses automatisées et de soutenir les processus commerciaux.',
      'dataDeletion.howTo': 'Pour demander la suppression de vos données utilisateur, vous pouvez suivre ces étapes :',
      'dataDeletion.step1.title': '1. Soumettre une demande de suppression',
      'dataDeletion.step1.p1': 'Vous pouvez soumettre votre demande de suppression de données par email à info@autoviseo.com.',
      'dataDeletion.step1.p2': 'Les informations suivantes sont suffisantes dans l\'email :',
      'dataDeletion.step1.item1': 'Votre nom',
      'dataDeletion.step1.item2': 'Votre nom d\'utilisateur Instagram ou WhatsApp associé au compte concerné',
      'dataDeletion.step1.item3': 'Raison de votre demande de suppression (facultatif)',
      'dataDeletion.step2.title': '2. Délai de traitement',
      'dataDeletion.step2.content': 'Après réception de votre demande, vos données seront supprimées de nos systèmes dans un délai maximum de 72 heures. Un email de confirmation vous sera envoyé une fois la suppression terminée.',
      'dataDeletion.step3.title': '3. Quelles données sont supprimées ?',
      'dataDeletion.step3.item1': 'Contenus des messages Instagram DM',
      'dataDeletion.step3.item2': 'Contenus des messages WhatsApp',
      'dataDeletion.step3.item3': 'Informations soumises via le formulaire de demande',
      'dataDeletion.step3.item4': 'Tous les enregistrements textuels inclus dans les processus d\'automatisation',
      'dataDeletion.step4.title': '4. Obligations légales',
      'dataDeletion.step4.content': 'Toutes les données utilisateur sont complètement supprimées sur demande, sauf s\'il existe des obligations de conservation obligatoires.',
      'dataDeletion.contact': 'Pour toute demande de traitement ou de suppression de données :'
    }
  };

  let activeLang = 'tr';

  const getTranslation = (lang, key) => translations[lang]?.[key] ?? translations.tr[key];

  const applyTranslations = (lang) => {
    const dict = translations[lang] ?? translations.tr;
    qsa('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const value = dict[key];
      if (value === undefined) return;
      const attr = el.dataset.i18nAttr;
      const tagName = el.tagName;
      const isFormControl = ['INPUT', 'SELECT', 'TEXTAREA', 'OPTION'].includes(tagName);
      const attrOnly = Boolean(attr);
      if (!isFormControl && !attrOnly) {
        // Eğer element içinde SVG veya diğer child elementler varsa
        // sadece text node'ları değiştir
        const hasChildElements = el.children.length > 0;
        if (hasChildElements) {
          // Tüm child node'ları gez
          const childNodes = Array.from(el.childNodes);
          const textNodes = childNodes.filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          
          if (textNodes.length > 0) {
            // En son anlamlı text node'u güncelle
            const lastTextNode = textNodes[textNodes.length - 1];
            lastTextNode.textContent = ' ' + value; // Önüne space ekle (SVG'den sonra)
          } else {
            // Text node yoksa yeni bir tane ekle
            el.appendChild(document.createTextNode(' ' + value));
          }
        } else {
          // Child element yoksa direkt textContent kullan
          el.textContent = value;
        }
      }
    });

    qsa('[data-i18n-attr]').forEach((el) => {
      const key = el.dataset.i18n;
      const attr = el.dataset.i18nAttr;
      const value = dict[key];
      if (value !== undefined && attr) {
        el.setAttribute(attr, value);
      }
    });

    document.documentElement.lang = lang;
  };

  const setLanguage = (lang, persist = true) => {
    const next = translations[lang] ? lang : 'tr';
    activeLang = next;
    applyTranslations(next);
    const select = qs('#language-select');
    if (select) select.value = next;
    qsa('.language-switcher__btn').forEach((button) => {
      const isActive = button.dataset.lang === next;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    if (persist) {
      localStorage.setItem('siteLang', next);
    }
  };

  const setupLanguageSwitcher = () => {
    const stored = localStorage.getItem('siteLang');
    const initialLang = stored || document.documentElement.lang || 'tr';
    setLanguage(initialLang, false);

    const select = qs('#language-select');
    if (select) {
      select.addEventListener('change', (event) => {
        setLanguage(event.target.value);
      });
    }

    qsa('.language-switcher').forEach((switcher) => {
      switcher.addEventListener('click', (event) => {
        const button = event.target.closest('.language-switcher__btn');
        if (!button || !switcher.contains(button)) return;
        const lang = button.dataset.lang || button.getAttribute('data-lang');
        if (!lang) return;
        setLanguage(lang);
      });
    });
  };

  const setupYear = () => {
    const year = qs('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const setupHeader = () => {
    const toggle = qs('.site-header__toggle');
    const menu = qs('.site-header__links');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (evt) => {
      if (!menu.classList.contains('is-open')) return;
      if (evt.target.closest('.site-header')) return;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  };

  const setupRevealObserver = () => {
    const animated = qsa('[data-animate]');
    if (!animated.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    animated.forEach((el) => observer.observe(el));
  };

  const setupParallax = () => {
    const items = qsa('[data-parallax]');
    if (!items.length) return;

    const pointer = { x: 0, y: 0 };

    const update = () => {
      const scrollY = window.scrollY;
      const viewport = window.innerHeight;

      items.forEach((item, index) => {
        const depth = 0.10 + index * 0.04;
        const rect = item.getBoundingClientRect();
        const offsetY = (rect.top + scrollY - viewport / 2) * depth * -0.10;
        const offsetX = pointer.x * depth;
        item.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      });
    };

    window.addEventListener('scroll', () => requestAnimationFrame(update));
    document.addEventListener('pointermove', (evt) => {
      pointer.x = (evt.clientX / window.innerWidth - 0.5) * 24;
      pointer.y = (evt.clientY / window.innerHeight - 0.5) * 18;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  };

  const setupAnalyticsConsent = () => {
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;

    const acceptBtn = banner.querySelector('.cookie-banner__accept');
    const rejectBtn = banner.querySelector('.cookie-banner__reject');
    const stored = localStorage.getItem('cookieConsent');

    const loadAnalytics = () => {
      if (window.__gaLoaded) return;
      window.__gaLoaded = true;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-5D6FMVNHRD';
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(){ window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', 'G-5D6FMVNHRD');
    };

    const setConsent = (value) => {
      localStorage.setItem('cookieConsent', value);
      banner.classList.add('cookie-banner--hidden');
      if (value === 'accepted') loadAnalytics();
    };

    if (stored === 'accepted') {
      banner.classList.add('cookie-banner--hidden');
      loadAnalytics();
      return;
    }

    if (stored === 'rejected') {
      banner.classList.add('cookie-banner--hidden');
      return;
    }

    acceptBtn?.addEventListener('click', () => setConsent('accepted'));
    rejectBtn?.addEventListener('click', () => setConsent('rejected'));
  };

const setupForm = () => {
  const form = document.querySelector('.cta__form');
  if (!form) return;

  const button = form.querySelector('.button');
  const honeypot = form.querySelector('#website');

  const normalizeValue = (value, maxLength) => {
    if (!value) return '';
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  };

  const showToast = (msg, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (honeypot && honeypot.value.trim()) {
      form.reset();
      return;
    }

    const payload = {
      name: normalizeValue(form.querySelector('#name')?.value, 80),
      email: normalizeValue(form.querySelector('#email')?.value, 254),
      message: normalizeValue(form.querySelector('#message')?.value, 280),
      page: location.href,
      ts: new Date().toISOString()
    };

    try {
      button.disabled = true;
      button.textContent = getTranslation(activeLang, 'form.sending');

      const res = await fetch('https://n8n.srv1021253.hstgr.cloud/webhook/79572a93-08d4-4cbf-ae1d-bb58f9a8c393', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Webhook error');
      form.reset();
      showToast(getTranslation(activeLang, 'form.toast.success'), 'success');
      button.textContent = getTranslation(activeLang, 'form.sent');
      setTimeout(() => {
        button.disabled = false;
        button.textContent = getTranslation(activeLang, 'form.submit');
      }, 1500);

    } catch (e) {
      showToast(getTranslation(activeLang, 'form.toast.error'), 'error');
      button.disabled = false;
      button.textContent = getTranslation(activeLang, 'form.retry');
    }
  });
};


  setupLanguageSwitcher();
  setupYear();
  setupHeader();
  setupRevealObserver();
  setupParallax();
  setupAnalyticsConsent();
  setupForm();
})();
