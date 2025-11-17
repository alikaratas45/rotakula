
# RotaKula Mobil Turist Rehberi Uygulaması Özellikleri

## 1. Genel Yapı ve Teknoloji

- **Platform:** Next.js 15, React 18
- **Dil:** TypeScript
- **Stil:** Tailwind CSS ve shadcn/ui bileşenleri
- **Veri Kaynağı:** Proje içindeki statik JSON dosyaları (`/src/lib/data/`)
- **Veritabanı (Geri Bildirim için):** Firebase Firestore
- **Harita Servisi:** Google Maps API

## 2. Temel Arayüz Özellikleri

- **Çoklu Dil Desteği:**
  - Desteklenen Diller: Türkçe (TR), İngilizce (EN), Fransızca (FR), Almanca (DE).
  - Kullanıcının tarayıcı dili otomatik olarak algılanır ve ilk dil buna göre ayarlanır.
  - Kullanıcı, başlık (header) bölümündeki dil değiştirme menüsünden dilediği dili seçebilir.
  - Seçilen dil, `localStorage` üzerinde saklanarak sonraki ziyaretlerde hatırlanır.
  - Tüm arayüz metinleri ve içerik verileri (POI, Rota, Hikaye) seçilen dile göre dinamik olarak çevrilir.

- **Tema (Açık/Koyu Mod):**
  - `next-themes` kullanılarak açık ve koyu tema desteği sunulur.
  - Kullanıcının sistem tercihine göre otomatik tema seçimi yapılır.
  - Kullanıcı, temayı başlık (header) bölümündeki buton ile değiştirebilir.
  - Seçilen tema tercihi kaydedilir.

- **Splash Ekranı:**
  - Uygulama ilk açıldığında, Kula Belediyesi logosunun bulunduğu bir yükleme ekranı gösterilir ve 2 saniye sonra ana sayfaya geçiş yapılır.

- **Navigasyon:**
  - Mobil ve masaüstü için ayrı tasarlanmış, duyarlı bir başlık (header) bulunur.
  - Masaüstünde ana sayfa linki, sesli rehber, dil seçimi ve tema butonu yer alır.
  - Mobilde ise ana sayfa linki, sesli rehber, dil seçimi, tema butonu ve ana sayfaya hızlı dönüş butonu bulunur.

- **Admin Paneli Erişimi:**
  - Başlık bölümündeki logoya 5 kez üst üste tıklandığında, admin girişi/çıkışı yapmayı sağlayan gizli bir buton ortaya çıkar. Bu, geri bildirimleri yönetmek içindir.

## 3. Ana İçerik Sayfaları

- **Ana Sayfa (`/`):**
  - Geniş bir kahraman (hero) görseli ve karşılama metni.
  - Uygulamanın ana özelliklerine hızlı erişim sağlayan ikon tabanlı bir navigasyon menüsü (Tarihi Yerler, Çevremde Ne Var, Rota Oluştur vb.).
  - "Tematik Rotalar" bölümünde, Kula'yı farklı temalarla keşfetmeyi sağlayan rota kartları listelenir.
  - Kula tanıtım filminin yer aldığı gömülü bir YouTube videosu.
  - Kullanıcıların site hakkındaki görüşlerini paylaşıp görebileceği bir "Geri Bildirim" bölümü önizlemesi (son 5 yorum).

- **Tarihi ve Doğal Güzellikler (`/places`):**
  - Tüm jeolojik, tarihi ve doğal güzellikler (POI - Point of Interest) listelenir.
  - Konaklama ve yeme-içme noktaları bu listeden filtrelenmiştir.
  - Önemli yerleri (Peri Bacaları, Tarihi Evler vb.) listenin başına getiren özel bir sıralama mantığı kullanılır.
  - Sayfanın üst kısmında tüm noktaları gösteren interaktif bir harita bulunur.
  - Her bir yer için detay sayfasına yönlendiren kartlar mevcuttur.

- **Yer Detay Sayfası (`/places/[slug]`):**
  - Yere ait büyük bir kahraman görseli ve başlık.
  - Yer hakkında detaylı bilgi ve açıklama metni.
  - **Metin Okuma (Text-to-Speech):** Kullanıcı, "Sesli Dinle" butonu ile yerin detaylı açıklamasını tarayıcının kendi seslendirme motoruyla dinleyebilir. Anlatım duraklatılabilir ve devam ettirilebilir.
  - Yerin konumunu gösteren gömülü bir harita.
  - QR kod okutularak gelindiğinde, sesli anlatım otomatik olarak başlar.

- **Tematik Rotalar ve Detayları (`/routes` ve `/routes/[slug]`):**
  - Rota kartları listelenir.
  - Rota detay sayfasında rotanın açıklaması, kahraman görseli ve rota üzerindeki durakların listesi bulunur.
  - Rota üzerindeki tüm durakları gösteren bir harita yer alır.
  - **Rotayı Başlatma:** Kullanıcı, "Rotayı Haritada Başlat" butonu ile mevcut konumundan başlayarak tüm durakları içeren bir Google Haritalar rotası açabilir.

