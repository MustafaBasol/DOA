# DOA Kullanıcı Eğitimi ve Onboarding Rehberi

DOA WhatsApp Chatbot Yönetim Sistemi'ne hoş geldiniz! Bu dokuman yeni kullanıcıların sistemi hızlıca öğrenmesi ve etkili kullanması için hazırlanmıştır.

## 📚 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Admin Paneli Eğitimi](#admin-paneli-eğitimi)
3. [Client Paneli Eğitimi](#client-paneli-eğitimi)
4. [Sık Kullanılan Özellikler](#sık-kullanılan-özellikler)
5. [SSS (Sıkça Sorulan Sorular)](#sss-sıkça-sorulan-sorular)
6. [Video Eğitimler](#video-eğitimler)
7. [Destek ve İletişim](#destek-ve-iletişim)

---

## 🚀 Hızlı Başlangıç

### İlk Giriş

1. **Sisteme Giriş**
   - URL: `https://yourdomain.com/login.html`
   - Admin kullanıcısı tarafından size gönderilen email ve şifre ile giriş yapın

2. **İlk Şifre Değiştirme**
   - Güvenlik için ilk girişte şifrenizi değiştirin
   - Profil → Şifre Değiştir
   - Güçlü bir şifre seçin (min 8 karakter, büyük/küçük harf, rakam)

3. **Profil Bilgilerinizi Güncelleyin**
   - İsim, telefon, dil tercihini ayarlayın
   - Bildirim tercihlerini yapılandırın

### Rol ve Yetkiler

**DOA sisteminde 4 rol vardır:**

1. **SUPER_ADMIN** - Tam yetki
   - Tüm kullanıcı yönetimi
   - Sistem konfigürasyonu
   - Backup & restore
   - Yetki yönetimi

2. **ADMIN** - Yönetici
   - Kullanıcı yönetimi (CLIENT)
   - Ödeme yönetimi
   - Raporlar
   - İstatistikler

3. **MANAGER** - Operatör
   - Mesajları görüntüleme (tümü)
   - Raporlar
   - İstatistikler
   - Kullanıcı bilgilerini görüntüleme

4. **CLIENT** - Müşteri
   - Kendi mesajlarını görüntüleme
   - Kendi ödeme bilgilerini görüntüleme
   - Profil yönetimi

---

## 👨‍💼 Admin Paneli Eğitimi

### Dashboard Genel Bakış

#### Ana Ekran
- **KPI Kartları:** Toplam mesaj, kullanıcı, ödeme, gelir
- **Grafikler:** Mesaj trendleri, gelir analizi
- **Son Aktiviteler:** Yeni kayıtlar, ödemeler
- **Hızlı Aksiyonlar:** Sık kullanılan işlemler

#### Gezinme
```
Dashboard (Ana Sayfa)
├── Kullanıcılar (Users)
├── Mesajlar (Messages)
├── Ödemeler (Payments)
├── Abonelikler (Subscriptions)
├── Raporlar (Reports)
├── Analitik (Analytics)
├── Yetkiler (Permissions)
├── Denetim (Audit)
└── Ayarlar (Settings)
```

### 1. Kullanıcı Yönetimi

#### Yeni Müşteri Oluşturma

**Adım 1:** Kullanıcılar sayfasına gidin
- Menü → Kullanıcılar

**Adım 2:** "Yeni Kullanıcı" butonuna tıklayın

**Adım 3:** Bilgileri doldurun
```
Ad Soyad: Ahmet Yılmaz
Email: ahmet@example.com (unique olmalı)
Şifre: Otomatik oluştur (veya manuel gir)
Rol: CLIENT (müşteri için)
Telefon: +905551234567
Dil: Türkçe
Durum: Aktif
```

**Adım 4:** Kaydet
- Kullanıcıya email ile şifre gönderilir
- Kullanıcı bilgileri dashboard'a eklenir

#### Kullanıcı Düzenleme

1. Kullanıcılar listesinde düzenle ikonuna tıklayın
2. Bilgileri güncelleyin
3. Kaydet

**Düzenlenebilir Alanlar:**
- Ad Soyad
- Telefon
- Rol (dikkatli değiştirin)
- Durum (Aktif/Pasif)
- Dil tercihi

#### Kullanıcı Silme (Soft Delete)

1. Kullanıcı satırında sil ikonuna tıklayın
2. Onay mesajını kabul edin
3. Kullanıcı "soft delete" edilir (veritabanında kalır, görünmez)

**⚠️ Dikkat:** Silinen kullanıcı giriş yapamaz ancak geçmiş kayıtları korunur.

#### Kullanıcı Arama ve Filtreleme

**Hızlı Arama:**
- Arama kutusuna isim, email veya telefon yazın
- Anlık sonuçlar gösterilir

**Gelişmiş Filtreleme:**
- Rol bazlı filtreleme (ADMIN, CLIENT, vb.)
- Durum bazlı (Aktif/Pasif)
- Tarih aralığı (kayıt tarihi)

### 2. Ödeme Yönetimi

#### Ödeme Ekleme

**Adım 1:** Ödemeler sayfasına gidin

**Adım 2:** "Yeni Ödeme" butonuna tıklayın

**Adım 3:** Bilgileri doldurun
```
Kullanıcı: Ahmet Yılmaz (dropdown'dan seç)
Tutar: 500.00 TL
Ödeme Yöntemi: Kredi Kartı / Havale / Nakit
Durum: Tamamlandı / Beklemede
Ödeme Tarihi: 22/01/2026
Açıklama: Ocak ayı abonelik ücreti
```

**Adım 4:** Kaydet
- Ödeme kayıtlara eklenir
- Kullanıcının ödemeler sayfasında görünür
- Gelir grafiklerine yansır

#### Ödeme Düzenleme

1. Ödeme satırında düzenle ikonuna tıklayın
2. Durum veya açıklama güncelleyin
3. Kaydet

#### Ödeme Raporları

**Günlük Rapor:**
- Tarih seçin
- Günlük gelir özeti

**Aylık Rapor:**
- Ay seçin
- Aylık gelir, ödeme yöntemi dağılımı

**Export:**
- CSV: Excel'de açılabilir
- PDF: Yazdırılabilir rapor
- Excel: Gelişmiş analiz için

### 3. Mesaj Yönetimi

#### Mesajları Görüntüleme

**Tüm Mesajlar:**
- Menü → Mesajlar
- Tüm kullanıcıların mesajları

**Filtreleme:**
- Kullanıcıya göre
- Tarih aralığına göre
- Okundu/okunmadı durumuna göre
- Mesaj tipine göre (text, image, video)

#### Konuşma Görünümü

**Gruplu Gösterim:**
- Müşteri telefon numarasına göre gruplar
- Her konuşmanın özeti
- Son mesaj zamanı
- Okunmamış mesaj sayısı

**Detay Görünümü:**
- Konuşmaya tıklayın
- Tam mesaj geçmişi
- Zaman damgaları
- Medya önizleme

### 4. Raporlama

#### Rapor Tipleri

**1. Mesaj Raporu**
- Tarih aralığı seçin
- Kullanıcı seçin (opsiyonel)
- Format seçin (PDF/Excel/CSV)
- İndir

**İçerik:**
- Toplam mesaj sayısı
- Günlük dağılım
- Kullanıcı bazlı breakdown
- Grafik gösterimi

**2. Ödeme Raporu**
- Tarih aralığı
- Ödeme durumu filtresi
- Format seçimi

**İçerik:**
- Toplam gelir
- Ödeme yöntemi dağılımı
- Kullanıcı bazlı ödemeler
- Ödeme trendleri

**3. Kullanıcı Raporu**
- Aktif/pasif kullanıcılar
- Yeni kayıtlar
- Kullanım istatistikleri

#### Zamanlanmış Raporlar

**Otomatik Email Raporları:**
1. Ayarlar → Raporlar
2. Rapor tipi seçin
3. Frekans seçin (günlük/haftalık/aylık)
4. Email adresleri ekleyin
5. Aktif et

**Örnek:**
- Her Pazartesi 09:00'da haftalık mesaj raporu
- Her ay 1. günü aylık gelir raporu

### 5. Analytics Dashboard

#### Genel Bakış

**Mesaj Analitiği:**
- Günlük/haftalık/aylık trend
- Karşılaştırmalı grafik (önceki dönem)
- Peak saatler

**Kullanıcı Analitiği:**
- Aktif kullanıcılar
- Yeni kayıtlar
- Churn rate

**Gelir Analitiği:**
- Günlük/aylık gelir
- Ödeme yöntemi dağılımı
- Revenue forecast

#### Filtreleme

**Tarih Aralığı:**
- Bugün
- Bu hafta
- Bu ay
- Özel aralık

**Karşılaştırma:**
- Önceki gün/hafta/ay ile karşılaştır
- Yüzde değişim
- Trend göstergesi

### 6. Yetki Yönetimi (SUPER_ADMIN)

#### Rol Görüntüleme

1. Menü → Yetkiler
2. Roller tabında tüm rolleri görün
3. Her rolün yetki sayısını görün

#### Yetki Matrisi

**Matrix Görünümü:**
- Resource (Kaynak): Users, Messages, Payments, vb.
- Action (Eylem): Create, Read, Update, Delete
- Her rol için yetki durumu (✓/✗)

**Örnek Matrix:**
```
                CREATE  READ    UPDATE  DELETE
Users (ADMIN)    ✓       ✓       ✓       ✓
Users (CLIENT)   ✗       ✗       ✗       ✗
Messages (ADMIN) ✗       ✓       ✗       ✗
Messages (CLIENT)✗       ✓       ✗       ✗
```

#### Yetki Düzenleme

**⚠️ Dikkat:** Sadece SUPER_ADMIN yetkilidir

1. Rol detayına gir
2. Yetkileri işaretle/kaldır
3. Kaydet

**Best Practice:**
- Minimum yetki prensibi
- Hassas işlemler için fazladan onay
- Düzenli yetki denetimi

### 7. Denetim Kayıtları (Audit Log)

#### Kayıtları Görüntüleme

**Filtreleme:**
- Kullanıcıya göre
- Kaynağa göre (users, payments, vb.)
- Eyleme göre (CREATE, UPDATE, DELETE)
- Tarih aralığı

**Detay Görünümü:**
- Kimin yaptığı
- Ne zaman
- Ne değiştirildi (JSON diff)
- Eski ve yeni değerler

**Örnek:**
```
Kullanıcı: admin@autoviseo.com
Kaynak: users
Eylem: UPDATE
Tarih: 22/01/2026 14:30:25
Değişiklikler:
  - role: "CLIENT" → "MANAGER"
  - status: "INACTIVE" → "ACTIVE"
```

#### Güvenlik Denetimi

**Şüpheli Aktivite Tespiti:**
- Çok sayıda başarısız login
- Yetkisiz erişim denemeleri
- Toplu silme işlemleri
- Hassas veri erişimi

---

## 🧑‍💻 Client Paneli Eğitimi

### Dashboard Genel Bakış

#### Ana Ekran
- **Mesaj Özeti:** Toplam, okunmamış, bugün
- **Ödeme Durumu:** Son ödeme, kalan gün
- **Hızlı Erişim:** Son mesajlar, profil

### 1. Mesajlarım

#### Mesajları Görüntüleme

**Liste Görünümü:**
- Tüm mesajlarınız tarih sırasıyla
- Her mesajın konuşma başlığı
- Son mesaj zamanı

**Konuşma Görünümü:**
- Müşteriye göre gruplu
- Kronolojik sıralama
- Okundu/okunmadı durumu

#### Arama

**Hızlı Arama:**
- Arama kutusuna müşteri adı veya mesaj içeriği yazın
- Anlık filtreleme

**Gelişmiş Arama:**
- Tarih aralığı
- Müşteri filtresi
- Mesaj tipi (text/media)

#### Mesaj Detayı

**Görüntüleme:**
- Konuşmaya tıklayın
- Tam mesaj geçmişi
- Medya dosyaları (resim, video, döküman)

**Okundu İşaretleme:**
- Otomatik: Mesajı açınca okundu olur
- Manuel: Okundu butonuna tıklayın

### 2. Ödemelerim

#### Ödeme Geçmişi

**Görüntüleme:**
- Menü → Ödemelerim
- Tüm ödemeleriniz listeyle

**Detaylar:**
```
Ödeme Tarihi: 22/01/2026
Tutar: 500.00 TL
Yöntem: Kredi Kartı
Durum: Tamamlandı
Açıklama: Ocak ayı abonelik
```

#### Fatura İndirme

1. Ödeme satırında "Fatura" butonuna tıklayın
2. PDF formatında indirilir
3. Yazdırabilir veya saklayabilirsiniz

**Fatura İçeriği:**
- Şirket bilgileri
- Müşteri bilgileri
- Ödeme detayları
- Toplam tutar
- KDV (varsa)

#### Ödeme Bildirimleri

**Email Bildirimleri:**
- Ödeme alındığında
- Ödeme hatırlatması (vadeden 3 gün önce)
- Fatura hazır

**Panel Bildirimleri:**
- Yeni ödeme kaydedildi
- Ödeme vadesi yaklaşıyor

### 3. Profilim

#### Profil Görüntüleme

**Bilgilerim:**
- Ad Soyad
- Email
- Telefon
- Rol
- Kayıt tarihi
- Son giriş

#### Profil Düzenleme

**Düzenlenebilir:**
- Ad Soyad
- Telefon
- Dil tercihi

**⚠️ Email değişikliği için admin onayı gerekir**

#### Şifre Değiştirme

**Adımlar:**
1. Profil → Şifre Değiştir
2. Eski şifrenizi girin
3. Yeni şifre girin (2 kez)
4. Kaydet

**Şifre Kuralları:**
- Minimum 8 karakter
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam
- Özel karakter önerilir

#### Dil Değiştirme

**Desteklenen Diller:**
- 🇹🇷 Türkçe
- 🇬🇧 English
- 🇫🇷 Français

**Değiştirme:**
1. Profil → Dil
2. Dil seçin
3. Kaydet
4. Sayfa otomatik yenilenir

### 4. Bildirimler

#### Bildirim Tipleri

**Email Bildirimleri:**
- Yeni mesaj
- Ödeme hatırlatması
- Sistem bildirimleri

**Push Bildirimleri:**
- Tarayıcı bildirimleri
- Mobil uygulama (gelecek)

**Panel Bildirimleri:**
- Sağ üst köşe zil ikonu
- Okunmamış sayısı

#### Bildirim Tercihleri

**Ayarlama:**
1. Profil → Bildirimler
2. İstediğiniz bildirimleri aktif/pasif edin
3. Kaydet

**Seçenekler:**
- [ ] Yeni mesaj geldiğinde email
- [ ] Günlük mesaj özeti email
- [ ] Ödeme hatırlatması
- [ ] Sistem güncellemeleri
- [ ] Push bildirimleri

---

## 💡 Sık Kullanılan Özellikler

### Hızlı Erişim Tuşları

| Tuş Kombinasyonu | Fonksiyon |
|------------------|-----------|
| `Ctrl + K` | Arama açma |
| `Ctrl + /` | Klavye kısayolları |
| `Ctrl + H` | Ana sayfaya dön |
| `Ctrl + M` | Mesajlar sayfası |
| `Ctrl + P` | Profil sayfası |
| `Esc` | Modal kapat |

### Toplu İşlemler (Admin)

#### Toplu Kullanıcı İşlemleri

**Seçim:**
1. Kullanıcılar sayfasında checkbox'ları işaretleyin
2. Toplu işlem menüsünü açın

**İşlemler:**
- Toplu aktif/pasif etme
- Toplu email gönderme
- Toplu export (CSV)

#### Toplu Mesaj İşaretleme

**Okundu İşaretleme:**
1. Mesajlar sayfasında filtreleme yapın
2. "Tümünü okundu işaretle" butonuna tıklayın
3. Toplu güncelleme yapılır

### Export ve Import

#### Veri Export

**Kullanıcı Export:**
- Format: CSV, Excel, PDF
- Filtrelenmiş veri export edilir
- Hassas veriler (şifre) export edilmez

**Mesaj Export:**
- Tarih aralığı seçin
- Format seçin
- İndir

#### Veri Import

**Toplu Kullanıcı Ekleme:**
1. Template dosyasını indir
2. Excel'de doldurun
3. Upload et
4. Önizle ve onayla
5. Import tamamlanır

**Template Format:**
```csv
name,email,phone,role,language
Ahmet Yılmaz,ahmet@example.com,+905551234567,CLIENT,tr
Mehmet Demir,mehmet@example.com,+905559876543,CLIENT,tr
```

### Gelişmiş Arama

#### Search Builder

**Adım 1:** Menü → Gelişmiş Arama

**Adım 2:** Entity seç (Messages, Users, Payments, vb.)

**Adım 3:** Filtreler ekle
- Alan seç (name, email, amount, vb.)
- Operatör seç (equals, contains, greater than, vb.)
- Değer gir

**Örnek:**
```
Entity: Messages
Filtreler:
  - timestamp >= 2026-01-01
  - customer_name contains "Yılmaz"
  - read_status equals false
```

**Adım 4:** Ara ve sonuçları görüntüle

#### Aramaları Kaydetme

**Kaydetme:**
1. Arama sonucunda "Aramayı Kaydet" butonuna tıkla
2. İsim ver: "Ocak ayı okunmamış mesajlar"
3. Kaydet

**Kullanma:**
1. Gelişmiş Arama → Kaydedilmiş Aramalar
2. Listedenbirini seç
3. Otomatik çalışır

---

## ❓ SSS (Sıkça Sorulan Sorular)

### Genel Sorular

**S: Şifremi unuttum, ne yapmalıyım?**
**C:** Login sayfasında "Şifremi Unuttum" linkine tıklayın. Email adresinize şifre sıfırlama linki gönderilir.

**S: Email adresimi değiştirebilir miyim?**
**C:** CLIENT kullanıcılar admin'den talep etmelidir. Admin kullanıcılar kendi email'lerini değiştirebilir.

**S: Panele mobil cihazdan erişebilir miyim?**
**C:** Evet, panel responsive tasarımlıdır. Tarayıcınızdan erişebilirsiniz.

**S: Bildirimleri nasıl kapatırım?**
**C:** Profil → Bildirimler bölümünden istediğiniz bildirimleri kapatabilirsiniz.

### Mesaj Soruları

**S: Panelden WhatsApp mesajı gönderebilir miyim?**
**C:** Hayır, sistem sadece mesajları görüntüler. Mesaj gönderimi n8n workflow'u üzerinden yapılır.

**S: Eski mesajlar nereye gitti?**
**C:** Tüm mesajlar saklanır. Gelişmiş Arama ile tarih filtresi yaparak eski mesajları bulabilirsiniz.

**S: Mesajları silebilir miyim?**
**C:** CLIENT kullanıcılar mesaj silemez. Admin kullanıcılar toplu temizlik yapabilir.

**S: Medya dosyalarını nasıl indirebilirim?**
**C:** Mesaj detayında media önizlemesine tıklayın, ardından "İndir" butonunu kullanın.

### Ödeme Soruları

**S: Faturamı nasıl alabilirim?**
**C:** Ödemelerim sayfasında ödeme satırında "Fatura" butonuna tıklayarak PDF olarak indirebilirsiniz.

**S: Ödeme yöntemi değiştirebilir miyim?**
**C:** Ödeme yöntemi değişikliği için admin ile iletişime geçin.

**S: Otomatik ödeme seçeneği var mı?**
**C:** Şu an manuel ödeme sistemi kullanılıyor. Otomatik ödeme özelliği v2.1'de gelecek.

### Teknik Sorular

**S: Hangi tarayıcıları destekliyor?**
**C:** 
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**S: HTTPS kullanıyor mu?**
**C:** Evet, tüm veri transferi SSL/TLS ile şifrelenmiştir.

**S: Verilerim güvende mi?**
**C:** Evet, endüstri standardı güvenlik önlemleri alınmıştır:
- Şifreler bcrypt ile hash'lenir
- JWT token authentication
- Rate limiting
- Audit logging
- Günlük otomatik backup

**S: API'ye erişebilir miyim?**
**C:** Evet, Swagger dokümantasyonu `/api-docs` adresinde mevcuttur. API anahtarı için admin ile görüşün.

---

## 🎥 Video Eğitimler

### Temel Eğitimler

1. **İlk Giriş ve Kurulum** (5 dakika)
   - Sisteme giriş
   - Şifre değiştirme
   - Profil ayarları

2. **Admin: Kullanıcı Yönetimi** (8 dakika)
   - Yeni kullanıcı ekleme
   - Kullanıcı düzenleme
   - Rol ve yetki yönetimi

3. **Admin: Ödeme Yönetimi** (6 dakika)
   - Ödeme ekleme
   - Ödeme raporları
   - Fatura oluşturma

4. **Client: Mesajlarımı Görüntüleme** (7 dakika)
   - Mesajlara erişim
   - Arama ve filtreleme
   - Konuşma detayları

5. **Raporlama ve Analitik** (10 dakika)
   - Rapor oluşturma
   - Export özellikleri
   - Analytics dashboard kullanımı

### Gelişmiş Eğitimler

6. **Gelişmiş Arama ve Filtreler** (12 dakika)
   - Search builder kullanımı
   - Karmaşık sorgular
   - Aramayı kaydetme

7. **Yetki ve Denetim Yönetimi** (15 dakika)
   - RBAC sistemi
   - Yetki matrisi
   - Audit log inceleme

8. **Toplu İşlemler ve Otomasyon** (10 dakika)
   - Toplu kullanıcı işlemleri
   - Zamanlanmış raporlar
   - Email automation

---

## 📞 Destek ve İletişim

### Teknik Destek

**Email:** support@autoviseo.com  
**Telefon:** +90 555 123 4567  
**Çalışma Saatleri:** Hafta içi 09:00 - 18:00

### Acil Durum

**Sistem Arızası:** emergency@autoviseo.com  
**Güvenlik Sorunu:** security@autoviseo.com  
**7/24 Destek:** +90 555 999 8888

### Dokümantasyon

**Online Dokümantasyon:** https://docs.autoviseo.com  
**API Dokümantasyonu:** https://yourdomain.com/api-docs  
**GitHub:** https://github.com/MustafaBasol/DOA

### Eğitim Talebi

Kurum içi eğitim için:
- Email: training@autoviseo.com
- En az 1 hafta önceden bildirim
- Online veya yüz yüze seçenekleri

### Geri Bildirim

**Önerildiniz var mı?**
- feedback@autoviseo.com
- GitHub Issues
- Anket formu (aylık)

---

## 🎯 Best Practices

### Güvenlik

1. **Güçlü Şifre Kullanın**
   - Min 12 karakter
   - Büyük/küçük harf, rakam, özel karakter
   - Düzenli değiştirin (3 ayda bir)

2. **2FA Aktif Edin**
   - Profil → Güvenlik → 2FA
   - Google Authenticator kullanın

3. **Oturumları Yönetin**
   - Kullanmadığınızda çıkış yapın
   - Paylaşımlı bilgisayarlarda dikkatli olun
   - "Beni Hatırla" seçeneğini ortak cihazlarda kullanmayın

### Verimlilik

1. **Klavye Kısayolları Kullanın**
   - Hızlı navigasyon için
   - Ctrl+K ile hızlı arama

2. **Aramaları Kaydedin**
   - Sık kullandığınız filtreleri kaydedin
   - Zaman kazanın

3. **Bildirimleri Optimize Edin**
   - Sadece önemli bildirimleri aktif tutun
   - Email spam'ini önleyin

### Veri Yönetimi

1. **Düzenli Backup**
   - Admin: Haftalık manuel backup
   - Otomatik backup kontrol edin

2. **Export ve Arşivleme**
   - Eski verileri düzenli export edin
   - Lokal backup alın

3. **Veri Temizliği**
   - Kullanılmayan kayıtları silin
   - Performans için önemli

---

## 📈 İleri Seviye Özellikler

### API Kullanımı

**REST API Access:**
```bash
# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123"}'

# Get Messages
curl https://yourdomain.com/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Swagger UI:**
- https://yourdomain.com/api-docs
- İnteraktif API test arayüzü

### Webhook Entegrasyonu

**n8n Webhook:**
- Gelen mesajlar otomatik sisteme kaydedilir
- Real-time push notifications
- Custom webhook'lar oluşturabilirsiniz

### Custom Raporlar

**SQL Query Access (Admin Only):**
- Reports → Custom Query
- SQL sorgusu yazın
- Export edin

---

## 🎓 Sertifikasyon

### DOA Certified User

**Seviye 1: Basic User**
- Temel navigasyon
- Mesaj görüntüleme
- Profil yönetimi
- **Süre:** 2 saat eğitim
- **Sınav:** 20 soru, %70 geçer

**Seviye 2: Advanced User**
- Gelişmiş arama
- Rapor oluşturma
- Toplu işlemler
- **Süre:** 4 saat eğitim
- **Sınav:** 30 soru, %75 geçer

**Seviye 3: Administrator**
- Kullanıcı yönetimi
- Yetki yönetimi
- Sistem konfigürasyonu
- **Süre:** 8 saat eğitim
- **Sınav:** 50 soru, %80 geçer

### Sertifika Başvurusu

Email: certification@autoviseo.com

---

## ✅ Onboarding Checklist

### İlk 24 Saat
- [ ] İlk giriş yapıldı
- [ ] Şifre değiştirildi
- [ ] Profil bilgileri güncellendi
- [ ] Dil tercihi ayarlandı
- [ ] Dashboard gezildi
- [ ] İlk mesaj görüntülendi

### İlk Hafta
- [ ] Tüm menüler keşfedildi
- [ ] İlk arama yapıldı
- [ ] İlk rapor oluşturuldu
- [ ] Bildirim tercihleri ayarlandı
- [ ] En az 1 kaydedilmiş arama oluşturuldu
- [ ] Klavye kısayolları öğrenildi

### İlk Ay
- [ ] İleri seviye arama kullanıldı
- [ ] Export özelliği denendi
- [ ] Toplu işlem yapıldı (Admin)
- [ ] Yetki sistemi anlaşıldı
- [ ] API dokümantasyonu incelendi
- [ ] Destek ekibi ile iletişim kuruldu

---

## 🎉 Başarılı Kullanım İçin İpuçları

1. **Sabırlı Olun** - İlk birkaç gün alışma süreci normaldir
2. **Soru Sorun** - Destek ekibi yardımcı olmak için burada
3. **Video Eğitimleri İzleyin** - Görsel öğrenme çok etkilidir
4. **Düzenli Pratik Yapın** - Her gün birkaç dakika kullanın
5. **Notlar Alın** - Kendi referans notlarınızı oluşturun
6. **Geri Bildirim Verin** - Deneyiminizi paylaşın

---

**Başarılar! 🚀**

DOA WhatsApp Chatbot Yönetim Sistemi'nde kendinizi hızla geliştireceksiniz. Herhangi bir sorunuz olursa destek ekibimiz her zaman yardımcı olmaya hazır!

---

**Son Güncelleme:** 22 Ocak 2026  
**Versiyon:** 2.0  
**Hazırlayan:** DOA Development Team
