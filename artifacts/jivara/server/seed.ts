import { db } from "./db";
import { categories, storeSettings, products, orders, customerActivity, cartItems } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';

export async function seedDatabase() {
  try {
    console.log("🌱 بدء تهيئة قاعدة البيانات...");
    console.log("📍 البيئة الحالية:", process.env.NODE_ENV || 'development');
    console.log("🔗 قاعدة البيانات:", process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    // فحص إذا كانت البيانات موجودة مسبقاً
    const existingProducts = await db.select().from(products).limit(1);
    const shouldReseed = existingProducts.length === 0; // seed فقط إذا لم تكن هناك بيانات
    
    if (!shouldReseed) {
      console.log("✓ قاعدة البيانات تحتوي على بيانات مسبقاً - تم تخطي seed");
      return;
    }
    
    console.log("📦 قاعدة البيانات فارغة - بدء إضافة البيانات الأساسية...");

    // تهيئة الأقسام
    const existingCategories = await db.select().from(categories).limit(1);
    
    if (existingCategories.length === 0) {
      console.log("📦 إضافة الأقسام...");
      
      await db.insert(categories).values([
        { id: 11, name: 'Watches', nameAr: 'الساعات الرجالية', slug: 'watches', isActive: true },
        { id: 12, name: 'Perfumes', nameAr: 'العطور', slug: 'perfumes', isActive: true },
        { id: 14, name: 'Women Watches', nameAr: 'ساعات نسائية', slug: 'women-watches', isActive: true },
        { id: 15, name: 'Sunglasses', nameAr: 'نظارات', slug: 'sunglasses', isActive: true },
        { id: 16, name: 'Accessories', nameAr: 'إكسسوارات', slug: 'accessories', isActive: true },
        { id: 17, name: 'Men Socks', nameAr: 'جوارب رجالية براندات أصلية', slug: 'men-socks', isActive: true },
        { id: 18, name: 'Formal Shoes', nameAr: 'أحذية رجالية رسمية', slug: 'formal-shoes', isActive: true },
        { id: 19, name: 'Men Underwear', nameAr: 'ملابس داخلية رجالية', slug: 'men-underwear', isActive: true },
        { id: 20, name: 'Home Goods', nameAr: 'المواد المنزلية والأثاث', slug: 'home-goods', isActive: true }
      ]);
      
      console.log("✅ تم إضافة الأقسام بنجاح!");
    } else {
      console.log("✓ الأقسام موجودة مسبقاً");
    }

    // تهيئة إعدادات المتجر - جميع الإعدادات من لوحة التحكم
    const existingSettings = await db.select().from(storeSettings).limit(1);
    
    if (existingSettings.length === 0) {
      console.log("📦 إضافة إعدادات المتجر...");
      
      await db.insert(storeSettings).values([
        { key: 'store_name', value: 'جيفارا للتسوق' },
        { key: 'store_name_ar', value: 'جيفارا للتسوق' },
        { key: 'store_name_en', value: 'Jivara Shopping' },
        { key: 'store_description', value: 'وجهتك الأولى للتسوق في الأنبار' },
        { key: 'store_phone1', value: '07819966698' },
        { key: 'store_phone2', value: '07819966698' },
        { key: 'phone1', value: '07819966698' },
        { key: 'phone2', value: '' },
        { key: 'store_email', value: 'info@jivarashopping.com' },
        { key: 'store_address', value: 'الأنبار' },
        { key: 'address', value: 'Anbar' },
        { key: 'address_ar', value: 'الأنبار' },
        { key: 'store_city', value: 'الأنبار' },
        { key: 'store_country', value: 'العراق' },
        { key: 'whatsapp_number', value: '9647819966698' },
        { key: 'facebook_url', value: 'https://www.facebook.com/profile.php?id=100076016739907&mibextid=ZbWKwL' },
        { key: 'instagram_url', value: 'https://www.instagram.com/oorr1999?igsh=YTVtdDBjZ3J3NXM3' },
        
        // الألوان والثيمات
        { key: 'primary_color', value: 'hsl(120, 85%, 45%)' },
        { key: 'secondary_color', value: 'hsl(120, 15%, 96%)' },
        { key: 'accent_color', value: 'hsl(120, 15%, 88%)' },
        { key: 'background_color', value: 'hsl(0, 0%, 100%)' },
        { key: 'foreground_color', value: 'hsl(120, 15%, 15%)' },
        { key: 'current_theme_id', value: 'nature-green' },
        { key: 'current_theme_name', value: 'الأخضر الطبيعي' },
        
        // إعدادات الشحن والإرجاع
        { key: 'free_shipping_threshold', value: '100000' },
        { key: 'min_order_amount', value: '25000' },
        { key: 'delivery_time', value: '1-3 أيام عمل' },
        { key: 'working_hours', value: 'من السبت للخميس 9 صباحاً - 10 مساءً' },
        { key: 'return_period', value: '2' },
        { key: 'warranty_period', value: '12' },
        { key: 'usd_exchange_rate', value: '1400' },
        
        // السياسات
        { key: 'shipping_policy', value: 'نوفر الشحن السريع لجميع المحافظات، شحن مجاني للطلبات فوق 100,000 د.ع' },
        { key: 'return_policy', value: 'إمكانية الإرجاع واستبدال المنتجات خلال 2أيام من تاريخ الشراء مع ضمان استرداد كامل المبلغ للمنتجات غير المفتوحة' },
        { key: 'privacy_policy', value: 'نحن في جيفارا للتسوق نحترم خصوصية عملائنا ونحافظ على سرية معلوماتهم الشخصية ولا نشاركها مع أي طرف ثالث' },
        { key: 'terms_conditions', value: 'شروط وأحكام جيفارا للتسوق تضمن حقوق العملاء وتوفر تجربة تسوق آمنة ومضمونة للمنتجات الأصلية' },
        { key: 'about_us', value: '\nتسوق من تشكيلة واسعة ومتنوعة\nاكتشف مجموعتنا المتنوعة من المنتجات عالية الجودة بأفضل الأسعار' },
        
        // الصفحة الرئيسية
        { key: 'homepage_hero_title', value: 'تسوق من تشكيلة واسعة ومتنوعة' },
        { key: 'homepage_hero_subtitle', value: 'اكتشف مجموعتنا المتنوعة من المنتجات عالية الجودة بأفضل الأسعار' },
        { key: 'hero_image', value: '/attached_assets/ChatGPT Image 18 أغسطس 2025، 11_29_50 م_1755549026405.png' },
        
        // صور الأقسام
        { key: 'watches_category_image', value: '/attached_assets/rolex-watch.png' },
        { key: 'perfumes_category_image', value: '/attached_assets/hqdefault_1755548467976.jpg' },
        { key: 'category_electronics_image', value: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_fashion_image', value: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_home_garden_image', value: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_beauty_health_image', value: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_sports_outdoor_image', value: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_automotive_image', value: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_toys_kids_image', value: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'category_books_media_image', value: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600' },
        { key: 'default_product_image', value: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
        
        // صور العملاء
        { key: 'customer1_image', value: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100' },
        { key: 'customer2_image', value: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100' },
        { key: 'customer3_image', value: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100' },
        
        // Telegram Bot
        { key: 'telegram_bot_token', value: '7615049578:AAEi1JMX-lykUDFCnnEu6RL3-Vmn9W0fI2I' },
        { key: 'telegram_chat_id', value: '7048101091' }
      ]);
      
      console.log("✅ تم إضافة جميع إعدادات المتجر بنجاح!");
      
      // إضافة الصور المؤقتة من ملف JSON
      try {
        const tempImagesPath = path.join(process.cwd(), 'server', 'seed-data', 'temp-images-seed.json');
        console.log("🔍 البحث عن ملف الصور في:", tempImagesPath);
        
        if (fs.existsSync(tempImagesPath)) {
          console.log("📦 إضافة الصور المؤقتة...");
          const tempImages = JSON.parse(fs.readFileSync(tempImagesPath, 'utf-8'));
          
          for (const img of tempImages) {
            await db.insert(storeSettings).values(img).onConflictDoUpdate({
              target: storeSettings.key,
              set: { value: img.value, updatedAt: new Date() }
            });
          }
          
          console.log(`✅ تم إضافة ${tempImages.length} صورة مؤقتة!`);
        } else {
          console.warn("⚠️ تحذير: لم يتم العثور على ملف الصور المؤقتة في:", tempImagesPath);
        }
      } catch (error) {
        console.warn("⚠️ خطأ في إضافة الصور المؤقتة:", error);
      }
    } else {
      console.log("✓ إعدادات المتجر موجودة مسبقاً");
    }

    // تهيئة المنتجات - جميع ال 15 منتج مع الصور الحقيقية
    console.log("📦 إضافة المنتجات مع الصور...");
    
    // قراءة بيانات المنتجات من ملف JSON
    try {
      // المسار من جذر المشروع
      const productsPath = path.join(process.cwd(), 'server', 'seed-data', 'products-with-images.json');
      console.log("🔍 البحث عن ملف المنتجات في:", productsPath);
      
      if (fs.existsSync(productsPath)) {
        const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
        await db.insert(products).values(productsData);
        console.log(`✅ تم إضافة ${productsData.length} منتج مع الصور الحقيقية!`);
      } else {
        console.log("⚠️ ملف المنتجات غير موجود - استخدام البيانات الافتراضية");
        throw new Error("Products file not found");
      }
    } catch (error) {
      console.log("📦 استخدام البيانات الافتراضية للمنتجات...");
      
      await db.insert(products).values([
        {
          name: 'Poedagar',
          nameAr: 'Poedagarساعة رجالية فاخرة بتصميم أنيق',
          description: 'Poedagar',
          descriptionAr: '🕰️ ساعة رجالية فاخرة بتصميم أنيق\n🔸 موديل Poedagar الأصلي مع ضمان لمدة عام كامل\n🔸 سوار جلد فاخر – عرض التاريخ واليوم\n🔸 تغليف هدايا راقٍ + شهادة أصلية\n💵 السعر: 45 الف دينار عراقي فقط\n🎁 الكمية محدودة – احجز الآن قبل نفاد الكمية\n',
          price: '45000.00',
          originalPrice: '75000.00',
          categoryId: 11,
          sku: '1',
          stock: 15,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop']
        },
        {
          name: 'MOKAGO',
          nameAr: 'MOKAGO ',
          description: 'MOKAGO',
          descriptionAr: '🖤 ساعة MOKAGO النسائية – فخامة الأسود والذهب الوردي\n✨ تصميم أنيق وراقي لإطلالة فاخرة\n🔸 إطار مرصع بكريستالات لامعة\n🔸 ميناء داخلي بلون صدفي محاط بإطار أسود فاخر\n🔸 سوار معدني بلون ذهبي وردي مع لمسات سوداء وكريستال\n🔸 حركة Quartz دقيقة وعملية\n📍 الموقع: الرمادي – قرب مول الستي سنتر\n🛍️ متوفر الآن في سنتر المستودع للساعات والعطور والماركات العالمية\n📞 للطلب والاستفسار:',
          price: '75000.00',
          originalPrice: '120000.00',
          categoryId: 14,
          sku: '2',
          stock: 20,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop']
        },
        {
          name: 'REWARD ',
          nameAr: 'REWARD ',
          description: 'ساعة REWARD النسائية – أناقة بلون النبيتي والذهبي الوردي',
          descriptionAr: 'ساعة REWARD النسائية – أناقة بلون النبيتي والذهبي الوردي\n🔸 تصميم مربع عصري مع لمسة كلاسيكية\n🔸 ميناء باللون الأحمر النبيتي بنقشة مربعة أنيقة\n🔸 ترصيع كريستالي فاخر عند نقاط الساعات\n🔸 سوار معدني بلونين (فضي × ذهبي وردي) يضفي لمسة فاخرة\n🔸 مثالية للإطلالات اليومية والمناسبات الخاصة\n📍 الموقع: الرمادي – قرب مول الستي سنتر | سنتر المستودع للساعات والعطور والماركات العالمية\n📞 للطلب والاستفسار:',
          price: '65000.00',
          originalPrice: '110000.00',
          categoryId: 14,
          sku: '3',
          stock: 19,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1509941943102-10c232535736?w=400&h=400&fit=crop']
        },
        {
          name: 'MK&GO',
          nameAr: 'MK&GO',
          description: 'MK&GO',
          descriptionAr: '✨ ساعة نسائية فاخرة من MK&GO – فخامة الفضة\n🔸 تصميم راقٍ باللون الفضي الكامل\n🔸 مرصعة بالكامل بفصوص براقة تلفت الأنظار\n🔸 ميناء ناعم بأرقام رومانية أنيقة\n🔸 سوار لامع بتفاصيل دقيقة تعكس الفخامة\n🔸 مناسبة للإطلالات الرسمية والمناسبات الراقية 👑\n🔸 خيار مثالي كهدية ثمينة أو قطعة تكمّل أناقتك\n',
          price: '75000.00',
          originalPrice: '120000.00',
          categoryId: 14,
          sku: '4',
          stock: 6,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop']
        },
        {
          name: 'MK&GO',
          nameAr: 'MK&GO',
          description: '',
          descriptionAr: '💚 ساعة نسائية فاخرة من MK&GO – أناقة بلون الزمرد\n🔸 تصميم راقٍ باللون الأخضر الزمردي الجذاب\n🔸 إطار ذهبي وردي أنثوي وناعم\n🔸 ميناء بيضاوي مرصع بفصوص براقة\n🔸 سوار فاخر مزين بحبات خضراء متألقة\n🔸 حركة كوارتز عالية الدقة\n🔸 مثالية للإطلالات العصرية والمناسبات المميزة ✨',
          price: '75000.00',
          originalPrice: '120000.00',
          categoryId: 14,
          sku: '5',
          stock: 8,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&h=400&fit=crop']
        },
        {
          name: 'MK&GO',
          nameAr: 'MK&GO',
          description: '',
          descriptionAr: '🌸 ساعة نسائية فاخرة من MK&GO – خفة وأناقة لا تُضاهى\n🔸 تصميم ساحر بلمسة لؤلؤية أنثوية\n🔸 إطار ذهبي وردي مرصع بفصوص براقة\n🔸 سوار أنيق مكون من حبات اللؤلؤ الصناعية\n🔸 أرقام رومانية فاخرة لقراءة أنيقة وواضحة\n🔸 خفيفة الوزن وتناسب جميع الأذواق\n🔸 مثالية للهدايا الفخمة والمناسبات الخاصة 🎁',
          price: '75000.00',
          originalPrice: '120000.00',
          categoryId: 14,
          sku: '6',
          stock: 4,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop']
        },
        {
          name: 'YHMEI ',
          nameAr: 'YHMEI ',
          description: '',
          descriptionAr: '💙 كن مميزاً مع ساعة YHMEI الرجالية الكلاسيكية 💙⌚️\nتصميم عصري يجمع بين الأناقة والوظيفة… لكل رجل يهتم بالتفاصيل!\n🔵 وجه أزرق معدني جذاب مع عدادات متعددة الوظائف (كرونومتر – دقائق – ثواني – 24 ساعة)\n🔵 إطار بتفاصيل Tachymeter لقياس السرعة\n🔵 تقويم لعرض التاريخ\n🔵 سوار جلد فاخر بلون أسود\n🔵 تصميم رياضي رسمي مناسب للعمل والخروجات اليومية',
          price: '75000.00',
          originalPrice: '110000.00',
          categoryId: 11,
          sku: '7',
          stock: 6,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&h=400&fit=crop']
        },
        {
          name: ' MEGIR CHRONOMETER',
          nameAr: ' MEGIR CHRONOMETER',
          description: '',
          descriptionAr: '✨ فخامة التصميم والدقة في الأداء ✨⌚️\nساعة MEGIR CHRONOMETER الرجالية – الخيار الأمثل لكل رجل أنيق وعملي!\n🔥 تصميم عصري بلون ذهبي وردي\n🔥 وجه فضي أنيق مع عدادات متعددة (كرونومتر – دقائق – ثواني – 24 ساعة)\n🔥 سوار شبكي معدني متين وراقي\n🔥 تقويم لعرض التاريخ\n🔥 مثالية للإطلالة اليومية أو الرسمية',
          price: '65000.00',
          originalPrice: '100000.00',
          categoryId: 11,
          sku: '8',
          stock: 8,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&h=400&fit=crop']
        },
        {
          name: 'SKMEI ',
          nameAr: 'SKMEI ',
          description: '',
          descriptionAr: '🖤 ساعة SKMEI باللون الأسود 🖤\n\nتميّز بإطلالة كلاسيكية وأنيقة مع ساعة SKMEI ذات التصميم العملي والفخم\n\n⌚ ميناء باللون الأسود يمنحها طابعًا عصريًا وراقيًا\n⚙️ سوار متين وعالي الجودة يناسب جميع الأوقات والمناسبات\n💧 مقاومة للماء، مثالية للاستخدام اليومي والتنقل\n🎁 خيار رائع للإهداء أو لاقتناء ساعة أنيقة وعملية',
          price: '55000.00',
          originalPrice: '75000.00',
          categoryId: 11,
          sku: '9',
          stock: 9,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=400&h=400&fit=crop']
        },
        {
          name: 'REWARD',
          nameAr: 'REWARD',
          description: '',
          descriptionAr: '✨ ساعة REWARD باللون الأزرق وإطار ذهبي ✨\n\nتألّق بإطلالة استثنائية مع هذه الساعة الفاخرة من REWARD\n\n⌚ ميناء باللون الأزرق العميق يضيف لمسة من الفخامة والتميز\n✨ إطار ذهبي أنيق يمنحها طابعًا راقيًا ولافتًا للنظر\n⚙️ تصميم يجمع بين الأناقة العصرية والجودة العالية',
          price: '75000.00',
          originalPrice: '120000.00',
          categoryId: 11,
          sku: '10',
          stock: 7,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1533139142309-51b729c98207?w=400&h=400&fit=crop']
        },
        {
          name: ' SANOR',
          nameAr: ' SANOR',
          description: '',
          descriptionAr: 'ساعة رجالية أنيقة من SANOR بتصميم كلاسيكي عصري يجمع بين البساطة والفخامة. تأتي هذه الساعة بسوار معدني باللون الأسود مع إطار فضي لامع يمنحها لمسة راقية تناسب الإطلالات الرسمية والكاجوال. واجهتها الأنيقة تضفي مظهراً أنيقاً يعكس شخصية الرجل العصري.\n✨ متوفرة الآن لدى سنتر المستودع للساعات والعطور والماركات العالمية — المكان الذي يجمع أجمل الساعات وأفخم الماركات.\n',
          price: '65000.00',
          originalPrice: '100000.00',
          categoryId: 11,
          sku: '11',
          stock: 5,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=400&fit=crop']
        },
        {
          name: 'REWARD',
          nameAr: 'REWARD',
          description: '',
          descriptionAr: '✨🧡🖤 ساعة REWARD باللون البرتقالي مع إطار وميناء سوداء — تباين جريء وأناقة ملفتة 🖤🧡✨\nتميّز بإطلالة حيوية وعصرية مع ساعة REWARD التي تجمع بين اللون البرتقالي النابض بالحياة والإطار والميناء الأسود الكلاسيكي.\nتصميمها الجريء يجعلها خيارك الأمثل لتبرز بين الجميع بأناقة مميزة وشخصية قوية.\n✔️ إطار وميناء سوداء أنيقة\n✔️ تفاصيل برتقالية تضفي لمسة حيوية\n✔️ خامات عالية الجودة وأداء يدوم\n✔️ مقاومة للماء\n✔️ مناسبة للإطلالات الكاجوال والرياضية\n🧡🖤 REWARD البرتقالي مع الأسود… ساعة تعبّر عن طاقتك وشغفك.\n',
          price: '75000.00',
          originalPrice: '120000.00',
          categoryId: 11,
          sku: '12',
          stock: 8,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1585123388047-ad1eaaa43b8d?w=400&h=400&fit=crop']
        },
        {
          name: ' ROLEX',
          nameAr: ' ROLEX',
          description: '',
          descriptionAr: '✨💛⚪💚 ساعة ROLEX الذهبية والفضية مع ميناء أخضر — رمز الفخامة والتألق 💚⚪💛✨\nاكتشف روعة الأناقة مع ساعة ROLEX التي تجمع بين تميز اللونين الذهبي والفضي مع ميناء أخضر فاخر يعكس الذوق الرفيع والتفرد.\nتصميمها المتقن والخامات الفاخرة تجعلها الخيار الأمثل لمن يبحث عن التميز في كل لحظة.\n✔️ إطار مزيج الذهبي والفضي بأعلى جودة\n✔️ ميناء أخضر غني يضفي لمسة فاخرة\n✔️ خامات متينة وأداء يدوم\n✔️ مقاومة للماء\n✔️ مناسبة للإطلالات الرسمية والفاخرة\n💚⚪💛 ROLEX الذهبي والفضي مع الأخضر… ساعة تتحدث عن أناقتك بكل تفاصيلها.',
          price: '150000.00',
          originalPrice: '175000.00',
          categoryId: 11,
          sku: '13',
          stock: 6,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1517530094915-500495b15ade?w=400&h=400&fit=crop']
        },
        {
          name: 'LIGE',
          nameAr: 'LIGE',
          description: '',
          descriptionAr: '✨💙 ساعة LIGE بسير فضي وميناء سماوي — أناقة تبهر الأنظار 💙✨\n\nاستمتع بإطلالة راقية مع ساعة LIGE التي تتميز بسير فضي متين وميناء سماوي هادئ وجذاب، ليمنحك مزيجًا رائعًا من الفخامة والنعومة في التصميم.\nهذه الساعة مثالية لكل من يبحث عن التوازن بين الأناقة الكلاسيكية والعصرية.\n\n✔️ سير فضي متين وأنيق\n✔️ ميناء سماوي مميز يجذب الأنظار\n✔️ خامات عالية الجودة وأداء يدوم',
          price: '70000.00',
          originalPrice: '120000.00',
          categoryId: 11,
          sku: '14',
          stock: 4,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1514566102-b5cb5c680bff?w=400&h=400&fit=crop']
        },
        {
          name: ' MRGIR ',
          nameAr: ' MRGIR ',
          description: '',
          descriptionAr: '✨🔵💛 ساعة MRGIR باللون الأزرق مع ميناء مخطط بالأصفر — جرأة الألوان وأناقة التصميم 💛🔵✨\nتميّز بإطلالة فريدة مع ساعة MRGIR التي تجمع بين الأزرق الملكي المهيب وميناء مخطط بالأصفر الحيوي، لتمنحك توازنًا مثاليًا بين الفخامة والجرأة في التصميم.\nتفاصيل الميناء المخطط تعكس ذوقك الجريء وتضيف لمسة من الحيوية على معصمك.\n✔️ تصميم عصري وجريء\n✔️ ميناء أزرق مخطط بأصفر يعزز التميّز\n✔️ خامات عالية الجودة وأداء موثوق\n✔️ مقاومة للماء\n✔️ تناسب الإطلالات الرسمية والكاجوال\n💛🔵 MRGIR الأزرق والمخطط بالأصفر… ساعة تعبر عن شخصيتك المميزة.',
          price: '55000.00',
          originalPrice: '100000.00',
          categoryId: 11,
          sku: '16',
          stock: 3,
          isActive: true,
          isFeatured: true,
          images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop']
        }
      ]);
      
      console.log("✅ تم إضافة جميع المنتجات (15 منتج) مع الصور بنجاح!");
    }

    console.log("🎉 اكتملت تهيئة قاعدة البيانات!");
    console.log("📊 الملخص:");
    console.log("   ✓ 9 أقسام");
    console.log("   ✓ 58 إعداد للمتجر");
    console.log("   ✓ 15 منتج مع الصور");
  } catch (error) {
    console.error("❌ خطأ في تهيئة قاعدة البيانات:", error);
  }
}
