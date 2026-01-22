# K6 Load Testing

DOA API'si için k6 yük testi senaryoları.

## Kurulum

### K6 Yükleme

**MacOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

### Doğrulama
```bash
k6 version
```

## Test Senaryoları

### 1. API Load Test (api-load-test.js)

Genel API endpoint'lerinin yük testi.

**Aşamalar:**
- 30s: 10 kullanıcıya kadar artış
- 1m: 10 kullanıcı sabit
- 30s: 50 kullanıcıya artış
- 2m: 50 kullanıcı sabit
- 30s: 0'a düşüş

**Eşikler:**
- p95 < 500ms
- p99 < 1000ms
- Hata oranı < %10

**Çalıştırma:**
```bash
k6 run backend/tests/load/api-load-test.js
```

**Özel URL ile:**
```bash
k6 run -e BASE_URL=https://api.autoviseo.com backend/tests/load/api-load-test.js
```

### 2. Auth Load Test (auth-load-test.js)

Authentication flow'unun yük testi.

**Aşamalar:**
- 1m: 20 kullanıcıya kadar
- 3m: 20 kullanıcı sabit
- 1m: 50 kullanıcıya artış
- 2m: 50 kullanıcı sabit
- 1m: 100 kullanıcıya spike
- 2m: 100 kullanıcı sabit
- 1m: 0'a düşüş

**Test Edilen:**
- Login
- Get current user
- Token refresh
- Logout

**Eşikler:**
- p95 < 1000ms
- p99 < 2000ms
- Hata oranı < %5

**Çalıştırma:**
```bash
k6 run backend/tests/load/auth-load-test.js
```

### 3. Stress Test (stress-test.js)

Sistemin kırılma noktasını bulma testi.

**Aşamalar:**
- 2m: 100 kullanıcıya kadar
- 5m: 100 kullanıcı
- 2m: 200 kullanıcıya artış
- 5m: 200 kullanıcı
- 2m: 300 kullanıcıya artış
- 3m: 300 kullanıcı
- 2m: 400 kullanıcıya artış
- 2m: 400 kullanıcı
- 3m: 0'a düşüş

**Eşikler:**
- p95 < 2000ms
- p99 < 5000ms
- Hata oranı < %20 (kırılma noktası tespiti için)

**Çalıştırma:**
```bash
k6 run backend/tests/load/stress-test.js
```

### 4. Spike Test (spike-test.js)

Ani trafik artışına tepki testi.

**Aşamalar:**
- 10s: 10 kullanıcı
- 1m: 10 kullanıcı sabit
- 10s: 500 kullanıcıya ANI SÇRAMA
- 3m: 500 kullanıcı sabit
- 10s: 10 kullanıcıya geri düşüş
- 3m: Toparlanma periyodu
- 10s: 0'a düşüş

**Eşikler:**
- p95 < 3000ms
- Hata oranı < %30 (spike sırasında)

**Çalıştırma:**
```bash
k6 run backend/tests/load/spike-test.js
```

### 5. Soak Test (soak-test.js)

Uzun süreli yük altında stabilite testi.

**Süre:** 40 dakika

**Aşamalar:**
- 5m: 50 kullanıcıya kadar
- 30m: 50 kullanıcı sabit (UZUN SÜRE)
- 5m: 0'a düşüş

**Eşikler:**
- p95 < 800ms
- p99 < 1500ms
- Hata oranı < %5

**Çalıştırma:**
```bash
k6 run backend/tests/load/soak-test.js
```

## Docker ile Çalıştırma

```bash
# API Load Test
docker run --rm -i --network=host \
  -v "$(pwd)/backend/tests/load:/tests" \
  grafana/k6 run /tests/api-load-test.js

# Auth Load Test
docker run --rm -i --network=host \
  -v "$(pwd)/backend/tests/load:/tests" \
  grafana/k6 run /tests/auth-load-test.js

# Stress Test
docker run --rm -i --network=host \
  -v "$(pwd)/backend/tests/load:/tests" \
  grafana/k6 run /tests/stress-test.js
```

## Sonuçları Okuma

### Temel Metrikler

**http_req_duration:**
- avg: Ortalama yanıt süresi
- min: En hızlı yanıt
- max: En yavaş yanıt
- p(95): %95'lik dilim (kullanıcıların %95'i bu süreden daha hızlı yanıt alır)
- p(99): %99'luk dilim

**http_req_failed:**
- Failed request oranı
- İdeal: < %5

**iterations:**
- Test döngüsü sayısı
- Yüksek iteration = daha çok test yapıldı

**vus (virtual users):**
- Eşzamanlı kullanıcı sayısı

