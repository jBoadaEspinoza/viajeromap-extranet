import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  progress: number;
  downloadURL?: string;
  error?: string;
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (downloadURL: string) => void;
  onError?: (error: string) => void;
}

export class FirebaseService {
  /**
   * Sube un archivo a Firebase Storage
   * @param file - Archivo a subir
   * @param path - Ruta en Storage (ej: 'activities/123/image.jpg')
   * @param options - Opciones de callback para progreso y eventos
   * @returns Promise con la URL de descarga
   */
  static async uploadFile(
    file: File, 
    path: string, 
    options: UploadOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Crear referencia al archivo en Storage
        const storageRef = ref(storage, path);
        
        // Crear tarea de subida
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Monitorear el progreso de la subida
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            
            // Llamar callback de progreso si existe
            if (options.onProgress) {
              options.onProgress(progress);
            }
          },
          (error) => {
            const errorMessage = this.getErrorMessage(error);
            
            // Llamar callback de error si existe
            if (options.onError) {
              options.onError(errorMessage);
            }
            
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              // Obtener URL de descarga cuando la subida se complete
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Llamar callback de completado si existe
              if (options.onComplete) {
                options.onComplete(downloadURL);
              }
              
              resolve(downloadURL);
            } catch (error) {
              const errorMessage = this.getErrorMessage(error);
              
              if (options.onError) {
                options.onError(errorMessage);
              }
              
              reject(new Error(errorMessage));
            }
          }
        );
      } catch (error) {
        const errorMessage = this.getErrorMessage(error);
        
        if (options.onError) {
          options.onError(errorMessage);
        }
        
        reject(new Error(errorMessage));
      }
    });
  }

  /**
   * Sube múltiples archivos a Firebase Storage
   * @param files - Array de archivos a subir
   * @param basePath - Ruta base en Storage
   * @param onProgress - Callback para progreso individual de cada archivo
   * @returns Promise con array de URLs de descarga
   */
  static async uploadMultipleFiles(
    files: File[],
    basePath: string,
    onProgress?: (index: number, progress: number) => void
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${Date.now()}-${index}-${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      
      return this.uploadFile(file, filePath, {
        onProgress: (progress) => {
          if (onProgress) {
            onProgress(index, progress);
          }
        }
      });
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Genera un nombre único para el archivo
   * @param originalName - Nombre original del archivo
   * @returns Nombre único con timestamp
   */
  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    
    return `${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Convierte errores de Firebase a mensajes legibles
   * @param error - Error de Firebase
   * @returns Mensaje de error legible
   */
  private static getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          return 'No tienes permisos para subir archivos';
        case 'storage/canceled':
          return 'Subida cancelada';
        case 'storage/unknown':
          return 'Error desconocido en la subida';
        case 'storage/quota-exceeded':
          return 'Se ha excedido la cuota de almacenamiento';
        case 'storage/unauthenticated':
          return 'Debes autenticarte para subir archivos';
        default:
          return `Error de subida: ${error.message || error.code}`;
      }
    }

    return error?.message || 'Error desconocido en la subida';
  }

  /**
   * Valida si un archivo es válido para subir
   * @param file - Archivo a validar
   * @returns true si el archivo es válido
   */
  static isValidFile(file: File): boolean {
    // Verificar que sea un archivo
    if (!file || !(file instanceof File)) {
      return false;
    }

    // Verificar tamaño (máximo 10MB por defecto)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return false;
    }

    // Verificar tipo de archivo (incluyendo WebP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    return true;
  }

  /**
   * Elimina un archivo de Firebase Storage
   * @param url - URL completa del archivo a eliminar
   * @returns Promise que se resuelve cuando se elimina el archivo
   */
  static async deleteFile(url: string): Promise<void> {
    try {
      // Extraer la ruta del archivo desde la URL
      const urlObj = new URL(url);
      const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]?.split('?')[0] || '');
      
      if (!path) {
        throw new Error('No se pudo extraer la ruta del archivo desde la URL');
      }

      // Crear referencia al archivo
      const fileRef = ref(storage, path);
      
      // Eliminar el archivo
      await deleteObject(fileRef);
      
      console.log('Archivo eliminado exitosamente:', path);
    } catch (error) {
      console.error('Error eliminando archivo de Firebase:', error);
      throw error;
    }
  }
} 