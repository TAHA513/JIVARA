import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "wouter";
import type { StoreSetting } from "@shared/schema";

export default function Footer() {
  const { data: settings = [] } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
  });

  const getSetting = (key: string) => 
    settings.find(s => s.key === key)?.value || "";

  const storeName = getSetting("store_name") || "جيفارا للتسوق";
  const phone1 = getSetting("store_phone1") || "07819966698";
  const phone2 = getSetting("store_phone2");
  const address = getSetting("store_address") || "الأنبار";
  const email = getSetting("store_email") || "info@jivarashopping.com";
  const facebookUrl = getSetting("facebook_url") || "";
  const instagramUrl = getSetting("instagram_url") || "";
  const whatsappNumber = getSetting("whatsapp_number") || phone1;

  return (
    <footer className="text-white py-8 sm:py-12 pb-24 md:pb-12 bg-[#070708]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 arabic-text">{storeName}</h3>
            <p className="text-gray-300 mb-4 arabic-text text-sm sm:text-base">
              {getSetting("footer_text") || "وجهتك الأولى للساعات والعطور الفاخرة في العراق"}
            </p>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="arabic-text">{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{phone1}</span>
              </div>
              {phone2 && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{phone2}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3 arabic-text">روابط سريعة</h4>
            <ul className="space-y-0.5 text-gray-300">
              <li>
                <Link href="/">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    الرئيسية
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    المنتجات
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/products?category=1">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    الساعات
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/products?category=2">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    العطور
                  </Button>
                </Link>
              </li>
              <li>
                <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                  العروض
                </Button>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3 arabic-text">خدمة العملاء</h4>
            <ul className="space-y-0.5 text-gray-300">
              <li>
                <Link href="/return-policy">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    سياسة الإرجاع
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    الشحن والتوصيل
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    من نحن
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    سياسة الخصوصية
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0 h-auto font-normal arabic-text">
                    الشروط والأحكام
                  </Button>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social Media & Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 arabic-text text-center sm:text-right">تابعنا</h4>
            <div className="flex gap-4 mb-6 justify-center sm:justify-start">
              {facebookUrl && (
                <a 
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    size="sm" 
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full p-0"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                </a>
              )}
              {instagramUrl && (
                <a 
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    size="sm" 
                    className="w-10 h-10 bg-pink-600 hover:bg-pink-700 rounded-full p-0"
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <a 
                href={`https://wa.me/964${whatsappNumber.replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  size="sm" 
                  className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full p-0"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </Button>
              </a>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-300 text-sm arabic-text">اشترك في النشرة الإخبارية</p>
              <div className="flex gap-2 items-stretch">
                <Input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 flex-1 arabic-text"
                />
                <Button className="bg-primary hover:bg-primary/90 text-black font-bold h-11 px-5 arabic-text flex-shrink-0">
                  اشتراك
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-600 pt-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <p className="text-white text-lg font-bold arabic-text">اضغط على تسوق الآن لطلب المنتج</p>
            <Link href="/products">
              <Button className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-6 py-2 arabic-text">
                تسوق الآن
              </Button>
            </Link>
          </div>
          <p className="text-gray-500 text-sm arabic-text">
            &copy; 2019 {storeName}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
