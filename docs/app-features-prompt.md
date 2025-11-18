# Salihli Mobil Turist Rehberi Uygulaması Özellikleri

## 1. Genel Yapı ve Teknoloji

- **Platform:** Next.js 15, React 18
- **Dil:** TypeScript
- **Stil:** Tailwind CSS ve shadcn/ui bileşenleri. **Tema:** Salihli'nin bereketli topraklarını ve tarihi zenginliğini yansıtan, **ana rengi Zümrüt Yeşili (Emerald Green)**, **vurgu rengi ise Altın Sarısı (Gold)** olan modern ve şık bir tema kullanılacaktır.
- **Veri Kaynağı:** Proje içindeki statik JSON dosyaları (`/src/lib/data/`)
- **Harita Servisi:** Google Maps API

## 2. Temel Arayüz Özellikleri

- **Çoklu Dil Desteği:**
  - Desteklenen Diller: Türkçe (TR), İngilizce (EN).
  - Kullanıcının tarayıcı dili otomatik algılanır ve ilk dil buna göre ayarlanır.
  - Kullanıcı, başlık (header) bölümündeki dil değiştirme menüsünden dilediği dili seçebilir.

- **Tema (Açık/Koyu Mod):**
  - `next-themes` kullanılarak açık ve koyu tema desteği sunulur.
  - Kullanıcı, temayı başlık (header) bölümündeki buton ile değiştirebilir.

- **Splash Ekranı (Açılış Ekranı):**
  - Uygulama ilk açıldığında, Salihli Belediyesi logosunun ve "Sardes'in Mirası, Gediz'in İncisi" sloganının yer aldığı bir yükleme ekranı gösterilir ve 2 saniye sonra ana sayfaya geçiş yapılır.

- **Navigasyon:**
  - Mobil ve masaüstü için duyarlı bir başlık (header) bulunur.
  - Başlıkta ana sayfa linki, dil seçimi, tema butonu ve "Sesli Rehber" butonu yer alır.

## 3. Ana İçerik Sayfaları

- **Ana Sayfa (`/`):**
  - **Farklı Yerleşim:** Kula projesinden farklı olarak, ana sayfa daha dinamik bir yapıya sahip olacak.
  - Tam ekran bir kahraman (hero) videosu (Salihli tanıtım filminden bir kesit) ve üzerinde "Salihli'yi Keşfet" başlığı bulunur.
  - Videonun altında, "Sardes Antik Kenti", "Kurşunlu Kaplıcaları", "Odun Köfte" gibi en popüler 3 destinasyonun büyük ve şık kartları yer alır.
  - "Salihli'de Bir Gün" başlığı altında, kullanıcıyı farklı deneyimlere yönlendiren ikon tabanlı bir menü (Tarihe Yolculuk, Doğa ve Huzur, Lezzet Durakları, Alışveriş).
  - "Tematik Rotalar" bölümü, Kula projesindeki gibi kartlarla listelenir.

- **Tarihi ve Doğal Güzellikler (`/yerler`):**
  - Salihli'nin tüm tarihi, doğal ve turistik yerleri (POI - Point of Interest) listelenir.
  - Sayfanın üst kısmında, tüm noktaları gösteren ve altın rengi pin'lerin kullanıldığı interaktif bir harita bulunur.
  - Her bir yer için detay sayfasına yönlendiren, modern tasarımlı kartlar mevcuttur.

- **Yer Detay Sayfası (`/yerler/[slug]`):**
  - Yere ait büyük bir kahraman görseli ve başlık.
  - Yer hakkında detaylı bilgi ve açıklama metni.
  - **Metin Okuma (Text-to-Speech):** Kullanıcı, "Sesli Dinle" butonu ile yerin detaylı açıklamasını tarayıcının kendi seslendirme motoruyla dinleyebilir. Anlatım duraklatılabilir ve devam ettirilebilir. **Bu özellik mutlaka olmalıdır.**
  - Yerin konumunu gösteren gömülü bir harita.
  - QR kod okutularak gelindiğinde, sesli anlatım otomatik olarak başlar.

- **Tematik Rotalar ve Detayları (`/rotalar` ve `/rotalar/[slug]`):**
  - Rota kartları listelenir.
  - Rota detay sayfasında rotanın açıklaması, kahraman görseli ve rota üzerindeki durakların listesi bulunur.
  - Rota üzerindeki tüm durakları gösteren bir harita yer alır.
  - **Rotayı Başlatma:** Kullanıcı, "Rotayı Haritada Başlat" butonu ile mevcut konumundan başlayarak tüm durakları içeren bir Google Haritalar rotası açabilir.

- **Salihli'nin Hikayeleri (`/hikayeler` ve `/hikayeler/[slug]`):**
  - Lidya efsaneleri, Kurtuluş Savaşı anıları ve Salihli'nin kültürel hikayeleri listelenir.
  - Hikaye detay sayfasında hikaye metni, yazar bilgisi ve ilgili görsel bulunur.
  - **Metin Okuma (Text-to-Speech):** Kullanıcılar hikaye metnini de sesli olarak dinleyebilir.

- **Salihli Mutfağı (`/lezzetler`):**
  - Bu sayfa, Salihli'nin meşhur Odun Köftesi, Bohça Kebabı, kirazı ve Sultaniye üzümü gibi yöresel lezzetlerini tanıtan görsel ağırlıklı bir tasarıma sahip olacak.
  - Her lezzet için kısa bir tanıtım metni ve "Nerede Yenir?" butonu ile kullanıcıyı Google Haritalar'da ilgili aramaya yönlendirir (örn: "Salihli odun köftecileri").

## 4. İnteraktif Özellikler

- **Çevremde Ne Var? (`/yakindakiler`):**
  - Kullanıcıdan konum izni istenir.
  - Kullanıcının mevcut konumuna 15 km yarıçapındaki tüm turistik noktalar, uzaklıklarına göre sıralanarak listelenir.
  - Sayfanın üstünde bu yakın noktaları gösteren bir harita bulunur.

- **QR Kod Okuyucu (`/qr-okuyucu`):**
  - Kullanıcı, uygulama içindeki QR kod okuyucu ile Salihli'deki bilgilendirme noktalarında bulunan QR kodları okutabilir.
  - Başarılı bir tarama sonucunda, kullanıcı otomatik olarak ilgili yerin detay sayfasına yönlendirilir ve sesli anlatım otomatik olarak başlar.

- **Sesli Rehber (Otomatik):**
  - **Bu özellik kritik öneme sahiptir ve mutlaka olmalıdır.**
  - Kullanıcı, başlıktaki "Sesli Rehber" butonunu aktif hale getirebilir.
  - Bu özellik aktifken, uygulama kullanıcının konumunu periyodik olarak takip eder.
  - Kullanıcı bir turistik noktanın yakınına (örneğin ~50m) geldiğinde, bir bildirim (toast) gösterilir ve kısa bir sesli uyarı ("...konumuna geldiniz") çalar.
  - Kullanıcı, bu bildirimdeki butona basarak doğrudan o yerin detay sayfasına gidebilir ve tam anlatımı dinleyebilir.
  - Özellik, kullanıcı tarafından istendiği zaman kapatılabilir.
