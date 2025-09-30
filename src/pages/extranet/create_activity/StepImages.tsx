import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { activitiesApi } from '@/api/activities';
import { imagesApi } from '@/api/images';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';
import { FirebaseService } from '@/services/firebaseService';
import { ActivityImage } from '@/api/activities';

interface ImageFile {
  file: File;
  preview: string;
  url?: string;
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
  isExisting?: boolean; // Flag para identificar imágenes existentes
  id?: number | null; // ID de la imagen en la base de datos (null para nuevas)
}

const StepImages: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const hasRedirected = useRef(false);
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activityData, setActivityData] = useState<any>(null);
  const [activityImages, setActivityImages] = useState<ActivityImage[]>([]);

  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();

  //Cargar datos existentes de la actividad
  useEffect(() => {
    const loadActivityData = async () => {
      if (!activityId) return;
      await withLoading(async () => {
        const activityData = await activitiesApi.getById(activityId, lang, currency.toUpperCase());
        setActivityData(activityData);
        
        // Cargar imágenes si existen
        if (activityData && activityData.images) {
          setActivityImages(activityData.images);
          
          // Convertir ActivityImage a ImageFile para mostrar en el componente
          const existingImages: ImageFile[] = activityData.images.map((img: ActivityImage) => ({
            file: new File([], ''), // Archivo vacío ya que es una imagen existente
            preview: img.imageUrl,
            url: img.imageUrl,
            isUploading: false,
            uploadProgress: 100,
            isExisting: true, // Agregar flag para identificar imágenes existentes
            id: img.id // Incluir el ID de la imagen existente
          }));
          
          setImages(existingImages);
        } else {
          setActivityImages([]);
          setImages([]);
        }

      }, 'load-activity-data');
    };
    loadActivityData();
  }, [activityId, lang, currency]);
  
  useEffect(() => {
    // Verificar que tenemos activityId antes de continuar
    if (!activityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/extranet/login');
    } else if (activityId) {
      hasRedirected.current = false;
    }
  }, [activityId, navigate]);

  const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      try {
        // First check file size (faster than loading image)
        if (file.size > 7 * 1024 * 1024) { // 7MB limit
          resolve({ valid: false, error: getTranslation('stepImages.error.fileSize', language) });
          return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve({ valid: false, error: getTranslation('stepImages.error.validationFailed', language) });
        }, 10000); // 10 second timeout
        
        img.onload = () => {
          try {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            if (img.width < 1280) {
              resolve({ valid: false, error: getTranslation('stepImages.error.minWidth', language) });
            } else {
              resolve({ valid: true });
            }
          } catch (error) {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            resolve({ valid: false, error: getTranslation('stepImages.error.validationFailed', language) });
          }
        };
        
        img.onerror = () => {
          try {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            resolve({ valid: false, error: getTranslation('stepImages.error.invalidImage', language) });
          } catch (error) {
            clearTimeout(timeout);
            resolve({ valid: false, error: getTranslation('stepImages.error.validationFailed', language) });
          }
        };
        
        img.src = url;
      } catch (error) {
        resolve({ valid: false, error: getTranslation('stepImages.error.validationFailed', language) });
      }
    });
  };

  const handleFileSelect = async (files: FileList) => {
    try {
      const newImages: ImageFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file type (including WebP)
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          setError(getTranslation('stepImages.error.fileType', language));
          continue;
        }
        
        // Check if we already have 5 images
        if (images.length + newImages.length >= 5) {
          setError(getTranslation('stepImages.error.maxImages', language));
          break;
        }
        
        // Validate image dimensions and size
        try {
          const validation = await validateImage(file);
          if (!validation.valid) {
            setError(validation.error || getTranslation('stepImages.error.validationFailed', language));
            continue;
          }
        } catch (validationError) {
          console.error('Image validation error:', validationError);
          setError(getTranslation('stepImages.error.validationFailed', language));
          continue;
        }
        
        const imageFile: ImageFile = {
          file,
          preview: URL.createObjectURL(file),
          isUploading: false,
          uploadProgress: 0
        };
        
        newImages.push(imageFile);
      }
      
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        setError(null);
      }
    } catch (error) {
      console.error('Error handling file selection:', error);
      setError(getTranslation('stepImages.error.fileSelectionFailed', language));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    if (imageToRemove.id && imageToRemove.id !== null) {
      // Imagen existente con ID: eliminar de Firebase y base de datos
      try {
        await withLoading(async () => {
          // 1. Eliminar de Firebase
          if (imageToRemove.url) {
            try {
              await FirebaseService.deleteFile(imageToRemove.url);
            } catch (firebaseError) {
              console.error('Error deleting from Firebase:', firebaseError);
              // Continuar aunque falle Firebase
            }
          }
          
          // 2. Eliminar de la base de datos
          const response = await imagesApi.deleteImage(imageToRemove.id!);
          if (!response.success) {
            console.error('Error deleting from database:', response.message);
            // Mostrar error pero continuar
          }
        }, 'delete-image');
      } catch (error) {
        console.error('Error removing image:', error);
        setError(getTranslation('stepImages.error.deleteFailed', language));
        return;
      }
    }
    
    // 3. Eliminar de la página (tanto para imágenes existentes como nuevas)
    setImages(prev => {
      const newImages = [...prev];
      const removedImage = newImages[index];
      
      // Clean up preview URL
      if (removedImage.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const reorderImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const uploadToFirebase = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    try {
      // Generar nombre único para el archivo
      const fileName = FirebaseService.generateUniqueFileName(file.name);
      const filePath = `catalogs/services/${fileName}`;
      
      // Subir archivo usando el servicio de Firebase
      const downloadURL = await FirebaseService.uploadFile(file, filePath, {
        onProgress: onProgress,
        onError: (error) => {
          console.error('Error uploading to Firebase:', error);
        }
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw new Error('Error al subir archivo a Firebase');
    }
  };

  const uploadImages = async (imagesToUpload: ImageFile[] = images): Promise<string[]> => {
    const uploadPromises = imagesToUpload.map(async (imageFile, index) => {
      // Find the index in the main images array
      const mainIndex = images.findIndex(img => img === imageFile);
      
      // Update upload state
      setImages(prev => prev.map((img, i) => 
        i === mainIndex ? { ...img, isUploading: true, uploadProgress: 0 } : img
      ));

      try {
        const url = await uploadToFirebase(imageFile.file, (progress) => {
          // Update progress in real-time
          setImages(prev => prev.map((img, i) => 
            i === mainIndex ? { ...img, uploadProgress: progress } : img
          ));
        });
        
        // Update with uploaded URL
        setImages(prev => prev.map((img, i) => 
          i === mainIndex ? { ...img, url, isUploading: false, uploadProgress: 100 } : img
        ));
        
        return url;
      } catch (error) {
        // Update with error
        setImages(prev => prev.map((img, i) => 
          i === mainIndex ? { ...img, isUploading: false, error: 'Upload failed' } : img
        ));
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };


  const handleSaveAndExit = async () => {
    if (images.length < 3) {
      setError(getTranslation('stepImages.error.minimumThreeRequired', language));
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Evaluar qué imágenes están en la base de datos usando el ID
      const imagesToUpload: ImageFile[] = [];
      const existingImages: ActivityImage[] = [];

      for (const image of images) {
        if (image.id && image.id !== null) {
          // Es una imagen existente con ID, NO subir a Firebase
          existingImages.push({
            id: image.id,
            imageUrl: image.url || image.preview,
            isCover: false // Se determinará después
          });
        } else {
          // Es una imagen nueva (id=null), agregar para subir
          imagesToUpload.push(image);
        }
      }

      // 2. Subir imágenes faltantes a Firebase
      let newImageUrls: string[] = [];
      if (imagesToUpload.length > 0) {
        const urls = await uploadImages(imagesToUpload);
        newImageUrls = urls.filter(url => url);
        
        if (newImageUrls.length === 0) {
          setError(getTranslation('stepImages.error.uploadFailed', language));
          return;
        }
      }

      // 3. Preparar todas las imágenes (existentes + nuevas)
      const allImages = [
        ...existingImages.map((img, index) => ({
          url: img.imageUrl,
          cover: index === 0 // Primera imagen existente es cover
        })),
        ...newImageUrls.map((url, index) => ({
          url,
          cover: existingImages.length === 0 && index === 0 // Primera imagen nueva es cover si no hay existentes
        }))
      ];

      // 4. Enviar todas las imágenes a la base de datos
      const response = await activitiesApi.createImages({
        id: activityId!,
        images: allImages
      });

      if (response.success) {
        // Navigate to next step (StepOptions)
        navigate('/extranet/dashboard');
      } else {
        setError(response.message || getTranslation('stepImages.error.saveFailed', language));
      }
    } catch (error) {
      // Determinar el tipo de error para mostrar mensaje apropiado
      let errorMessage = getTranslation('stepImages.error.saveFailed', language);
      
      if (error instanceof Error) {
        if (error.message.includes('Firebase')) {
          errorMessage = getTranslation('stepImages.error.firebaseUpload', language);
        } else if (error.message.includes('network')) {
          errorMessage = getTranslation('stepImages.error.network', language);
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }
  const handleContinue = async () => {
    if (images.length < 3) {
      setError(getTranslation('stepImages.error.minimumThreeRequired', language));
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Evaluar qué imágenes están en la base de datos usando el ID
      const imagesToUpload: ImageFile[] = [];
      const existingImages: ActivityImage[] = [];

      for (const image of images) {
        if (image.id && image.id !== null) {
          // Es una imagen existente con ID, NO subir a Firebase
          existingImages.push({
            id: image.id,
            imageUrl: image.url || image.preview,
            isCover: false // Se determinará después
          });
        } else {
          // Es una imagen nueva (id=null), agregar para subir
          imagesToUpload.push(image);
        }
      }

      // 2. Subir imágenes faltantes a Firebase
      let newImageUrls: string[] = [];
      if (imagesToUpload.length > 0) {
        const urls = await uploadImages(imagesToUpload);
        newImageUrls = urls.filter(url => url);
        
        if (newImageUrls.length === 0) {
          setError(getTranslation('stepImages.error.uploadFailed', language));
          return;
        }
      }

      // 3. Preparar todas las imágenes (existentes + nuevas)
      const allImages = [
        ...existingImages.map((img, index) => ({
          url: img.imageUrl,
          cover: index === 0 // Primera imagen existente es cover
        })),
        ...newImageUrls.map((url, index) => ({
          url,
          cover: existingImages.length === 0 && index === 0 // Primera imagen nueva es cover si no hay existentes
        }))
      ];

      // 4. Enviar todas las imágenes a la base de datos
      const response = await activitiesApi.createImages({
        id: activityId!,
        images: allImages
      });

      if (response.success) {
        // Navigate to next step (StepOptions)
        navigateToActivityStep(navigate, '/extranet/activity/createOptions', {
          activityId,
          lang,
          currency,
          currentStep
        });
      } else {
        setError(response.message || getTranslation('stepImages.error.saveFailed', language));
      }
    } catch (error) {
      console.error('Error saving images:', error);
      
      // Determinar el tipo de error para mostrar mensaje apropiado
      let errorMessage = getTranslation('stepImages.error.saveFailed', language);
      
      if (error instanceof Error) {
        if (error.message.includes('Firebase')) {
          errorMessage = getTranslation('stepImages.error.firebaseUpload', language);
        } else if (error.message.includes('network')) {
          errorMessage = getTranslation('stepImages.error.network', language);
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createNotIncluded', {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepImages.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepImages.description', language)}
            </p>
          </div>

          {/* Requirements Section */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="fas fa-info-circle text-primary me-2"></i>
                {getTranslation('stepImages.requirements.title', language)}
              </h6>
              
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-success">
                    <i className="fas fa-check me-2"></i>
                    {getTranslation('stepImages.requirements.allowed', language)}
                  </h6>
                  <ul className="list-unstyled small text-muted">
                    <li>• {getTranslation('stepImages.requirements.minWidth', language)}</li>
                    <li>• {getTranslation('stepImages.requirements.fileTypes', language)}</li>
                    <li>• {getTranslation('stepImages.requirements.maxSize', language)}</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-danger">
                    <i className="fas fa-times me-2"></i>
                    {getTranslation('stepImages.requirements.prohibited', language)}
                  </h6>
                  <ul className="list-unstyled small text-muted">
                    <li>• {getTranslation('stepImages.requirements.noUpsideDown', language)}</li>
                    <li>• {getTranslation('stepImages.requirements.noWatermarks', language)}</li>
                    <li>• {getTranslation('stepImages.requirements.noAI', language)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="alert alert-info d-flex align-items-center justify-content-between mb-4">
            <div>
              <i className="fas fa-lightbulb me-2"></i>
              <strong>{getTranslation('stepImages.examples.title', language)}</strong>
              <p className="mb-0 mt-1">{getTranslation('stepImages.examples.description', language)}</p>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>

          {/* Upload Area */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <p className="text-muted mb-3">
                {getTranslation('stepImages.upload.instructions', language)}
              </p>
              
              <div className="row">
                <div className="col-md-8">
                  <div
                    className={`border-2 border-dashed rounded p-5 text-center ${
                      isDragOver ? 'border-primary bg-light' : 'border-muted'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <i className="fas fa-mountain fa-3x text-muted mb-3"></i>
                    <p className="mb-2">{getTranslation('stepImages.upload.dragText', language)}</p>
                                         <small className="text-muted">
                       {getTranslation('stepImages.upload.minImages', language)} • 
                       {getTranslation('stepImages.upload.maxSize', language)} • 
                       {getTranslation('stepImages.upload.fileTypes', language)}
                     </small>
                     {images.length < 3 && (
                       <div className="mt-2">
                         <small className="text-warning">
                           <i className="fas fa-exclamation-triangle me-1"></i>
                           Necesitas {3 - images.length} imagen{3 - images.length !== 1 ? 'es' : ''} más
                         </small>
                       </div>
                     )}
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-center">
                                     <button
                     type="button"
                     className="btn btn-primary w-100"
                     onClick={() => fileInputRef.current?.click()}
                     disabled={images.length >= 5}
                     title={images.length >= 5 ? getTranslation('stepImages.upload.maxReached', language) : ''}
                   >
                    <i className="fas fa-upload me-2"></i>
                    {getTranslation('stepImages.upload.button', language)}
                  </button>
                </div>
              </div>
              
              <input
                 ref={fileInputRef}
                 type="file"
                 multiple
                 accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                 onChange={handleFileInputChange}
                 className="d-none"
               />
            </div>
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                                 <h6 className="fw-bold mb-3">
                   {getTranslation('stepImages.preview.title', language)} ({images.length}/5)
                   {images.length < 3 && (
                     <span className="badge bg-warning ms-2">
                       {getTranslation('stepImages.preview.minimumRequired', language)}
                     </span>
                   )}
                 </h6>
                
                <div className="row">
                  {images.map((image, index) => (
                    <div key={index} className="col-md-4 mb-3">
                      <div className="position-relative">
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="img-fluid rounded border"
                          style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                        />
                        
                        {/* Upload Progress Overlay */}
                        {image.isUploading && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center rounded">
                            <div className="text-center text-white">
                              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                              <div className="small">{image.uploadProgress}%</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Error Overlay */}
                        {image.error && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 bg-danger bg-opacity-75 d-flex align-items-center justify-content-center rounded">
                            <div className="text-center text-white">
                              <i className="fas fa-exclamation-triangle fa-2x mb-2"></i>
                              <div className="small">{image.error}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="position-absolute top-0 end-0 p-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger me-1"
                            onClick={() => removeImage(index)}
                            title={getTranslation('stepImages.preview.remove', language)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        
                        {/* Reorder Buttons */}
                        <div className="position-absolute bottom-0 start-0 p-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => reorderImage(index, index - 1)}
                            disabled={index === 0}
                            title={getTranslation('stepImages.preview.moveUp', language)}
                          >
                            <i className="fas fa-arrow-up"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => reorderImage(index, index + 1)}
                            disabled={index === images.length - 1}
                            title={getTranslation('stepImages.preview.moveDown', language)}
                          >
                            <i className="fas fa-arrow-down"></i>
                          </button>
                        </div>
                        
                        {/* Cover Badge */}
                        {index === 0 && (
                          <div className="position-absolute top-0 start-0 p-2">
                            <span className="badge bg-primary">
                              {getTranslation('stepImages.preview.cover', language)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Botones de navegación */}
          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-outline-secondary" 
              onClick={handleBack}
              disabled={isUploading}
            >
              <i className="fas fa-arrow-left me-2"></i>
              {getTranslation('common.back', language)}
            </button>
            
            <div>
              <button 
                className="btn btn-outline-primary me-2" 
                onClick={handleSaveAndExit}
                disabled={isUploading}
              >
                {getTranslation('stepImages.saveAndExit', language)}
              </button>
                             <button 
                 className="btn btn-primary" 
                 onClick={handleContinue}
                 disabled={images.length < 3 || isUploading}
               >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {getTranslation('stepImages.uploading', language)}
                  </>
                ) : (
                  getTranslation('common.continue', language)
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ActivityCreationLayout>
  );
};

export default StepImages;
