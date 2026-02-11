# Kula Dijital Turist Rehberi - Teknik Şartname ve Özellikler

## 1. Genel Tanım
Kula Belediyesi tarafından sunulan, yerli ve yabancı ziyaretçilerin Kula’nın tarihi, jeolojik ve kültürel zenginliklerini modern teknolojilerle keşfetmesini sağlayan, çok dilli, konum duyarlı ve etkileşimli bir web tabanlı mobil rehber platformudur.

## 2. Teknik Altyapı
- **Platform:** Next.js 15 (App Router), React 18
- **Stil:** Tailwind CSS, shadcn/ui (Modern, temiz ve hızlı arayüz)
- **Veri Yönetimi:** Firebase Firestore (Gerçek zamanlı veritabanı)
- **Kimlik Doğrulama:** Firebase Auth (Admin paneli güvenliği için)
- **Barındırma:** Firebase App Hosting / Storage (Yüksek performanslı içerik dağıtımı)
- **PWA Desteği:** Progressive Web App (Cihaza yüklenebilme, hızlı açılış, splash screen ve uygulama benzeri deneyim)

## 3. Temel Fonksiyonel Özellikler

### 3.1. Çok Dilli İçerik ve Sesli Rehber
- **4 Dil Desteği:** Türkçe, İngilizce, Almanca ve Fransızca.
- **Akıllı Dil Algılama:** Kullanıcının tarayıcı diline göre otomatik içerik sunumu.
- **Hibrit Seslendirme:** Türkçe için yüksek kaliteli MP3 kayıtları, diğer diller için cihaz tabanlı dinamik TTS (Text-to-Speech) teknolojisi.
- **Otomatik Oynatma:** QR kod okutulduğunda veya konuma gelindiğinde otomatik başlayan anlatım.

### 3.2. Konum Duyarlı Akıllı Rehber (Smart Proximity)
- **Gerçek Zamanlı Takip:** Kullanıcının GPS konumunun 30 saniyelik periyotlarla izlenmesi.
- **Yakınlık Bildirimleri:** Kullanıcı bir turistik noktaya 20-50 metre yaklaştığında otomatik sesli ve görsel uyarı (Push Notification/Toast).
- **Çevremde Ne Var?:** Mevcut konuma 15 km mesafedeki noktaların mesafeye göre sıralanması ve harita üzerinde gösterimi.

### 3.3. Rota Yönetimi ve Navigasyon
- **Tematik Rotalar:** Jeopark turu, Tarihi Kula turu gibi önceden tanımlanmış rotalar.
- **Dinamik Rota Oluşturucu:** Kullanıcının kendi seçtiği 10 noktaya kadar duraktan oluşan kişiselleştirilmiş rota oluşturma ve Google Maps üzerinden navigasyon başlatma.
- **KML Entegrasyonu:** Bisiklet ve yürüyüş rotaları için profesyonel KML dosyası işleme ve harita üzerinde hassas çizim.

### 3.4. Oyunlaştırma (Gamification) ve Etkileşim
- **Konum Bazlı Rozet Sistemi:** Turistik noktaları bizzat ziyaret eden kullanıcılara otomatik puan ve dijital rozet tanımlanması.
- **Dijital Hatıra (Selfie Spot):** Kula temalı AR (Artırılmış Gerçeklik) benzeri çerçevelerle selfie çekme ve indirme özelliği.
- **Ziyaretçi Anketi:** Sadece ilgili konuma giden kullanıcıların doldurabildiği, temizlik, ulaşım ve personel ilgisini ölçen akıllı anket sistemi.

### 3.5. QR Kod Entegrasyonu
- **Noktasal Erişim:** Bilgilendirme tabelalarındaki QR kodların taranmasıyla doğrudan ilgili mekanın detay sayfasına ve sesli rehberine erişim.

## 4. Yönetim Paneli (CMS)
- **Yorum Yönetimi:** Kullanıcı geri bildirimlerinin onaylanması, yanıtlanması veya silinmesi.
- **Anket Analizi:** Ziyaretçi memnuniyet oranlarının grafiksel raporlanması ve Excel'e aktarımı.
- **İstatistik Takibi:** Gerçek zamanlı toplam ziyaretçi sayacı.

## 5. Güvenlik ve Performans
- **SSL/HTTPS:** Tüm veri trafiği end-to-end şifrelenmiştir.
- **Lazy Loading:** Görseller ve haritalar ihtiyaç duyulduğunda yüklenerek veri tasarrufu sağlar.
- **Image Optimization:** Next/Image ile cihaz boyutuna göre optimize edilmiş görsel sunumu.

## 6. Bakım ve Sürdürülebilirlik
- Sistem, bulut tabanlı Firebase altyapısı sayesinde düşük trafikli dönemlerde 0 TL'ye yakın, yüksek trafikli dönemlerde ise sadece kullanım kadar öde (Blaze Plan) modeliyle ekonomik ve sürdürülebilir bir maliyet yapısına sahiptir.
