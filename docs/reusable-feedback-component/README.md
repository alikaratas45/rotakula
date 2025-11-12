
# Yorumlar Bileşenini Başka Projede Kullanma

Bu klasör, mevcut projedeki yorumlar (feedback) bölümünü başka bir React/Next.js projesinde yeniden kullanabilmeniz için gereken tüm kodları ve açıklamaları içerir.

## Gerekli Dosyalar ve Kodlar

Aşağıdaki dosyalar, yorum sisteminin çalışması için gereklidir. Bu dosyaları kendi projenizdeki ilgili klasörlere kopyalayabilirsiniz.

### 1. Ana Bileşen Kodu

- **`src/components/feedback.tsx`**: Yorumları listeleyen ve yeni yorum gönderme formunu içeren ana React bileşenidir.

### 2. Firebase Entegrasyon Kodları

Yorumlar Firebase Firestore üzerinde tutulur. Bu nedenle projenizin Firebase'e bağlı olması gerekir.

- **`docs/backend.json`**: Veritabanındaki `Feedback` koleksiyonunun veri yapısını (şema) tanımlar.
- **`firestore.rules`**: Firestore veritabanınıza kimlerin veri ekleyip okuyabileceğini belirleyen güvenlik kurallarını içerir.
- **`src/firebase/config.ts`**: Firebase projenizin bağlantı bilgilerini içerir. Kendi projenizin bilgileriyle değiştirmelisiniz.
- **`src/firebase/index.ts`**: Firebase servislerini başlatan ana dosyadır.
- **`src/firebase/provider.tsx` & `src/firebase/client-provider.tsx`**: Firebase servislerini uygulamanızın tamamında kullanılabilir kılan React Context sağlayıcılarıdır.
- **`src/firebase/non-blocking-updates.tsx`**: Veritabanına veri yazma işlemlerini kullanıcı arayüzünü kilitlemeden yapan fonksiyonları içerir.
- **`src/firebase/firestore/use-collection.tsx`**: Firestore'dan koleksiyon verilerini gerçek zamanlı olarak çekmek için kullanılan bir React hook'udur.

### 3. Arayüz (UI) Bileşenleri

Bu bileşenler `shadcn/ui` kütüphanesi kullanılarak oluşturulmuştur. Eğer projenizde `shadcn/ui` kurulu ise bu bileşenler zaten mevcuttur. Değilse, aşağıdaki kodları projenizin `src/components/ui/` klasörüne ekleyebilirsiniz.

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/toast.tsx` & `src/components/ui/toaster.tsx`
- `src/hooks/use-toast.ts`

### 4. Yardımcı Fonksiyonlar ve Tipler

- **`src/lib/utils.ts`**: `cn` gibi yardımcı fonksiyonları içerir.
- **`src/lib/types.ts`**: `Feedback` gibi veri tiplerini tanımlar.
- **`date-fns` kütüphanesi**: Yorum tarihlerini formatlamak için kullanılır (`npm install date-fns`).

## Kurulum Adımları

1.  **Dosyaları Kopyalayın:** Yukarıda listelenen dosyaların içeriğini kendi projenizdeki uygun yollara kopyalayın.
2.  **Bağımlılıkları Yükleyin:** Projenizde eksik olan kütüphaneleri `npm` veya `yarn` ile yükleyin. Başlıca bağımlılıklar:
    - `firebase`
    - `react-hook-form`
    - `@hookform/resolvers`
    - `zod`
    - `date-fns`
    - `lucide-react`
    - `clsx`, `tailwind-merge`
3.  **Firebase Projesi Oluşturun:** Henüz bir Firebase projeniz yoksa, [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun.
4.  **Firebase'i Yapılandırın:**
    - `src/firebase/config.ts` dosyasını kendi Firebase proje bilgilerinizle güncelleyin.
    - `firestore.rules` dosyasını Firebase projenizin Firestore bölümündeki "Kurallar" sekmesine yapıştırın ve yayınlayın.
5.  **Bileşeni Kullanın:** `FeedbackSection` bileşenini istediğiniz sayfaya `<FeedbackSection />` şeklinde ekleyin.
6.  **Provider'ları Ekleyin:** Uygulamanızın ana layout dosyasında (`layout.tsx` gibi), `FirebaseClientProvider` ve `Toaster` bileşenlerini çağırın.

```tsx
// Örnek src/app/layout.tsx
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
```
