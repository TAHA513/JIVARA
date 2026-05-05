import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4 p-8 bg-white rounded-lg shadow-sm border">
        <div className="flex mb-4 gap-2 items-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">404 صفحة غير موجودة</h1>
        </div>

        <p className="mt-4 text-sm text-gray-600 arabic-text">
          عذراً، الصفحة التي تبحث عنها غير موجودة.
        </p>
        
        <div className="mt-6">
          <a href="/" className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 arabic-text">
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