### Örnek Çıktı

```
✓ health check status 200
✓ messages status 200
✓ users status 200

checks.........................: 95.23% ✓ 2857    ✗ 143
data_received..................: 1.2 GB 20 MB/s
data_sent......................: 890 MB 15 MB/s
http_req_blocked...............: avg=1.23ms   min=2µs      max=125.67ms p(95)=5.12ms   p(99)=12.45ms
http_req_connecting............: avg=567µs    min=0s       max=89.23ms  p(95)=2.34ms   p(99)=5.67ms
http_req_duration..............: avg=234.56ms min=45.23ms  max=1.23s    p(95)=456.78ms p(99)=789.12ms
  { expected_response:true }...: avg=230.12ms min=45.23ms  max=987.65ms p(95)=445.67ms p(99)=756.89ms
http_req_failed................: 4.76% ✓ 143     ✗ 2857
http_req_receiving.............: avg=1.23ms   min=45µs     max=234.56ms p(95)=5.67ms   p(99)=12.34ms
http_req_sending...............: avg=456µs    min=12µs     max=89.12ms  p(95)=1.23ms   p(99)=3.45ms
http_req_tls_handshaking.......: avg=0s       min=0s       max=0s       p(95)=0s       p(99)=0s
http_req_waiting...............: avg=232.89ms min=44.56ms  max=1.2s     p(95)=454.32ms p(99)=786.54ms
http_reqs......................: 3000   50/s
iteration_duration.............: avg=5.23s    min=3.45s    max=12.34s   p(95)=8.45s    p(99)=10.23s
iterations.....................: 500    8.33/s
vus............................: 50     min=0     max=50
vus_max........................: 50     min=50    max=50
```

### Başarı Kriterleri

**✅ İyi Performans:**
- p95 < 500ms
- p99 < 1000ms
- http_req_failed < %5
- Tüm check'ler geçiyor

**⚠️ Kabul Edilebilir:**
- p95 < 1000ms
- p99 < 2000ms
- http_req_failed < %10

**❌ Kötü Performans:**
- p95 > 2000ms
- p99 > 5000ms
- http_req_failed > %10

## CI/CD Entegrasyonu

### GitHub Actions

```yaml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * 0' # Her Pazar 02:00
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Load Tests
        run: |
          k6 run backend/tests/load/api-load-test.js
          k6 run backend/tests/load/auth-load-test.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: |
            *.json
            *.html
```

## Grafana Cloud ile Görselleştirme

K6 sonuçlarını Grafana Cloud'a göndermek için:

1. Grafana Cloud hesabı oluştur
2. K6 Cloud token al
3. Test çalıştır:

```bash
k6 run --out cloud backend/tests/load/api-load-test.js
```

## En İyi Pratikler

### Test Ortamı

1. **Production'a yakın ortam kullan**
   - Aynı altyapı
   - Gerçek veri büyüklüğü
   - Production benzeri yapılandırma

2. **İzole ortam**
   - Test sırasında başka işlem yapılmamalı
   - Tutarlı sonuçlar için

3. **Monitoring aktif olsun**
   - CPU, Memory, Network izle
   - Database query performansı
   - Log'ları takip et

### Test Stratejisi

1. **Baseline oluştur**
   - İlk test sonuçlarını kaydet
   - Karşılaştırma için referans

2. **Artırımlı yük**
   - Küçük başla
   - Yavaş yavaş artır
   - Kırılma noktasını bul

3. **Çeşitli senaryolar**
   - Normal yük (average)
   - Yoğun yük (peak)
   - Spike (ani artış)
   - Uzun süre (soak)

### Sorun Giderme

**Yüksek yanıt süreleri:**
- Database query'leri optimize et
- Cache kullan
- Connection pool ayarları
- Index'leri kontrol et

**Yüksek hata oranı:**
- Log'ları incele
- Rate limiting ayarları
- Connection limit
- Timeout değerleri

**Memory leak:**
- Soak test ile tespit et
- Memory profiling yap
- Connection'ları düzgün kapat

## Raporlama

### HTML Rapor Oluşturma

```bash
k6 run --out json=results.json backend/tests/load/api-load-test.js
```

### JSON Sonuçları İnceleme

```bash
cat results.json | jq '.metrics'
```

## Test Kullanıcıları

Test senaryoları için varsayılan kullanıcılar:

```javascript
{
  email: 'admin@autoviseo.com',
  password: 'Admin123!'
}
```

**⚠️ Önemli:** Production'da bu kullanıcıları kullanmayın!

## Kaynaklar

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Cloud](https://k6.io/cloud/)
- [Grafana k6 GitHub](https://github.com/grafana/k6)
