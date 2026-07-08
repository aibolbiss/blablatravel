'use client';
import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  
  // Сжимаем изображение перед загрузкой
  const options = {
    maxSizeMB: 0.3, // Максимальный размер: 300 КБ
    maxWidthOrHeight: 1280, // Максимальное разрешение
    useWebWorker: true,
    quality: 0.6, // Качество: 60% (хорошо для веба, заметно меньше размер)
  };
  
  let compressedFile: File;
  try {
    const compressedBlob = await imageCompression(file, options);
    compressedFile = new File([compressedBlob], file.name, { type: file.type });
    console.log(`📸 Изображение сжато: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.warn('⚠️ Сжатие не удалось, используем оригинальный файл:', error);
    compressedFile = file;
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  
  const { error } = await supabase.storage.from('photos').upload(path, compressedFile, {
    cacheControl: '3600',
    upsert: false,
  });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}
