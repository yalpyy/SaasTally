# Uygulanacak değişiklikler — public okuma katmanı + kategori seed

İki yeni dosya ekle, beş dosyada küçük düzenleme yap. Toplam ~10 satır.

> Kendi yaptığın düzeltmelerin üzerine yazmamak için tam dosya vermiyorum,
> sadece değişen satırları veriyorum.

---

## 1. Yeni dosyalar (olduğu gibi kopyala)

- `src/lib/supabase/public.ts`
- `supabase/seed/0001_categories.sql`

---

## 2. `src/services/tools.ts`

**Import satırını değiştir:**

```diff
- import { createServerSupabase } from "@/lib/supabase/server";
+ import { createPublicSupabase } from "@/lib/supabase/public";
```

**`liveTools()` içinde:**

```diff
- const supabase = await createServerSupabase();
+ const supabase = createPublicSupabase();
```

---

## 3. `src/services/categories.ts`

Aynı iki değişiklik. Fonksiyon adı `liveCategories()`.

```diff
- import { createServerSupabase } from "@/lib/supabase/server";
+ import { createPublicSupabase } from "@/lib/supabase/public";
```

```diff
- const supabase = await createServerSupabase();
+ const supabase = createPublicSupabase();
```

---

## 4. `src/services/articles.ts`

Aynı iki değişiklik. Fonksiyon adı `liveArticles()`.

```diff
- import { createServerSupabase } from "@/lib/supabase/server";
+ import { createPublicSupabase } from "@/lib/supabase/public";
```

```diff
- const supabase = await createServerSupabase();
+ const supabase = createPublicSupabase();
```

---

## 5. `src/lib/affiliate/programs.ts`

Burada `createServiceSupabase` **kalmalı** — sadece diğerini değiştir.

```diff
- import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
+ import { createServiceSupabase } from "@/lib/supabase/server";
+ import { createPublicSupabase } from "@/lib/supabase/public";
```

`getActiveProgram()` içinde:

```diff
- const supabase = await createServerSupabase();
+ const supabase = createPublicSupabase();
```

---

## 6. `src/app/(site)/layout.tsx`

Dosyanın en üstüne, import'ların hemen altına ekle:

```ts
/**
 * Public catalogue pages are regenerated at most once an hour. Content edits in
 * Supabase appear without a redeploy; a lower value on an individual page
 * overrides this default.
 */
export const revalidate = 3600;
```

---

## 7. Supabase'de seed'i çalıştır

Dashboard → **SQL Editor** → `supabase/seed/0001_categories.sql` içeriğini yapıştır → Run.

Sonuçta `14 / 11` görmelisin (14 kategori, 11'i featured).

---

## 8. Commit + push

```bash
git add -A
git commit -m "Read public catalogue with an anonymous client; seed categories"
git push
```

---

## Neyin değiştiğini bilerek yap

**`createServerSupabase` artık sadece `src/lib/auth.ts` tarafından kullanılıyor.**
Doğrusu bu: oturum çerezini yalnızca oturum gerektiren yer okumalı.

**Admin sayfaları da bu public servisleri kullanıyor.** Yani admin tabloları
şimdilik sadece `active` / `published` satırları gösterir — taslak içerik
görünmez. Bugün fark yaratmıyor çünkü servisler zaten yayınlanmış içeriği
filtreliyordu; personel kapsamlı okuma, admin yazma etabında (C) gelecek.

**Seed sadece kategori içeriyor.** Araç, inceleme, karşılaştırma ve rehberler
kasıtlı olarak boş. `src/data` altındaki fiyat ve puanlar temsili veridir;
canlıya gerçekmiş gibi çıkarsa hem okuyucuyu hem affiliate başvurularını
riske atar.
