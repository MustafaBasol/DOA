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
- `https://autoviseo.com/` değerlerini doğrulayın.
- `https://autoviseo.com/assets/images/og-image.svg` ve `logo-mark.svg` dosyalarını gerçek görsellerle güncelleyin.

## 2) Yapılandırılmış Veri (Schema.org)

**Dosya:** `assets/seo/organization.json`

JSON-LD içerik harici dosyada tutulur ve `index.html` içinde şu satırla yüklenir:
```html
<script type="application/ld+json" src="assets/seo/organization.json"></script>
```

**Yapmanız gerekenler:**
- `url`, `logo`, `description` alanlarının güncel olduğundan emin olun.
- `sameAs` listesine sosyal medya profillerini ekleyin.

## 3) Google Analytics / Tag Manager Yerleşimi

**Konum:** `index.html` içinde, `<head>` bölümünde Google tag aktif halde bulunur:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5D6FMVNHRD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-5D6FMVNHRD');
</script>
```

**Yapmanız gerekenler:**
- Farklı bir GA4 ölçüm kimliği kullanacaksanız `G-5D6FMVNHRD` değerini güncelleyin.

## 4) CSP (Content-Security-Policy) Güncelleme

Şu an CSP `script-src` ve `connect-src` içinde Google izinleri aktiftir.

Google etiketi eklediğinizde CSP'yi genişletmeniz gerekir. Örnek:

```
script-src 'self' https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;
img-src 'self' data: https://www.google-analytics.com;
```

`index.html` içinde `<meta http-equiv="Content-Security-Policy">` satırını domain değişirse güncelleyin.

## 5) robots.txt ve sitemap.xml

- `robots.txt` arama motorlarına siteyi taramayı izinli kılar.
- `sitemap.xml` site URL’ini bildirir.

**Yapmanız gerekenler:**
- `robots.txt` ve `sitemap.xml` içinde domain günceldir. Değişirse düzenleyin.

## 6) Kontrol Listesi

- [ ] Tüm `example.com` değerlerini gerçek domain ile değiştir.
- [ ] OG/Twitter görsel URL’lerini güncelle.
- [ ] `assets/seo/organization.json` alanlarını güncelle.
- [ ] GA4/Tag Manager scriptlerini ekle ve CSP’yi genişlet.
