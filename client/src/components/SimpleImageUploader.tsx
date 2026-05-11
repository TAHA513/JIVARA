import { safeStorage } from '@/lib/safe-storage';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleImageUploaderProps {
  onUploadComplete: (imagePath: string) => void;
  maxFileSize?: number;
  children: React.ReactNode;
  buttonClassName?: string;
}

export function SimpleImageUploader({
  onUploadComplete,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  children,
  buttonClassName = ""
}: SimpleImageUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // فحص نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        title: "نوع الملف غير مسموح",
        description: "يرجى اختيار ملف صورة (JPG, PNG, GIF, إلخ)",
        variant: "destructive",
      });
      return;
    }

    // فحص حجم الملف
    if (file.size > maxFileSize) {
      toast({
        title: "حجم الملف كبير جداً",
        description: `الحد الأقصى المسموح: ${Math.round(maxFileSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // إنشاء معاينة للصورة
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const token = safeStorage.getItem('adminToken');
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في رفع الصورة');
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      toast({
        title: "تم رفع الصورة بنجاح ✅",
        description: `تم حفظ الصورة - حجم الملف: ${Math.round(selectedFile.size / 1024)}KB`,
      });

      onUploadComplete(result.imagePath);
      
      // إغلاق المودال بعد ثانيتين
      setTimeout(() => {
        setShowModal(false);
        resetState();
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'خطأ غير معروف';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "فشل في رفع الصورة",
        description: errorMessage,
        variant: "destructive",
      });

      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setShowModal(false);
      resetState();
    }
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 py-2 w-full text-[#161617]">
        {children}
      </Button>
      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" aria-describedby="upload-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-right">رفع صورة جديدة</DialogTitle>
          </DialogHeader>
          
          <div id="upload-dialog-description" className="space-y-4">
            {!selectedFile ? (
              <div className="text-center space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    اضغط لاختيار صورة
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    حد أقصى: {Math.round(maxFileSize / (1024 * 1024))}MB
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {previewUrl && (
                  <div className="flex justify-center">
                    <img
                      src={previewUrl}
                      alt="معاينة الصورة"
                      className="max-h-48 max-w-full object-contain rounded-lg"
                    />
                  </div>
                )}
                
                <div className="text-center space-y-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(selectedFile.size / 1024)}KB
                  </p>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                      جاري الرفع... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 ml-2" />
                    إلغاء
                  </Button>
                  
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || uploadProgress === 100}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                  >
                    {uploadProgress === 100 ? (
                      <>
                        <Check className="h-4 w-4 ml-2" />
                        مكتمل
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 ml-2" />
                        رفع الصورة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}