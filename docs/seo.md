# SEO Yapılandırması

Bu doküman, Autoviseo landing page için SEO altyapısının nasıl güncelleneceğini ve Google etiketlerinin nerelere ekleneceğini açıklar.

## 1) Temel Meta Etiketleri

**Konum:** `index.html` `<head>` bölümü.

Güncel eklenen alanlar:
- `canonical` bağlantısı
- Open Graph (OG) ve Twitter kart etiketleri
- `robots` etiketi
- `sitemap` bağlantısı
- `referrer` politikası
- CSP (Content-Security-Policy)

**Yapmanız gerekenler:**
- `https://example.com/` değerlerini gerçek domain ile değiştirin.
- `https://example.com/assets/og-image.png` ve `logo.png` dosyalarını gerçek görsellerle güncelleyin.

## 2) Yapılandırılmış Veri (Schema.org)

**Dosya:** `assets/seo/organization.json`

JSON-LD içerik harici dosyada tutulur ve `index.html` içinde şu satırla yüklenir:
```html
<script type="application/ld+json" src="assets/seo/organization.json"></script>
```

**Yapmanız gerekenler:**
- `url`, `logo`, `description` alanlarını gerçek değerlerle değiştirin.
- `sameAs` listesine sosyal medya profillerini ekleyin.

## 3) Google Analytics / Tag Manager Yerleşimi

**Konum:** `index.html` içinde, `<head>` bölümünde yorumlu bir placeholder bulunur:
```html
<!--
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
-->
```

**Yapmanız gerekenler:**
- `G-XXXXXXXXXX` değerini kendi GA4 ölçüm kimliğinizle değiştirin.
- Scriptleri yorumdan çıkarın.

## 4) CSP (Content-Security-Policy) Güncelleme

Şu an CSP `script-src` ve `connect-src` üzerinde sınırlıdır.

Google etiketi eklediğinizde CSP'yi genişletmeniz gerekir. Örnek:

```
script-src 'self' https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;
img-src 'self' data: https://www.google-analytics.com;
```

`index.html` içinde `<meta http-equiv="Content-Security-Policy">` satırını bu izinlerle güncelleyin.

## 5) robots.txt ve sitemap.xml

- `robots.txt` arama motorlarına siteyi taramayı izinli kılar.
- `sitemap.xml` site URL’ini bildirir.

**Yapmanız gerekenler:**
- `robots.txt` ve `sitemap.xml` içindeki `https://example.com/` değerlerini gerçek domain ile değiştirin.

## 6) Kontrol Listesi

- [ ] Tüm `example.com` değerlerini gerçek domain ile değiştir.
- [ ] OG/Twitter görsel URL’lerini güncelle.
- [ ] `assets/seo/organization.json` alanlarını güncelle.
- [ ] GA4/Tag Manager scriptlerini ekle ve CSP’yi genişlet.