- **Hikayeler (`/stories` ve `/stories/[slug]`):**
  - Kula'nın efsanelerini, tarihini ve kültürünü anlatan hikayeler listelenir.
  - Hikaye detay sayfasında hikaye metni, yazar, tarih bilgisi ve ilgili görsel bulunur.
  - **Metin Okuma (Text-to-Speech):** Kullanıcılar hikaye metnini de sesli olarak dinleyebilir.

- **Konaklama (`/accommodation`):**
  - Sadece konaklama kategorisindeki yerler listelenir.
  - Sayfanın üstünde tüm otelleri gösteren bir harita bulunur.

- **Yeme / İçme (`/routes/kula-flavor-tour`):**
  - Bu rota, Kula'nın yöresel yemeklerini ve lezzetlerini tanıtan bir metin içerir.
  - Rota durakları yerine, "Tüm Lokantaları Gör" butonu ile kullanıcıyı Google Haritalar'da "Kula'daki restoranlar" aramasına yönlendirir.

## 4. İnteraktif Özellikler

- **Rota Oluşturma (`/create-route`):**
  - Kullanıcılar, tüm yerler arasından 10 adede kadar seçim yaparak kendi kişisel rotalarını oluşturabilir.
  - Seçilen yerlerin sayısı üstte bir barda gösterilir.
  - Kullanıcı, seçimlerini yaptıktan sonra "Rota Oluştur" butonuna basarak mevcut konumundan başlayıp seçtiği tüm noktalara uğrayan bir Google Haritalar rotası oluşturabilir (yürüyerek veya araçla).
  - Mobilde, rota oluşturma butonları erişimi kolaylaştırmak için ekranın sağ alt köşesinde sabitlenmiştir.

- **Çevremde Ne Var? (`/nearby`):**
  - Kullanıcıdan konum izni istenir.
  - Kullanıcının mevcut konumuna 10 km yarıçapındaki tüm turistik noktalar, uzaklıklarına göre sıralanarak listelenir.
  - Sayfanın üstünde bu yakın noktaları gösteren bir harita bulunur.
  - Konum izni verilmezse veya konum alınamazsa kullanıcıya bir hata mesajı gösterilir.

- **QR Kod Okuyucu (`/qr-scanner`):**
  - Kullanıcıdan kamera izni istenir.
  - Kullanıcı, uygulama içindeki QR kod okuyucu ile Kula'daki bilgilendirme noktalarında bulunan QR kodları okutabilir.
  - Başarılı bir tarama sonucunda, kullanıcı otomatik olarak ilgili yerin detay sayfasına yönlendirilir ve sesli anlatım otomatik olarak başlar.

- **Sesli Rehber (Otomatik):**
  - Kullanıcı, ana sayfadaki "Sesli Rehber" butonunu aktif hale getirebilir.
  - Bu özellik aktifken, uygulama kullanıcının konumunu periyodik olarak takip eder.
  - Kullanıcı bir turistik noktanın yakınına (merkezde ~10m, dışarılarda ~50m) geldiğinde, bir bildirim (toast) gösterilir ve kısa bir sesli uyarı ("...konumuna geldiniz") çalar.
  - Kullanıcı, bu bildirimdeki butona basarak doğrudan o yerin detay sayfasına gidebilir ve tam anlatımı dinleyebilir.
  - Özellik, kullanıcı tarafından istendiği zaman kapatılabilir.

- **Tanıtım Turu:**
  - Kullanıcı, ana sayfadaki "Nasıl Kullanılır?" butonuna tıklayarak otomatik bir tanıtım turu başlatabilir.
  - Tur, sesli anlatım eşliğinde uygulamanın ana sayfalarını (Rotalar, Rota Oluştur, Hikayeler, Çevremde Ne Var?) otomatik olarak gezdirir.
  - Tur sırasında, sesli rehber özelliğinin nasıl çalıştığı, butonun 4 saniyeliğine aktif edilip kapatılmasıyla görsel olarak da gösterilir.
  - Kullanıcı, "Turu Atla" butonu ile turu istediği zaman sonlandırabilir.

## 5. Geri Bildirim Sistemi

- **Firebase Entegrasyonu:**
  - Kullanıcılar, ana sayfadaki ve `/feedback` sayfasındaki form aracılığıyla site hakkındaki görüşlerini gönderebilirler.
  - Gönderilen yorumlar, Firebase Firestore veritabanına kaydedilir.
  - Yorumlar herkese açıktır ve gerçek zamanlı olarak güncellenir.
  - Admin yetkisine sahip kullanıcı (gizli admin girişiyle oturum açan), yorumları silebilir.
  - Belirli bir yorum (ID ile sabitlenmiş) her zaman listenin en başında gösterilir.
