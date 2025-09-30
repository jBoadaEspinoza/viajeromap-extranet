import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import OptionSetupLayout from '../../../components/OptionSetupLayout';
import { useAppSelector } from '../../../redux/store';
import { useActivityParams } from '../../../hooks/useActivityParams';
import { navigateToActivityStep } from '../../../utils/navigationUtils';
import { bookingOptionApi, AvailabilityPricingMode } from '../../../api/bookingOption';
import { appConfig } from '../../../config/appConfig';

interface ScheduleData {
  scheduleName: string;
  startDate: string;
  hasEndDate: boolean;
  endDate: string;
  weeklySchedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  timeSlots: {
    [key: string]: Array<{
      id: string;
      hour: string;
      minute: string;
      endHour?: string;
      endMinute?: string;
    }>;
  };
  exceptions: Array<{
    date: string;
    description: string;
  }>;
}

interface AgeGroup {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
}


export default function StepOptionAvailabilityPricingDepartureTime() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Obtener parámetros de URL
  const { activityId, lang, currency } = useActivityParams();
  
  // Get current step from URL params, default to step 1 (Horario)
  const currentStep = parseInt(searchParams.get('step') || '1');
  
  const [formData, setFormData] = useState<ScheduleData>({
    scheduleName: '',
    startDate: '',
    hasEndDate: false,
    endDate: '',
    weeklySchedule: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    timeSlots: {},
    exceptions: []
  });

  // Estado para el modo de disponibilidad y precios
  const [availabilityPricingMode, setAvailabilityPricingMode] = useState<AvailabilityPricingMode | null>(null);
  const [isLoadingMode, setIsLoadingMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para los datos de la opción de reserva
  const [bookingOptionData, setBookingOptionData] = useState<any>(null);
  const [isLoadingBookingOption, setIsLoadingBookingOption] = useState(false);

  // Estado para el tipo de precios en step 2
  const [pricingType, setPricingType] = useState<'same' | 'ageBased'>('same');
  
  // Estado para grupos de edad
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([
    { id: '1', name: 'Infantes', minAge: 0, maxAge: 3 },
    { id: '2', name: 'Niños', minAge: 4, maxAge: 12 },
    { id: '3', name: 'Adultos', minAge: 13, maxAge: 64 },
    { id: '4', name: 'Adulto mayor', minAge: 65, maxAge: 99 }
  ]);

  // Estado para la capacidad (step 3)
  const [capacityData, setCapacityData] = useState({
    minParticipants: 1,
    maxParticipants: 1
  });

  // Estado para la capacidad obtenida de la API
  const [apiCapacity, setApiCapacity] = useState<{
    groupMinSize: number;
    groupMaxSize: number | null;
  } | null>(null);

  // Estado para los niveles de precios (step 4)
  const [pricingLevels, setPricingLevels] = useState<Array<{
    id: string;
    minPeople: number;
    maxPeople: number;
    clientPays: string;
    pricePerPerson: string;
  }>>([
    {
      id: '1',
      minPeople: 1,
      maxPeople: 1,
      clientPays: '',
      pricePerPerson: ''
    }
  ]);

  // Función helper para formatear fechas al formato esperado por la API Java
  const formatDateForAPI = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Asegurar que la fecha esté en formato YYYY-MM-DD
      // Si ya está en formato correcto, retornarla directamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Si no, convertirla
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      // Formato YYYY-MM-DD que es compatible con Java LocalDate
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error al formatear fecha:', dateString, error);
      return '';
    }
  };

  // Funciones para manejar grupos de edad
  const handleAddAgeGroup = () => {
    // Solo permitir agregar "Infante" o "Adulto mayor"
    const existingInfante = ageGroups.some(group => group.name === 'Infante');
    const existingAdultoMayor = ageGroups.some(group => group.name === 'Adulto mayor');
    
    if (!existingInfante) {
      // Agregar Infante al principio
      const newInfante: AgeGroup = {
        id: Date.now().toString(),
        name: 'Infante',
        minAge: 0,
        maxAge: 0
      };
      
      setAgeGroups(prev => {
        const updatedGroups = [newInfante, ...prev];
        const connectedGroups = connectAgeRanges(updatedGroups);
        return ensureProtectedGroupNames(connectedGroups);
      });
    } else if (!existingAdultoMayor) {
      // Agregar Adulto mayor al final
      const newAdultoMayor: AgeGroup = {
        id: (Date.now() + 1).toString(),
        name: 'Adulto mayor',
        minAge: 0,
        maxAge: 0
      };
      
      setAgeGroups(prev => {
        const updatedGroups = [...prev, newAdultoMayor];
        const connectedGroups = connectAgeRanges(updatedGroups);
        return ensureProtectedGroupNames(connectedGroups);
      });
    } else {
      // Ambos grupos ya existen
      alert('Ya existen los grupos "Infante" y "Adulto mayor". No se pueden agregar más grupos.');
    }
  };

  const handleRemoveAgeGroup = (groupId: string) => {
    // Verificar si el grupo está protegido
    const groupToRemove = ageGroups.find(group => group.id === groupId);
    if (groupToRemove && (groupToRemove.name === 'Niños' || groupToRemove.name === 'Adultos')) {
      alert('No se puede eliminar el grupo "Niños" o "Adultos". Estos grupos son obligatorios.');
      return;
    }
    
    if (ageGroups.length > 1) {
      setAgeGroups(prev => {
        const updatedGroups = prev.filter(group => group.id !== groupId);
        const connectedGroups = connectAgeRanges(updatedGroups);
        return ensureProtectedGroupNames(connectedGroups);
      });
    }
  };



  // Función para conectar automáticamente los rangos de edad
  const connectAgeRanges = (groups: AgeGroup[]): AgeGroup[] => {
    // Ordenar grupos según el orden específico: Infante → Niños → Adultos → Adulto mayor
    const sortedGroups = [...groups].sort((a, b) => {
      const orderMap: { [key: string]: number } = {
        'Infante': 0,
        'Niños': 1,
        'Adultos': 2,
        'Adulto mayor': 3
      };
      
      const orderA = orderMap[a.name] ?? 999;
      const orderB = orderMap[b.name] ?? 999;
      
      return orderA - orderB;
    });
    
    // Conectar solo las edades mínimas basándose en las edades máximas del grupo anterior
    for (let i = 0; i < sortedGroups.length; i++) {
      const currentGroup = sortedGroups[i];
      
      if (i === 0) {
        // El primer grupo siempre empieza en 0
        currentGroup.minAge = 0;
      } else {
        // Los demás grupos empiezan en la edad máxima del grupo anterior + 1
        const previousGroup = sortedGroups[i - 1];
        currentGroup.minAge = previousGroup.maxAge + 1;
      }
      
      // NO ajustar la edad máxima del usuario - mantener exactamente lo que editó
      // Solo conectar las edades mínimas
    }
    
    return sortedGroups;
  };

  // Función para asegurar que los grupos protegidos mantengan sus nombres
  const ensureProtectedGroupNames = (groups: AgeGroup[]): AgeGroup[] => {
    return groups.map(group => {
      // Si es el grupo con edad 4-12, asegurar que se llame "Niños"
      if (group.minAge === 4 && group.maxAge === 12) {
        return { ...group, name: 'Niños' };
      }
      // Si es el grupo con edad 13-64, asegurar que se llame "Adultos"
      if (group.minAge === 13 && group.maxAge === 64) {
        return { ...group, name: 'Adultos' };
      }
      return group;
    });
  };

  // Función para ajustar manualmente un rango de edad
  const handleManualAgeRangeChange = (groupId: string, field: 'minAge' | 'maxAge', value: number) => {
    // Solo permitir editar la edad máxima
    if (field === 'minAge') {
      return; // No permitir edición de edad mínima
    }
    
    // Validar que el valor sea un número válido
    if (isNaN(value) || value < 0 || value > 99) {
      return;
    }
    
    setAgeGroups(prev => {
      // Encontrar el grupo a editar
      const groupIndex = prev.findIndex(group => group.id === groupId);
      if (groupIndex === -1) {
        return prev;
      }
      
      // Crear una copia del array
      const newGroups = [...prev];
      
      // Actualizar solo la edad máxima del grupo específico
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        maxAge: value
      };
      
      // Aplicar conexión automática solo a las edades mínimas
      const connectedGroups = connectAgeRanges(newGroups);
      
      // Aplicar protección de nombres
      const finalGroups = ensureProtectedGroupNames(connectedGroups);
      
      return finalGroups;
    });
  };

  const optionId = searchParams.get('optionId');
  const storageKey = `schedule_${optionId || 'default'}`;

  // Función para obtener los datos de la opción de reserva
  const fetchBookingOptionData = async () => {
    if (!optionId || !activityId) return;
    
    setIsLoadingBookingOption(true);
    try {
      const response = await bookingOptionApi.searchBookingOptionById(
        activityId, 
        optionId, 
        lang || 'es', 
        currency || 'USD'
      );
      
      if (response.success && response.data) {
        setBookingOptionData(response.data);
        
        // Cargar datos básicos del horario si están disponibles
        const scheduleData: Partial<ScheduleData> = {};
        
        // Cargar nombre del horario y fechas desde los schedules si están disponibles
        if (response.data.schedules && response.data.schedules.length > 0) {
          // Usar el título del primer schedule como nombre del horario
          const firstSchedule = response.data.schedules[0];
          if (firstSchedule.title) {
            scheduleData.scheduleName = firstSchedule.title;
          }
          
          // Cargar fechas de inicio y fin si están disponibles
          if (firstSchedule.seasonStartDate) {
            scheduleData.startDate = firstSchedule.seasonStartDate;
          }
          
          if (firstSchedule.seasonEndDate) {
            scheduleData.hasEndDate = true;
            scheduleData.endDate = firstSchedule.seasonEndDate;
          }
        }
        
        // Si no hay schedules pero hay otros datos de la opción de reserva, 
        // intentar cargar información básica desde la opción de reserva
        if (!scheduleData.scheduleName) {
          scheduleData.scheduleName = "";
        }
        
        // Actualizar el estado con los datos básicos cargados
        if (Object.keys(scheduleData).length > 0) {
          setFormData(prev => ({
            ...prev,
            ...scheduleData
          }));
        }
        
        // Cargar horarios semanales desde los datos de la opción de reserva
        if (response.data.schedules && response.data.schedules.length > 0) {
          const weeklySchedule: { [key: string]: Array<{ id: string; hour: string; minute: string; endHour?: string; endMinute?: string }> } = {};
          
          // Inicializar todos los días
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
            weeklySchedule[day] = [];
          });
          
          // Procesar los horarios existentes
          response.data.schedules.forEach((schedule: any, index: number) => {
            const dayMap: { [key: number]: string } = {
              0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday',
              4: 'friday', 5: 'saturday', 6: 'sunday'
            };
            
            const dayKey = dayMap[schedule.dayOfWeek];
            if (dayKey && schedule.isActive) {
              const [startHour, startMinute] = schedule.startTime.split(':');
              const timeSlot: {
                id: string;
                hour: string;
                minute: string;
                endHour?: string;
                endMinute?: string;
              } = {
                id: `existing_${schedule.id}`,
                hour: startHour,
                minute: startMinute
              };
              
              // Si hay hora de fin, agregarla
              if (schedule.endTime) {
                const [endHour, endMinute] = schedule.endTime.split(':');
                timeSlot.endHour = endHour;
                timeSlot.endMinute = endMinute;
              }
              
              weeklySchedule[dayKey].push(timeSlot);
            }
          });
          
          // Actualizar el estado con los horarios cargados
          setFormData(prev => ({
            ...prev,
            timeSlots: weeklySchedule
          }));
        }
        
        // Cargar excepciones de horarios si existen
        if (response.data.scheduleExceptions && response.data.scheduleExceptions.length > 0) {
          const loadedExceptions = response.data.scheduleExceptions.map((exception: any) => ({
            date: exception.date || '',
            description: exception.reason || ''
          }));
          
          setFormData(prev => ({
            ...prev,
            exceptions: loadedExceptions
          }));
        }
        
        // Cargar datos de capacidad desde la opción de reserva
        if (response.data.groupMinSize !== undefined) {
          setCapacityData(prev => ({
            ...prev,
            minParticipants: response.data.groupMinSize,
            maxParticipants: response.data.groupMaxSize || response.data.groupMinSize
          }));
        }

        // Cargar priceTiers existentes si pricingMode es PER_PERSON
        if (response.data.priceTiers && response.data.priceTiers.length > 0 && currentStep === 4) {
          const existingPriceTiers = response.data.priceTiers.map((tier: any, index: number) => ({
            id: tier.id?.toString() || Date.now().toString() + index,
            minPeople: tier.minParticipants || 1,
            maxPeople: tier.maxParticipants || -1,
            clientPays: tier.totalPrice?.toString() || '',
            pricePerPerson: tier.pricePerParticipant?.toString() || ''
          }));
          
          if (existingPriceTiers.length > 0) {
            setPricingLevels(existingPriceTiers);
          }
        }
      } else {
        console.error('Error al obtener datos de la opción de reserva:', response.message);
      }
    } catch (error) {
      console.error('Error al obtener datos de la opción de reserva:', error);
    } finally {
      setIsLoadingBookingOption(false);
    }
  };

  // Función para obtener el modo de disponibilidad y precios
  const fetchAvailabilityPricingMode = async () => {
    if (!optionId) return;
    
    setIsLoadingMode(true);
    try {
      const response = await bookingOptionApi.getAvailabilityPricingMode(optionId);
      
      if ('success' in response && response.success === false) {
        // Es un error de la API
        console.error('Error al obtener modo de disponibilidad:', response.message);
        // Mantener el modo por defecto (TIME_SLOTS)
        setAvailabilityPricingMode({
          availabilityMode: 'TIME_SLOTS',
          pricingMode: 'PER_PERSON'
        });
      } else {
        // Es una respuesta exitosa
        setAvailabilityPricingMode(response as AvailabilityPricingMode);
      }
    } catch (error) {
      console.error('Error al obtener modo de disponibilidad:', error);
      // En caso de error, usar modo por defecto
      setAvailabilityPricingMode({
        availabilityMode: 'TIME_SLOTS',
        pricingMode: 'PER_PERSON'
      });
    } finally {
      setIsLoadingMode(false);
    }
  };

  // Funciones para manejar niveles de precios (step 4)
  const handleAddPricingLevel = () => {
    const capacity = apiCapacity || getCapacityFromBookingOption();
    if (!capacity) return;
    
    // Si groupMaxSize es null (ilimitado), comportamiento especial - se pueden agregar todos los rangos que se requieran
    if (capacity.groupMaxSize === null) {
      setPricingLevels(prev => {
        const updatedLevels = [...prev];
        
        // Convertir la fila actual que dice "Ilimitado" en un input editable
        const currentLevel = updatedLevels[updatedLevels.length - 1];
        if (currentLevel.maxPeople === -1) {
          // La fila actual era "Ilimitado", ahora le damos un valor específico
          // Calcular el rango de 10 en 10 desde el mínimo actual
          const rangeSize = 10;
          currentLevel.maxPeople = currentLevel.minPeople + rangeSize - 1;
        }
        
        // Calcular el nuevo rango mínimo para la nueva fila (de 10 en 10)
        const rangeSize = 10;
        const newMinPeople = currentLevel.maxPeople + 1;
        
        // Validar que el nuevo mínimo esté dentro del rango válido
        if (newMinPeople < capacity.groupMinSize) {
          alert(`No se puede agregar más rangos. El mínimo debe ser al menos ${capacity.groupMinSize} participantes (según la configuración de la opción de reserva).`);
          return prev;
        }
        
        // Calcular el nuevo rango máximo (de 10 en 10, pero editable)
        const newMaxPeople = newMinPeople + rangeSize - 1;
        
        // Añadir el nuevo nivel con rango de 10 en 10 (editable)
        const newLevel = {
          id: Date.now().toString(),
          minPeople: newMinPeople,
          maxPeople: newMaxPeople, // Rango de 10 en 10, pero editable
          clientPays: '',
          pricePerPerson: ''
        };
        
        // Actualizar la fila anterior para que no sea "Ilimitado" si no es la última
        return [...updatedLevels, newLevel];
      });
    } else {
      // Si hay límite específico, verificar si ya se cubre todo el rango
      const lastLevel = pricingLevels[pricingLevels.length - 1];
      const newMinPeople = lastLevel.maxPeople + 1;
      
      // Verificar si ya se cubre todo el rango desde groupMinSize hasta groupMaxSize
      const allRangesCovered = pricingLevels.some(level => {
        return level.minPeople <= capacity.groupMinSize && 
               (level.maxPeople === -1 || level.maxPeople >= capacity.groupMaxSize);
      });
      
      // Si ya se cubre todo el rango, no permitir agregar más rangos
      if (allRangesCovered) {
        alert(`No se puede agregar más rangos. Ya se cubre todo el rango desde ${capacity.groupMinSize} hasta ${capacity.groupMaxSize} participantes.`);
        return;
      }
      
      // Verificar que no exceda el límite máximo
      if (newMinPeople > capacity.groupMaxSize) {
        alert(`No se puede agregar más rangos. El límite máximo es ${capacity.groupMaxSize} participantes (según la configuración de la opción de reserva).`);
        return;
      }
      
      // Validar que el nuevo mínimo esté dentro del rango válido
      if (newMinPeople < capacity.groupMinSize) {
        alert(`No se puede agregar más rangos. El mínimo debe ser al menos ${capacity.groupMinSize} participantes (según la configuración de la opción de reserva).`);
        return;
      }
      
      const newLevel = {
        id: Date.now().toString(),
        minPeople: newMinPeople,
        maxPeople: capacity.groupMaxSize || newMinPeople + 9, // Por defecto usar groupMaxSize si está disponible
        clientPays: '',
        pricePerPerson: ''
      };
      
      setPricingLevels(prev => [...prev, newLevel]);
    }
  };

  const handleRemovePricingLevel = (levelId: string) => {
    if (pricingLevels.length > 1) {
      setPricingLevels(prev => {
        const capacity = apiCapacity || getCapacityFromBookingOption();
        const filteredLevels = prev.filter(level => level.id !== levelId);
        
        // Reconectar rangos después de eliminar
        const connectedLevels = connectPricingRanges(filteredLevels);
        
        // Actualizar el último rango para que tenga el límite máximo
        if (connectedLevels.length > 0 && capacity) {
          const lastIndex = connectedLevels.length - 1;
          const lastLevel = connectedLevels[lastIndex];
          
          // Si groupMaxSize es null (ilimitado), el último rango debe ser "Ilimitado"
          if (capacity.groupMaxSize === null) {
            lastLevel.maxPeople = -1; // -1 para indicar "Ilimitado"
          } else {
            // Si groupMaxSize tiene un valor específico, el último rango debe llegar hasta ese valor
            lastLevel.maxPeople = capacity.groupMaxSize;
          }
        }
        
        return connectedLevels;
      });
    }
  };

  const handlePricingLevelChange = (levelId: string, field: 'minPeople' | 'maxPeople' | 'clientPays', value: string | number) => {
    const capacity = apiCapacity || getCapacityFromBookingOption();
    
    setPricingLevels(prev => {
      const updatedLevels = prev.map(level => 
        level.id === levelId ? { ...level, [field]: value } : level
      );
      
      // Validar que los valores estén dentro del rango permitido
      if (field === 'minPeople' || field === 'maxPeople') {
        const level = updatedLevels.find(l => l.id === levelId);
        if (level && capacity) {
          // Validar que minPeople no sea menor que groupMinSize
          if (field === 'minPeople' && level.minPeople < capacity.groupMinSize) {
            level.minPeople = capacity.groupMinSize;
            alert(`El mínimo de participantes debe ser al menos ${capacity.groupMinSize} (según la configuración de la opción de reserva)`);
          }
          
          // Validar que maxPeople no exceda groupMaxSize (si no es ilimitado)
          if (field === 'maxPeople' && capacity.groupMaxSize && level.maxPeople > capacity.groupMaxSize) {
            level.maxPeople = capacity.groupMaxSize;
            alert(`El máximo de participantes no puede exceder ${capacity.groupMaxSize} (según la configuración de la opción de reserva)`);
          }
          
          // Validar que minPeople no sea mayor que maxPeople
          if (level.minPeople > level.maxPeople && level.maxPeople !== -1) {
            level.maxPeople = level.minPeople;
          }
          
          // Validar que minPeople esté dentro del rango válido
          if (field === 'minPeople' && level.minPeople < capacity.groupMinSize) {
            level.minPeople = capacity.groupMinSize;
          }
          
          // Validar que maxPeople esté dentro del rango válido (si no es ilimitado)
          if (field === 'maxPeople' && capacity.groupMaxSize && level.maxPeople > capacity.groupMaxSize && level.maxPeople !== -1) {
            level.maxPeople = capacity.groupMaxSize;
          }
        }
      }
      
      // Si se cambió el precio que paga el cliente, calcular el precio por participante
      if (field === 'clientPays') {
        const level = updatedLevels.find(l => l.id === levelId);
        if (level && level.clientPays) {
          // Limpiar el valor de cualquier currency que el usuario haya incluido
          let cleanValue = level.clientPays;
          const currencyRegex = /\s*(USD|EUR|PEN|COP|MXN|ARS|CLP|BRL|GBP|JPY|CAD|AUD|CHF|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|RUB|TRY|INR|CNY|KRW|SGD|HKD|NZD|THB|MYR|IDR|PHP|VND|BDT|PKR|LKR|KHR|MMK|LAK|MNT|KZT|UZS|TJS|TMT|AZN|GEL|AMD|BYN|MDL|UAH|BAM|RSD|MKD|ALL|XOF|XAF|XCD|ANG|AWG|BBD|BMD|BZD|CUC|CUP|DOP|EGP|FJD|GHS|GTQ|HNL|JMD|KES|LSL|MAD|MUR|NAD|NGN|PAB|PGK|PYG|QAR|SBD|SCR|SLL|SOS|SRD|STD|SYP|TND|TTD|TWD|TZS|UGX|UYU|VEF|VUV|WST|XPF|YER|ZAR|ZMW)\s*$/i;
          
          if (currencyRegex.test(cleanValue)) {
            cleanValue = cleanValue.replace(currencyRegex, '').trim();
            level.clientPays = cleanValue;
          }
          
          level.pricePerPerson = calculatePricePerPerson(cleanValue);
        }
      }
      
      // Si se cambió el número máximo de personas, recalcular el precio por participante
      if (field === 'maxPeople' && levelId) {
        const level = updatedLevels.find(l => l.id === levelId);
        if (level && level.clientPays && level.maxPeople !== -1) {
          level.pricePerPerson = calculatePricePerPerson(level.clientPays);
        }
      }
      
      // Reconectar los rangos de personas automáticamente
      return connectPricingRanges(updatedLevels);
    });
  };

  // Función helper para calcular el precio por participante
  const calculatePricePerPerson = (clientPays: string): string => {
    // Limpiar el valor de cualquier currency que el usuario haya incluido
    let cleanValue = clientPays;
    const currencyRegex = /\s*(USD|EUR|PEN|COP|MXN|ARS|CLP|BRL|GBP|JPY|CAD|AUD|CHF|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|RUB|TRY|INR|CNY|KRW|SGD|HKD|NZD|THB|MYR|IDR|PHP|VND|BDT|PKR|LKR|KHR|MMK|LAK|MNT|KZT|UZS|TJS|TMT|AZN|GEL|AMD|BYN|MDL|UAH|BAM|RSD|MKD|ALL|XOF|XAF|XCD|ANG|AWG|BBD|BMD|BZD|CUC|CUP|DOP|EGP|FJD|GHS|GTQ|HNL|JMD|KES|LSL|MAD|MUR|NAD|NGN|PAB|PGK|PYG|QAR|SBD|SCR|SLL|SOS|SRD|STD|SYP|TND|TTD|TWD|TZS|UGX|UYU|VEF|VUV|WST|XPF|YER|ZAR|ZMW)\s*$/i;
    
    if (currencyRegex.test(cleanValue)) {
      cleanValue = cleanValue.replace(currencyRegex, '').trim();
    }
    
    const clientPaysNum = parseFloat(cleanValue);
    if (isNaN(clientPaysNum)) return '';
    
    // Fórmula: Precio por participante = Cliente paga - (Cliente paga × Comisión %)
    const commissionPercentage = appConfig.pricing.defaultCommissionPercentage;
    const commissionAmount = (clientPaysNum * commissionPercentage) / 100;
    const pricePerPerson = clientPaysNum - commissionAmount;
    
    return pricePerPerson.toFixed(2);
  };

  // Función para conectar automáticamente los rangos de precios
  const connectPricingRanges = (levels: typeof pricingLevels): typeof pricingLevels => {
    const capacity = apiCapacity || getCapacityFromBookingOption();
    if (!capacity) return levels;
    
    const sortedLevels = [...levels].sort((a, b) => a.minPeople - b.minPeople);
    
    for (let i = 0; i < sortedLevels.length; i++) {
      const currentLevel = sortedLevels[i];
      
      if (i === 0) {
        // El primer nivel siempre empieza en el groupMinSize
        currentLevel.minPeople = capacity.groupMinSize;
      } else {
        // Los siguientes niveles empiezan donde terminó el anterior
        const previousLevel = sortedLevels[i - 1];
        // Solo conectar si el nivel anterior no es "ilimitado"
        if (previousLevel.maxPeople !== -1) {
          currentLevel.minPeople = previousLevel.maxPeople + 1;
        } else {
          // Si el nivel anterior es "ilimitado", empezar desde su minPeople + 1
          currentLevel.minPeople = previousLevel.minPeople + 1;
        }
      }
      
      // Validar que el mínimo no sea menor que groupMinSize
      if (currentLevel.minPeople < capacity.groupMinSize) {
        currentLevel.minPeople = capacity.groupMinSize;
      }
      
      // Validar que el máximo no exceda groupMaxSize (si no es ilimitado)
      if (currentLevel.maxPeople !== -1 && capacity.groupMaxSize && currentLevel.maxPeople > capacity.groupMaxSize) {
        currentLevel.maxPeople = capacity.groupMaxSize;
      }
    }
    
    // Si groupMaxSize es null, mantener rangos de 10 en 10 editables, excepto el último que puede ser "ilimitado"
    if (capacity.groupMaxSize === null && sortedLevels.length > 0) {
      // Todas las filas deben tener rangos editables de 10 en 10, excepto la última que puede ser "ilimitado"
      for (let i = 0; i < sortedLevels.length; i++) {
        if (sortedLevels[i].maxPeople === -1) {
          // Si alguna fila es "ilimitado", darle un rango editable de 10 en 10
          const rangeSize = 10;
          sortedLevels[i] = {
            ...sortedLevels[i],
            maxPeople: sortedLevels[i].minPeople + rangeSize - 1
          };
        } else if (sortedLevels[i].maxPeople === sortedLevels[i].minPeople) {
          // Si el valor inicial es igual al mínimo, darle un rango de 10 en 10
          const rangeSize = 10;
          sortedLevels[i] = {
            ...sortedLevels[i],
            maxPeople: sortedLevels[i].minPeople + rangeSize - 1
          };
        }
      }
      
      // Solo la última fila puede ser "ilimitado" cuando groupMaxSize es null
      const lastIndex = sortedLevels.length - 1;
      if (lastIndex >= 0) {
        sortedLevels[lastIndex] = {
          ...sortedLevels[lastIndex],
          maxPeople: -1 // Marcar como "ilimitado"
        };
      }
    }
    
    return sortedLevels;
  };

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error('StepOptionAvailabilityPricingDepartureTime: Error al cargar datos desde localStorage:', error);
      }
    }
    
    // Cargar configuración de precios guardada
    const savedPricingType = localStorage.getItem(`${storageKey}_pricingType`);
    if (savedPricingType) {
      setPricingType(savedPricingType as 'same' | 'ageBased');
    }
    
    // Cargar grupos de edad guardados
    const savedAgeGroups = localStorage.getItem(`${storageKey}_ageGroups`);
    if (savedAgeGroups) {
      try {
        const parsedAgeGroups = JSON.parse(savedAgeGroups);
        setAgeGroups(parsedAgeGroups);
      } catch (error) {
        console.error('Error al cargar grupos de edad desde localStorage:', error);
      }
    }
  }, [storageKey]);

  // Obtener el modo de disponibilidad y datos de la opción de reserva al inicializar
  useEffect(() => {
    fetchAvailabilityPricingMode();
    fetchBookingOptionData();
  }, [optionId, activityId]);

  // Obtener la capacidad cuando se esté en el step 4 y pricingMode == PER_PERSON
  useEffect(() => {
    if (currentStep === 4 && optionId && availabilityPricingMode?.pricingMode === 'PER_PERSON') {
      fetchAvailabilityPricingCapacity();
    }
  }, [currentStep, optionId, availabilityPricingMode?.pricingMode]);

  // Inicializar niveles de precios cuando se cargue la capacidad
  useEffect(() => {
    const capacity = apiCapacity || getCapacityFromBookingOption();
    
    if (capacity && pricingLevels.length === 1) {
      // Actualizar el primer nivel con los valores de capacidad
      setPricingLevels(prev => {
        const updatedLevels = [...prev];
        updatedLevels[0] = {
          ...updatedLevels[0],
          minPeople: capacity.groupMinSize,
          maxPeople: capacity.groupMaxSize === null ? 
            capacity.groupMinSize + 9 : // Rango de 10 en 10 cuando es ilimitado
            capacity.groupMaxSize // Usar groupMaxSize cuando tiene límite
        };
        return updatedLevels;
      });
    }
  }, [apiCapacity, bookingOptionData]);

  // Cargar priceTiers existentes cuando se entre al paso 4 con pricingMode PER_PERSON
  useEffect(() => {
    if (currentStep === 4 && availabilityPricingMode?.pricingMode === 'PER_PERSON' && bookingOptionData?.priceTiers) {
      const existingPriceTiers = bookingOptionData.priceTiers.map((tier: any, index: number) => ({
        id: tier.id?.toString() || Date.now().toString() + index,
        minPeople: tier.minParticipants || 1,
        maxPeople: tier.maxParticipants || -1,
        clientPays: tier.totalPrice?.toString() || '',
        pricePerPerson: tier.pricePerParticipant?.toString() || ''
      }));
      
      if (existingPriceTiers.length > 0) {
        setPricingLevels(existingPriceTiers);
      }
    }
  }, [currentStep, availabilityPricingMode?.pricingMode, bookingOptionData]);

  // Función para obtener la capacidad de la API
  const fetchAvailabilityPricingCapacity = async () => {
    if (!optionId) return;
    
    try {
      const response = await bookingOptionApi.getAvailabilityPricingCapacity(optionId);
      
      if ('success' in response && response.success === false) {
        // Es un error de la API
        console.error('Error al obtener capacidad:', response.message);
        setApiCapacity(null);
      } else {
        // Es una respuesta exitosa
        setApiCapacity(response as any);
      }
    } catch (error) {
      console.error('Error al obtener capacidad:', error);
      setApiCapacity(null);
    }
  };

  // Función para obtener la capacidad desde los datos de la opción de reserva
  const getCapacityFromBookingOption = () => {
    if (bookingOptionData) {
      return {
        groupMinSize: bookingOptionData.groupMinSize || 1,
        groupMaxSize: bookingOptionData.groupMaxSize
      };
    }
    return null;
  };

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, storageKey]);

  const handleSaveAndContinue = async () => {
    // Si estamos en el step 1, consumir la API antes de continuar
    if (currentStep === 1) {
      try {
        // Verificar que activityId esté disponible
        if (!activityId) {
          alert('Error: No se encontró información de la actividad');
          return;
        }

        // Validar que se haya ingresado un nombre para el horario
        if (!formData.scheduleName.trim()) {
          alert('Error: Debe ingresar un nombre para el horario');
          return;
        }

        // Validar que se haya seleccionado una fecha de inicio
        if (!formData.startDate) {
          alert('Error: Debe seleccionar una fecha de inicio');
          return;
        }

        // Validar que la fecha de inicio sea válida
        if (isNaN(new Date(formData.startDate).getTime())) {
          alert('Error: La fecha de inicio no es válida');
          return;
        }

        // Validar que la fecha de fin sea válida si está configurada
        if (formData.hasEndDate && formData.endDate && isNaN(new Date(formData.endDate).getTime())) {
          alert('Error: La fecha de fin no es válida');
          return;
        }

        // Validar que las fechas se puedan formatear correctamente
        const formattedStartDate = formatDateForAPI(formData.startDate);
        if (!formattedStartDate) {
          alert('Error: La fecha de inicio no se puede procesar correctamente');
          return;
        }

        // Validar que la fecha de inicio tenga el formato correcto
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedStartDate)) {
          alert('Error: El formato de la fecha de inicio no es válido');
          return;
        }

        if (formData.hasEndDate && formData.endDate) {
          const formattedEndDate = formatDateForAPI(formData.endDate);
          if (!formattedEndDate) {
            alert('Error: La fecha de fin no se puede procesar correctamente');
            return;
          }
          
          // Validar que la fecha de fin tenga el formato correcto
          if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedEndDate)) {
            alert('Error: El formato de la fecha de fin no es válido');
            return;
          }
        }

        // Validar que se haya configurado al menos un horario semanal
        const hasTimeSlots = Object.values(formData.timeSlots).some(slots => slots.length > 0);
        if (!hasTimeSlots) {
          alert('Error: Debe configurar al menos un horario semanal');
          return;
        }

        // Validar rangos de horarios para OPENING_HOURS
        if (availabilityPricingMode?.availabilityMode === 'OPENING_HOURS') {
          for (const [day, slots] of Object.entries(formData.timeSlots)) {
            for (const slot of slots) {
              if (slot.endHour && slot.endMinute) {
                const startTime = `${slot.hour}:${slot.minute}`;
                const endTime = `${slot.endHour}:${slot.endMinute}`;
                
                if (startTime === endTime) {
                  alert(`Error: En ${day}, el horario de inicio y fin no pueden ser iguales (${startTime})`);
                  return;
                }
              }
            }
          }
        }

        // Validar que las excepciones tengan fechas válidas
        for (let i = 0; i < formData.exceptions.length; i++) {
          const exception = formData.exceptions[i];
          if (exception.date && exception.date.trim()) {
            const formattedExceptionDate = formatDateForAPI(exception.date);
            if (!formattedExceptionDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedExceptionDate)) {
              alert(`Error: La fecha de la excepción ${i + 1} no es válida`);
              return;
            }
          }
        }

        // Activar estado de carga
        setIsSaving(true);

        // Preparar los datos para la API createAvailabilityPricingDepartureTime
        const requestData = {
          activityId: activityId,
          bookingOptionId: optionId || '',
          title: formData.scheduleName,
          lang: lang || 'es',
          startDate: formattedStartDate,
          endDate: formData.hasEndDate && formData.endDate ? formatDateForAPI(formData.endDate) : undefined,
          weeklySchedule: Object.entries(formData.timeSlots).flatMap(([day, slots]) => {
            if (slots.length === 0) return [];
            
            return slots.map(slot => {
              const dayMap: { [key: string]: number } = {
                'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                'friday': 4, 'saturday': 5, 'sunday': 6
              };
              
              const scheduleItem: any = {
                dayOfWeek: dayMap[day] || 0,
                startTime: `${slot.hour}:${slot.minute}`
              };
              
              // Para OPENING_HOURS, incluir endTime si está disponible
              if (availabilityPricingMode?.availabilityMode === 'OPENING_HOURS' && slot.endHour && slot.endMinute) {
                scheduleItem.endTime = `${slot.endHour}:${slot.endMinute}`;
              }
              
              return scheduleItem;
            });
          }),
          exceptions: formData.exceptions
            .filter(exception => exception.date && exception.date.trim() && exception.description && exception.description.trim())
            .map(exception => ({
              date: formatDateForAPI(exception.date),
              description: exception.description
            }))
        };
        
        // Validación final: asegurar que no se envíen fechas vacías
        if (!requestData.startDate || requestData.startDate.trim() === '') {
          alert('Error: La fecha de inicio no puede estar vacía');
          return;
        }
        
        // Consumir la API correcta
        const response = await bookingOptionApi.createAvailabilityPricingDepartureTime(requestData);
        
        if (response.success) {
          // Recargar la página con step=2
          window.location.href = `/extranet/activity/availabilityPricing/create?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&step=2`;
          return;
        } else {
          console.error('StepOptionAvailabilityPricingDepartureTime: Error en la API:', response.message);
          // Mostrar error al usuario
          alert(`Error al guardar: ${response.message}`);
          return;
        }
      } catch (error) {
        console.error('StepOptionAvailabilityPricingDepartureTime: Error al consumir la API:', error);
        alert('Error de conexión al guardar los datos');
      } finally {
        // Desactivar estado de carga
        setIsSaving(false);
      }
    }
    
    // Si estamos en el step 2 y pricingMode = PER_PERSON
    if (currentStep === 2 && availabilityPricingMode?.pricingMode === 'PER_PERSON') {
      // Validar que se haya seleccionado un tipo de precio
      if (!pricingType) {
        alert('Error: Debe seleccionar un tipo de precio');
        return;
      }
      
      // Si se selecciona "El precio es igual para todos", continuar al step 3
      if (pricingType === 'same') {
        // Guardar la selección en localStorage
        localStorage.setItem(`${storageKey}_pricingType`, pricingType);
        
        // Navegar al step 3
        navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&step=3`, {
          activityId,
          lang,
          currency,
          currentStep
        });
        return;
      }
      
      // Si se selecciona "El precio depende de la edad", mostrar la interfaz de grupos de edad
      // (ya está implementada en el render)
    }
    
    // Si estamos en el step 3 y pricingMode = PER_PERSON
    if (currentStep === 3 && availabilityPricingMode?.pricingMode === 'PER_PERSON') {
      try {
        // Validar que se haya configurado la capacidad
        if (capacityData.minParticipants < 1) {
          alert('Error: El número mínimo de participantes debe ser al menos 1');
          return;
        }
        
        if (capacityData.maxParticipants < capacityData.minParticipants) {
          alert('Error: El número máximo de participantes debe ser mayor o igual al mínimo');
          return;
        }
        
        // Activar estado de carga
        setIsSaving(true);
        
        // Preparar los datos para la API createAvailabilityPricingCapacity
        const requestData = {
          activityId: activityId || '',
          bookingOptionId: optionId || '',
          groupMinSize: capacityData.minParticipants
        };
        
        // Consumir la API createAvailabilityPricingCapacity
        const response = await bookingOptionApi.createAvailabilityPricingCapacity(requestData);
        
        if (response.success) {
          // Mostrar mensaje de éxito temporal
          alert('¡Configuración de capacidad guardada exitosamente! Redirigiendo al siguiente paso...');
          
          // Navegar al step 4
          navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing/create?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&step=4`, {
            activityId,
            lang,
            currency,
            currentStep
          });
          return;
        } else {
          console.error('StepOptionAvailabilityPricingDepartureTime: Error al guardar capacidad:', response.message);
          alert(`Error al guardar la capacidad: ${response.message}`);
          return;
        }
      } catch (error) {
        console.error('StepOptionAvailabilityPricingDepartureTime: Error al consumir la API de capacidad:', error);
        alert('Error de conexión al guardar la capacidad');
      } finally {
        // Desactivar estado de carga
        setIsSaving(false);
      }
    }

    // Si estamos en el step 4 y pricingMode = PER_PERSON
    if (currentStep === 4 && availabilityPricingMode?.pricingMode === 'PER_PERSON') {
      try {
        const capacity = apiCapacity || getCapacityFromBookingOption();
        
        // Validar que haya al menos un nivel de precios configurado
        if (pricingLevels.length === 0) {
          alert('Error: Debe configurar al menos un nivel de precios');
          return;
        }

        // Validar que todos los niveles tengan precios configurados
        const invalidLevels = pricingLevels.filter(level => !level.clientPays || level.clientPays.trim() === '');
        if (invalidLevels.length > 0) {
          alert('Error: Todos los niveles de precios deben tener un precio configurado');
          return;
        }

        // Validar que todos los rangos estén dentro de los límites de la opción de reserva
        if (capacity) {
          const invalidRanges = pricingLevels.filter(level => {
            // Validar que el mínimo no sea menor que groupMinSize
            if (level.minPeople < capacity.groupMinSize) {
              return true;
            }
            // Validar que el máximo no exceda groupMaxSize (si no es ilimitado)
            if (level.maxPeople !== -1 && capacity.groupMaxSize && level.maxPeople > capacity.groupMaxSize) {
              return true;
            }
            return false;
          });
          
          if (invalidRanges.length > 0) {
            alert(`Error: Los rangos de precios deben estar entre ${capacity.groupMinSize} y ${capacity.groupMaxSize || 'ilimitado'} participantes (según la configuración de la opción de reserva)`);
            return;
          }
        }

        // Activar estado de carga
        setIsSaving(true);

        // Preparar los datos para la API createAvailabilityPricingPricePerPerson
        const requestData = {
          activityId: activityId || '',
          bookingOptionId: optionId || '',
          bookingPriceTiers: pricingLevels.map(level => ({
            minParticipants: level.minPeople,
            maxParticipants: level.maxPeople === -1 ? null : level.maxPeople,
            totalPrice: parseFloat(level.clientPays) || 0,
            commissionPercent: appConfig.pricing.defaultCommissionPercentage,
            pricePerParticipant: parseFloat(level.pricePerPerson) || 0,
            currency: (currency || 'USD').toUpperCase()
          }))
        };

        // Consumir la API createAvailabilityPricingPricePerPerson
        const response = await bookingOptionApi.createAvailabilityPricingPricePerPerson(requestData);

        if (response.success) {

          // Mostrar mensaje de éxito temporal
          alert('¡Configuración de precios guardada exitosamente! Redirigiendo...');

          // Redirigir a la página principal de availabilityPricing
          navigate(`/extranet/activity/availabilityPricing?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&currentStep=${currentStep}`);
          return;
        } else {
          console.error('StepOptionAvailabilityPricingDepartureTime: Error al guardar precios:', response.message);
          alert(`Error al guardar los precios: ${response.message}`);
          return;
        }
      } catch (error) {
        console.error('StepOptionAvailabilityPricingDepartureTime: Error al consumir la API de precios:', error);
        alert('Error de conexión al guardar los precios');
      } finally {
        // Desactivar estado de carga
        setIsSaving(false);
      }
    }
    
    // Para otros steps, navegar normalmente
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      navigate(`/extranet/activity/availabilityPricing?step=${nextStep}&optionId=${optionId}&lang=${lang}&currency=${currency}`);
    } else if (currentStep === 4) {
      // El step 4 ya se maneja arriba, no hacer nada aquí
      return;
    } else {
      // If we're at the last step, go back to the main availability pricing page
      navigate(`/extranet/activity/availabilityPricing?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&currentStep=9`);
    }
  };

  const handleBack = () => {
    // Navigate to previous step based on current step
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      navigate(`/extranet/activity/availabilityPricing?step=${prevStep}&optionId=${optionId}&lang=${lang}&currency=${currency}`);
    } else {
      // If we're at the first step, go back to the main availability pricing page
      navigate('/extranet/activity/availabilityPricing');
    }
  };

  const handleAddException = () => {
    setFormData(prev => ({
      ...prev,
      exceptions: [...prev.exceptions, { date: '', description: '' }]
    }));
  };

  const handleRemoveException = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exceptions: prev.exceptions.filter((_, i) => i !== index)
    }));
  };

  const handleExceptionChange = (index: number, field: 'date' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      exceptions: prev.exceptions.map((exception, i) => 
        i === index ? { ...exception, [field]: value } : exception
      )
    }));
  };

  // Time slot management functions
  const handleAddTimeSlot = (day: string) => {
    const newTimeSlot = {
      id: Date.now().toString(),
      hour: '08',
      minute: '00',
      // Para OPENING_HOURS, agregar campos de hora de fin
      ...(availabilityPricingMode?.availabilityMode === 'OPENING_HOURS' && {
        endHour: '17',
        endMinute: '00'
      })
    };
    
    setFormData(prev => ({
      ...prev,
      timeSlots: {
        ...prev.timeSlots,
        [day]: [...(prev.timeSlots[day] || []), newTimeSlot]
      }
    }));
  };

  const handleRemoveTimeSlot = (day: string, timeSlotId: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: {
        ...prev.timeSlots,
        [day]: (prev.timeSlots[day] || []).filter(slot => slot.id !== timeSlotId)
      }
    }));
  };

  const handleTimeSlotChange = (day: string, timeSlotId: string, field: 'hour' | 'minute' | 'endHour' | 'endMinute', value: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: {
        ...prev.timeSlots,
        [day]: (prev.timeSlots[day] || []).map(slot => 
          slot.id === timeSlotId ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  if (!optionId) {
    return (
      <OptionSetupLayout currentSection="availabilityPricing">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Cargando configuración del horario...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  if (!activityId) {
    return (
      <OptionSetupLayout currentSection="availabilityPricing">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="text-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <h6 className="alert-heading">Actividad no encontrada</h6>
                  <p className="mb-0">
                    {language === 'es' 
                      ? 'No se encontró información de la actividad. Por favor, regresa al paso anterior para continuar.'
                      : 'Activity information not found. Please go back to the previous step to continue.'
                    }
                  </p>
                  <hr />
                  <button 
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => navigate('/extranet/activity/createCategory')}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    {language === 'es' ? 'Ir a Categoría' : 'Go to Category'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  return (
    <OptionSetupLayout currentSection="availabilityPricing">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Step Navigation */}
                 <div className="mb-5">
                   <div className="d-flex align-items-center justify-content-between">
                     {/* Step 1: Horario */}
                     <div className="d-flex align-items-center">
                       <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep === 1 ? 'bg-primary text-white' : currentStep > 1 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>
                         {currentStep > 1 ? (
                           <i className="fas fa-check"></i>
                         ) : (
                           <span className="fw-bold">1</span>
                         )}
                       </div>
                       <div>
                         <span className={currentStep === 1 ? 'fw-bold text-dark' : currentStep > 1 ? 'fw-bold text-success' : 'text-muted'}>Horario</span>
                         {currentStep === 1 && <div className="bg-primary" style={{ height: '3px', width: '100%' }}></div>}
                       </div>
                     </div>

                     {/* Connector Line */}
                     <div className="flex-grow-1 mx-3" style={{ height: '2px', backgroundColor: currentStep > 1 ? '#28a745' : '#e9ecef' }}></div>

                     {/* Step 2: Categorías de precios */}
                     <div className="d-flex align-items-center">
                       <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep === 2 ? 'bg-primary text-white' : currentStep > 2 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>
                         {currentStep > 2 ? (
                           <i className="fas fa-check"></i>
                         ) : (
                           <span className="fw-bold">2</span>
                         )}
                       </div>
                       <div>
                         <span className={currentStep === 2 ? 'fw-bold text-dark' : currentStep > 2 ? 'fw-bold text-success' : 'text-muted'}>Categorías de precios</span>
                         {currentStep === 2 && <div className="bg-primary" style={{ height: '3px', width: '100%' }}></div>}
                       </div>
                     </div>

                     {/* Connector Line */}
                     <div className="flex-grow-1 mx-3" style={{ height: '2px', backgroundColor: currentStep > 2 ? '#28a745' : '#e9ecef' }}></div>

                     {/* Step 3: Capacidad */}
                     <div className="d-flex align-items-center">
                       <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep === 3 ? 'bg-primary text-white' : currentStep > 3 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>
                         {currentStep > 3 ? (
                           <i className="fas fa-check"></i>
                         ) : (
                           <span className="fw-bold">3</span>
                         )}
                       </div>
                       <div>
                         <span className={currentStep === 3 ? 'fw-bold text-dark' : currentStep > 3 ? 'fw-bold text-success' : 'text-muted'}>Capacidad</span>
                         {currentStep === 3 && <div className="bg-primary" style={{ height: '3px', width: '100%' }}></div>}
                       </div>
                     </div>

                     {/* Connector Line */}
                     <div className="flex-grow-1 mx-3" style={{ height: '2px', backgroundColor: currentStep > 3 ? '#28a745' : '#e9ecef' }}></div>

                     {/* Step 4: Precio */}
                     <div className="d-flex align-items-center">
                       <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep === 4 ? 'bg-primary text-white' : currentStep > 4 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>
                         {currentStep > 4 ? (
                           <i className="fas fa-check"></i>
                         ) : (
                           <span className="fw-bold">4</span>
                         )}
                       </div>
                       <div>
                         <span className={currentStep === 4 ? 'fw-bold text-dark' : currentStep > 4 ? 'fw-bold text-success' : 'text-muted'}>Precio</span>
                         {currentStep === 4 && <div className="bg-primary" style={{ height: '3px', width: '100%' }}></div>}
                       </div>
                     </div>


                   </div>
                 </div>

                  {/* Step Content - Conditional Display */}
                  {currentStep === 1 ? (
                    // Paso 1: Horario - Contenido completo
                    <div>
                      {/* Indicadores de carga */}
                      {(isLoadingMode || isLoadingBookingOption) && (
                        <div className="mb-4">
                          <div className="text-info">
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            {isLoadingBookingOption ? 'Cargando datos de la opción de reserva...' : 'Cargando configuración de horarios...'}
                          </div>
                        </div>
                      )}

                      {/* Información del modo de disponibilidad */}
                      {!isLoadingMode && availabilityPricingMode && (
                        <div className="mb-4">
                        <div className={`${availabilityPricingMode.availabilityMode === 'TIME_SLOTS' ? 'text-success' : 'text-warning'}`}>
                            <i className={`fas ${availabilityPricingMode.availabilityMode === 'TIME_SLOTS' ? 'fa-clock' : 'fa-door-open'} me-2`}></i>
                            <strong>Modo de horario:</strong> {
                              availabilityPricingMode.availabilityMode === 'TIME_SLOTS' 
                                ? 'Franjas horarias (TIME_SLOTS)' 
                                : 'Horario de apertura (OPENING_HOURS)'
                            }
                            {availabilityPricingMode.pricingMode && (
                              <span className="ms-2">
                                • <strong>Modo de precios:</strong> {
                                  availabilityPricingMode.pricingMode === 'PER_PERSON' 
                                    ? 'Por persona' 
                                    : 'Por grupo'
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Nombre del horario */}
                      <div className="mb-4">
                        <label htmlFor="scheduleName" className="form-label fw-bold">
                          {getTranslation('stepSchedule.name.title', language)}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="scheduleName"
                          maxLength={50}
                          value={formData.scheduleName}
                          onChange={(e) => setFormData({...formData, scheduleName: e.target.value})}
                          placeholder={getTranslation('stepSchedule.name.placeholder', language)}
                        />
                        <div className="form-text text-muted mt-1">
                          {formData.scheduleName.length}/50 caracteres
                        </div>
                      </div>

                      {/* Fecha de inicio */}
                      <div className="mb-4">
                        <label htmlFor="startDate" className="form-label fw-bold">
                          {getTranslation('stepSchedule.startDate.title', language)}
                        </label>
                        <div className="input-group">
                          <input
                            type="date"
                            className="form-control"
                            id="startDate"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          />
                          <span className="input-group-text">
                            <i className="fas fa-calendar"></i>
                          </span>
                        </div>
                        
                        <div className="form-check mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="hasEndDate"
                            checked={formData.hasEndDate}
                            onChange={(e) => setFormData({...formData, hasEndDate: e.target.checked})}
                          />
                          <label className="form-check-label" htmlFor="hasEndDate">
                            {getTranslation('stepSchedule.startDate.hasEndDate', language)}
                          </label>
                        </div>

                        {formData.hasEndDate && (
                          <div className="mt-2">
                            <input
                              type="date"
                              className="form-control"
                              value={formData.endDate}
                              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                              min={formData.startDate}
                            />
                          </div>
                        )}
                      </div>
                      {/* Horario semanal según availabilityMode */}
                      {!availabilityPricingMode ? (
                        // Estado de carga o error
                        <div className="mb-4">
                                                  <div className="text-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            No se pudo cargar la configuración de horarios. Se mostrará el modo por defecto.
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-warning ms-3"
                              onClick={fetchAvailabilityPricingMode}
                              disabled={isLoadingMode}
                            >
                              <i className="fas fa-sync-alt me-1"></i>
                              Reintentar
                            </button>
                          </div>
                          
                          {/* Mostrar horario estándar como fallback */}
                          <div className="mb-4">
                            <div className="mb-3">
                              <h5 className="fw-bold mb-0">
                                {getTranslation('stepSchedule.weeklySchedule.title', language)}
                              </h5>
                            </div>

                            <div className="row">
                              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                <div key={day} className="col-12 mb-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <span className="fw-semibold me-3" style={{ minWidth: '100px' }}>
                                      {getTranslation(`stepSchedule.weeklySchedule.${day}`, language)}
                                    </span>
                                    <button 
                                      type="button" 
                                      className="btn btn-link text-primary p-0"
                                      onClick={() => handleAddTimeSlot(day)}
                                    >
                                      <i className="fas fa-plus me-1"></i>
                                      {getTranslation('stepSchedule.weeklySchedule.addTimeSlot', language)}
                                    </button>
                                  </div>
                                  
                                  {/* Display existing time slots */}
                                  {(formData.timeSlots[day] || []).map((timeSlot) => (
                                    <div key={timeSlot.id} className="d-flex align-items-center mb-2 ms-4">
                                      {/* Time input fields */}
                                      <div className="d-flex align-items-center me-3">
                                        <select
                                          className="form-select me-1"
                                          style={{ width: '70px' }}
                                          value={timeSlot.hour}
                                          onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'hour', e.target.value)}
                                        >
                                          {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                              {i.toString().padStart(2, '0')}
                                            </option>
                                          ))}
                                        </select>
                                        <span className="fw-bold me-1">:</span>
                                        <select
                                          className="form-select"
                                          style={{ width: '70px' }}
                                          value={timeSlot.minute}
                                          onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'minute', e.target.value)}
                                        >
                                          {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                              {i.toString().padStart(2, '0')}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      {/* Action buttons */}
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm me-2"
                                        onClick={() => handleRemoveTimeSlot(day, timeSlot.id)}
                                        title="Eliminar franja horaria"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => handleAddTimeSlot(day)}
                                        title="Añadir franja horaria"
                                      >
                                        <i className="fas fa-plus"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : availabilityPricingMode.availabilityMode === 'TIME_SLOTS' ? (
                        // Horario semanal estándar (franjas horarias)
                        <div className="mb-4">
                          <div className="mb-3">
                            <h5 className="fw-bold mb-0">
                              {getTranslation('stepSchedule.weeklySchedule.title', language)}
                            </h5>
                          </div>

                          <div className="row">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                              <div key={day} className="col-12 mb-3">
                                <div className="d-flex align-items-center mb-2">
                                  <span className="fw-semibold me-3" style={{ minWidth: '100px' }}>
                                    {getTranslation(`stepSchedule.weeklySchedule.${day}`, language)}
                                  </span>
                                  <button 
                                    type="button" 
                                    className="btn btn-link text-primary p-0"
                                    onClick={() => handleAddTimeSlot(day)}
                                  >
                                    <i className="fas fa-plus me-1"></i>
                                    {getTranslation('stepSchedule.weeklySchedule.addTimeSlot', language)}
                                  </button>
                                </div>
                                
                                {/* Display existing time slots */}
                                {(formData.timeSlots[day] || []).map((timeSlot) => (
                                  <div key={timeSlot.id} className="d-flex align-items-center mb-2 ms-4">
                                    {/* Time input fields */}
                                    <div className="d-flex align-items-center me-3">
                                      <select
                                        className="form-select me-1"
                                        style={{ width: '70px' }}
                                        value={timeSlot.hour}
                                        onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'hour', e.target.value)}
                                      >
                                        {Array.from({ length: 24 }, (_, i) => (
                                          <option key={i} value={i.toString().padStart(2, '0')}>
                                            {i.toString().padStart(2, '0')}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="fw-bold me-1">:</span>
                                      <select
                                        className="form-select"
                                        style={{ width: '70px' }}
                                        value={timeSlot.minute}
                                        onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'minute', e.target.value)}
                                      >
                                        {Array.from({ length: 60 }, (_, i) => (
                                          <option key={i} value={i.toString().padStart(2, '0')}>
                                            {i.toString().padStart(2, '0')}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm me-2"
                                      onClick={() => handleRemoveTimeSlot(day, timeSlot.id)}
                                      title="Eliminar franja horaria"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleAddTimeSlot(day)}
                                      title="Añadir franja horaria"
                                    >
                                      <i className="fas fa-plus"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        // Horario semanal estilo apertura (OPENING_HOURS)
                        <div className="mb-4">
                          <div className="mb-3">
                            <h5 className="fw-bold mb-0">
                              Horario de apertura semanal
                            </h5>
                            <p className="text-muted small">
                              Configura los rangos de horarios de apertura para cada día. Puedes agregar múltiples rangos por día, pero no pueden ser iguales.
                            </p>
                          </div>

                          <div className="row">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                              <div key={day} className="col-12 mb-3">
                                <div className="d-flex align-items-center mb-2">
                                  <span className="fw-semibold me-3" style={{ minWidth: '100px' }}>
                                    {getTranslation(`stepSchedule.weeklySchedule.${day}`, language)}
                                  </span>
                                  <button 
                                    type="button" 
                                    className="btn btn-link text-primary p-0"
                                    onClick={() => handleAddTimeSlot(day)}
                                  >
                                    <i className="fas fa-plus me-1"></i>
                                    Añadir rango de horario
                                  </button>
                                </div>
                                
                                {/* Mostrar franjas horarias existentes */}
                                {(formData.timeSlots[day] || []).map((timeSlot, index) => {
                                  const startTime = `${timeSlot.hour}:${timeSlot.minute}`;
                                  const endTime = timeSlot.endHour && timeSlot.endMinute ? `${timeSlot.endHour}:${timeSlot.endMinute}` : '';
                                  const isTimeRangeValid = endTime && startTime !== endTime;
                                  
                                  return (
                                    <div key={timeSlot.id} className="d-flex align-items-center mb-2 ms-4 p-2 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                      {/* Campos de hora de inicio */}
                                      <div className="d-flex align-items-center me-2">
                                        <label className="form-label me-1 mb-0 small">Inicio:</label>
                                        <select
                                          className="form-select me-1"
                                          style={{ width: '70px' }}
                                          value={timeSlot.hour}
                                          onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'hour', e.target.value)}
                                        >
                                          {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                              {i.toString().padStart(2, '0')}
                                            </option>
                                          ))}
                                        </select>
                                        <span className="fw-bold me-1">:</span>
                                        <select
                                          className="form-select me-2"
                                          style={{ width: '70px' }}
                                          value={timeSlot.minute}
                                          onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'minute', e.target.value)}
                                        >
                                          {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                              {i.toString().padStart(2, '0')}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      {/* Separador */}
                                      <span className="fw-bold me-2">-</span>
                                      
                                      {/* Campos de hora de fin */}
                                      <div className="d-flex align-items-center me-3">
                                        <label className="form-label me-1 mb-0 small">Fin:</label>
                                        <select
                                          className="form-select me-1"
                                          style={{ width: '70px' }}
                                          value={timeSlot.endHour || '17'}
                                          onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'endHour', e.target.value)}
                                        >
                                          {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                              {i.toString().padStart(2, '0')}
                                            </option>
                                          ))}
                                        </select>
                                        <span className="fw-bold me-1">:</span>
                                        <select
                                          className="form-select me-2"
                                          style={{ width: '70px' }}
                                          value={timeSlot.endMinute || '00'}
                                          onChange={(e) => handleTimeSlotChange(day, timeSlot.id, 'endMinute', e.target.value)}
                                        >
                                          {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                              {i.toString().padStart(2, '0')}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      {/* Validación visual */}
                                      {!isTimeRangeValid && endTime && (
                                        <div className="text-danger small me-2">
                                          <i className="fas fa-exclamation-triangle me-1"></i>
                                          Los horarios no pueden ser iguales
                                        </div>
                                      )}
                                      
                                      {/* Botón eliminar */}
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm me-2"
                                        onClick={() => handleRemoveTimeSlot(day, timeSlot.id)}
                                        title="Eliminar rango de horario"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </div>
                                  );
                                })}
                                
                                {/* Mostrar mensaje si no hay rangos */}
                                {(formData.timeSlots[day] || []).length === 0 && (
                                  <div className="ms-4 text-muted small">
                                    <i className="fas fa-info-circle me-1"></i>
                                    No hay rangos de horario configurados para este día
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                       {/* Excepciones */}
                       <div className="mb-4">
                        <h5 className="fw-bold mb-3">
                          {getTranslation('stepSchedule.exceptions.title', language)}
                        </h5>
                        <p className="text-muted mb-3">
                          {getTranslation('stepSchedule.exceptions.description', language)}
                        </p>

                        {formData.exceptions.map((exception, index) => (
                          <div key={index} className="row mb-3">
                            <div className="col-md-4">
                              <input
                                type="date"
                                className="form-control"
                                value={exception.date}
                                onChange={(e) => handleExceptionChange(index, 'date', e.target.value)}
                              />
                            </div>
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control"
                                placeholder={getTranslation('stepSchedule.exceptions.descriptionPlaceholder', language)}
                                value={exception.description}
                                onChange={(e) => handleExceptionChange(index, 'description', e.target.value)}
                              />
                            </div>
                            <div className="col-md-2">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleRemoveException(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        ))}

                        <button 
                          type="button" 
                          className="btn btn-primary"
                          onClick={handleAddException}
                        >
                          <i className="fas fa-plus me-2"></i>
                          {getTranslation('stepSchedule.exceptions.addDate', language)}
                        </button>
                      </div>
                    </div>
                    ) : currentStep === 2 ? (
                     // Paso 2: Categorías de precios
                     <div>
                       <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="fw-bold mb-0">
                              Categorías de precios:
                          </h5>
                       </div>
                       
                       <div className="mb-4">
                         <div className="form-check mb-3">
                           <input
                             className="form-check-input"
                             type="radio"
                             name="pricingType"
                             id="samePrice"
                             value="same"
                             checked={pricingType === 'same'}
                             onChange={(e) => setPricingType(e.target.value as 'same' | 'ageBased')}
                           />
                           <label className="form-check-label fw-semibold" htmlFor="samePrice">
                             El precio es igual para todos, por ejemplo: por participante
                           </label>
                         </div>
                         
                         <div className="form-check mb-3">
                           <input
                             className="form-check-input"
                             type="radio"
                             name="pricingType"
                             id="ageBasedPrice"
                             value="ageBased"
                             checked={pricingType === 'ageBased'}
                             onChange={(e) => setPricingType(e.target.value as 'same' | 'ageBased')}
                           />
                           <label className="form-check-label fw-semibold" htmlFor="ageBasedPrice">
                             El precio depende de la edad, por ejemplo: adultos, niños, mayores, etc
                           </label>
                         </div>
                       </div>
                       
                       {/* Mostrar interfaz de grupos de edad solo si se selecciona "El precio depende de la edad" */}
                       {pricingType === 'ageBased' && (
                         <div className="mb-4">
                           
                           
                           {/* Mostrar orden actual de grupos */}
                           <div className="text-info border-0 bg-light mb-3">
                             <i className="fas fa-sort-numeric-up text-primary me-2"></i>
                             <strong>Orden actual:</strong> {
                               ageGroups
                                 .sort((a, b) => {
                                   const orderMap: { [key: string]: number } = {
                                     'Infante': 0,
                                     'Niños': 1,
                                     'Adultos': 2,
                                     'Adulto mayor': 3
                                   };
                                   return (orderMap[a.name] ?? 999) - (orderMap[b.name] ?? 999);
                                 })
                                 .map(group => group.name)
                                 .join(' → ')
                             }
                           </div>
                           
                            
                           
                           {ageGroups.map((group, index) => (
                             <div key={group.id} className="card mb-3 border">
                               <div className="card-body">
                                 <div className="d-flex justify-content-between align-items-center">
                                   <div className="d-flex align-items-center">
                                                                           <span className="fw-semibold me-3">
                                        {group.name}
                                        {(group.name === 'Niños' || group.name === 'Adultos') && (
                                          <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                                            <i className="fas fa-shield-alt me-1"></i>
                                            Protegido
                                          </span>
                                        )}
                                      </span>
                                     <span className="text-muted me-2">Franja de edad</span>
                                     <div className="d-flex align-items-center">
                                       {/* Campos de edad - solo editable la edad máxima */}
                                       <div className="row g-2 mt-2">
                                         <div className="col-6">
                                           <input
                                             type="number"
                                             className="form-control form-control-sm"
                                             min="0"
                                             max="99"
                                             value={group.minAge}
                                             readOnly={true}
                                             style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                             title="La edad mínima se conecta automáticamente con la edad máxima del grupo anterior"
                                           />
                         </div>
                                         <div className="col-6">
                                           <input
                                             type="number"
                                             className="form-control form-control-sm"
                                             min="0"
                                             max="99"
                                             value={group.maxAge}
                                             onChange={(e) => handleManualAgeRangeChange(group.id, 'maxAge', parseInt(e.target.value) || 0)}
                                             title="Edita la edad máxima para conectar automáticamente con el siguiente grupo"
                                           />
                       </div>
                                       </div>
                                     </div>
                                   </div>
                                   <button
                                     type="button"
                                     className="btn btn-link text-danger p-0"
                                     onClick={() => handleRemoveAgeGroup(group.id)}
                                     disabled={ageGroups.length <= 1 || group.name === 'Niños' || group.name === 'Adultos'}
                                     title={group.name === 'Niños' || group.name === 'Adultos' ? 'Este grupo no se puede eliminar' : 'Eliminar grupo'}
                                   >
                                     Eliminar
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                           
                           <button 
                             type="button" 
                             className="btn btn-link text-primary p-0 d-flex align-items-center"
                             onClick={handleAddAgeGroup}
                           >
                             <i className="fas fa-chevron-down me-2"></i>
                             Añadir grupo de edad
                           </button>
                           
                           {/* Información sobre grupos disponibles para agregar */}
                           <div className="mt-2">
                             {(() => {
                               const existingInfante = ageGroups.some(group => group.name === 'Infante');
                               const existingAdultoMayor = ageGroups.some(group => group.name === 'Adulto mayor');
                               
                               if (!existingInfante && !existingAdultoMayor) {
                                 return (
                                   <small className="text-muted">
                                     <i className="fas fa-info-circle me-1"></i>
                                     Puedes agregar: Infante y Adulto mayor
                                   </small>
                                 );
                               } else if (!existingInfante) {
                                 return (
                                   <small className="text-muted">
                                     <i className="fas fa-info-circle me-1"></i>
                                     Solo puedes agregar: Infante
                                   </small>
                                 );
                               } else if (!existingAdultoMayor) {
                                 return (
                                   <small className="text-muted">
                                     <i className="fas fa-info-circle me-1"></i>
                                     Solo puedes agregar: Adulto mayor
                                   </small>
                                 );
                               } else {
                                 return (
                                   <small className="text-success">
                                     <i className="fas fa-check-circle me-1"></i>
                                     Todos los grupos disponibles han sido agregados
                                   </small>
                                 );
                               }
                             })()}
                           </div>
                           
                           {/* Botón para continuar si ya se han configurado los grupos */}
                           {ageGroups.length > 0 && ageGroups.every(group => group.name.trim() && group.minAge < group.maxAge) && (
                             <div className="mt-4">
                               <button 
                                 type="button" 
                                 className="btn btn-primary"
                                 onClick={() => {
                                   // Guardar la configuración en localStorage
                                   localStorage.setItem(`${storageKey}_ageGroups`, JSON.stringify(ageGroups));
                                   localStorage.setItem(`${storageKey}_pricingType`, pricingType);
                                   
                                   // Continuar al step 3
                                   navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&step=3`, {
                                      activityId,
                                      lang,
                                      currency,
                                      currentStep
                                    });
                                 }}
                               >
                                 <i className="fas fa-arrow-right me-2"></i>
                                 Continuar al siguiente paso
                               </button>
                             </div>
                           )}           
                         </div>
                       )}
                       
                       {/* Botón para continuar cuando se selecciona precio igual para todos */}
                       {pricingType === 'same' && (
                         <div className="mt-4">
                           <button 
                             type="button" 
                             className="btn btn-primary"
                             onClick={() => {
                               localStorage.setItem(`${storageKey}_pricingType`, pricingType);
                               navigate(`/extranet/activity/availabilityPricing/create?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&step=3`);
                             }}
                           >
                             <i className="fas fa-arrow-right me-2"></i>
                             Continuar al siguiente paso
                           </button>
                         </div>
                       )}
                       
                       {/* Botones de navegación para step 2 */}
                       <div className="d-flex justify-content-between mt-5">
                         <button 
                           type="button" 
                           className="btn btn-outline-primary"
                           onClick={handleBack}
                         >
                           <i className="fas fa-arrow-left me-2"></i>
                           Atrás
                         </button>
                       </div>
                       
                       
                     </div>
                     ) : currentStep === 3 ? (
                      // Paso 3: Capacidad
                      availabilityPricingMode && availabilityPricingMode.pricingMode === 'PER_PERSON' ? (
                      <div>
                        <h5 className="fw-bold mb-4 text-dark">
                          Veamos la capacidad
                        </h5>
                        
                        <h6 className="fw-bold mb-4 text-dark">
                          ¿Cuántos participantes puedes aceptar por franja horaria?
                        </h6>
                      
                        <div className="row">
                          <div className="col-md-2 mb-4">
                            <label htmlFor="minParticipants" className="form-label fw-bold">
                              Número mínimo de participantes
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              id="minParticipants"
                              min="1"
                              value={capacityData.minParticipants}
                              onChange={(e) => setCapacityData(prev => ({
                                ...prev,
                                minParticipants: parseInt(e.target.value) || 1
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                      ) : (
                        <div>
                          <div className="text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-info-circle fa-3x mb-3"></i>
                              <h5 className="text-muted">Configuración no disponible</h5>
                              <p className="text-muted">
                                La configuración de capacidad solo está disponible cuando el modo de precios es "Por persona".
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                      ) : currentStep === 4 ? (
                       // Paso 4: Precio
                       availabilityPricingMode && availabilityPricingMode.pricingMode === 'PER_PERSON' ? (
                       <div>
                         <h5 className="fw-bold mb-4 text-dark">
                           Establece el precio de tu actividad
                         </h5>
                         
                         <h6 className="fw-bold mb-4 text-dark">
                           Participante
                         </h6>
                         
                           {/* Rango total de personas */}
                           {availabilityPricingMode?.pricingMode === 'PER_PERSON' && (() => {
                             const capacity = apiCapacity || getCapacityFromBookingOption();
                             return capacity && (
                               <div className="mb-3">
                                 <div className="d-flex align-items-center">
                                   <span className="text-muted me-2">
                                     Rango de personas: {capacity.groupMinSize} a {capacity.groupMaxSize || 'Ilimitado'}
                                   </span>
                                   <i className="fas fa-info-circle text-muted" style={{ fontSize: '14px' }}></i>
                                 </div>
                               </div>
                             );
                           })()}
                           
                           {/* Headers de la tabla */}
                           <div className="row mb-3">
                             <div className="col-md-4">
                               <label className="form-label text-muted fw-bold">
                                 Número de personas
                               </label>
                             </div>
                             <div className="col-md-2">
                               <label className="form-label text-muted fw-bold">
                               El cliente paga
                             </label>
                             </div>
                             <div className="col-md-2">
                               <label className="form-label text-muted fw-bold">
                                 Comisión
                               </label>
                             </div>
                             <div className="col-md-2">
                               <label className="form-label text-muted fw-bold">
                                 Precio por participante
                               </label>
                             </div>
                             <div className="col-md-2">
                               <label className="form-label text-muted fw-bold">
                                Acciones
                               </label>
                             </div>
                           </div>

                           {/* Filas de precios */}
                           {pricingLevels.map((level, index) => (
                             <div key={level.id} className="row mb-3 align-items-end">
                               <div className="col-md-4">
                                 <div className="d-flex align-items-center">
                                   <span className="text-black fw-bold me-2">
                                     {level.minPeople} a{' '}
                                     {level.maxPeople === -1 ? (
                                       <span className="text-primary fw-bold">Ilimitado</span>
                                     ) : (
                                         <input
                                           type="number"
                                           className="form-control form-control-sm d-inline-block"
                                           style={{ width: '60px' }}
                                           value={level.maxPeople}
                                           onChange={(e) => handlePricingLevelChange(level.id, 'maxPeople', parseInt(e.target.value) || 1)}
                                         min={level.minPeople + 1}
                                         max={(() => {
                                           const capacity = apiCapacity || getCapacityFromBookingOption();
                                           return capacity?.groupMaxSize || 999;
                                         })()}
                                       />
                                     )}
                                   </span>
                                   {index > 0 && (
                                     <i className="fas fa-info-circle text-muted ms-2" style={{ fontSize: '14px' }}></i>
                                   )}
                                 </div>
                               </div>
                               
                               <div className="col-md-2">
                                 <div className="input-group">
                             <input
                               type="text"
                               className="form-control"
                                     placeholder="0"
                                     value={level.clientPays}
                                     onChange={(e) => handlePricingLevelChange(level.id, 'clientPays', e.target.value)}
                             />
                                   <span className="input-group-text">
                                     {(currency || 'USD').toUpperCase()}
                                   </span>
                                 </div>
                           </div>
                           
                               <div className="col-md-2">
                             <input
                               type="text"
                               className="form-control"
                                   value={`${appConfig.pricing.defaultCommissionPercentage}%`}
                               readOnly
                                   disabled
                             />
                           </div>
                           
                               <div className="col-md-2">
                                 <div className="input-group">
                             <input
                               type="text"
                               className="form-control"
                                     placeholder="0.00"
                                     value={level.pricePerPerson}
                                     readOnly
                                     disabled
                             />
                                   <span className="input-group-text">
                                     {(currency || 'USD').toUpperCase()}
                                   </span>
                           </div>
                         </div>

                               {/* Columna de Acciones */}
                               <div className="col-md-2">
                                 {/* Botón eliminar solo en la última fila (excluyendo la primera) */}
                                 {index === pricingLevels.length - 1 && index > 0 ? (
                                   <button
                                     type="button"
                                     className="btn btn-outline-danger btn-sm"
                                     onClick={() => handleRemovePricingLevel(level.id)}
                                   >
                                     <i className="fas fa-minus-circle me-1"></i>
                                     Eliminar
                                   </button>
                                 ) : (
                                   <span className="text-muted">-</span>
                                 )}
                               </div>

                             </div>
                           ))}
                         
                         <div className="mt-4">
                           <button 
                             type="button" 
                               className="btn btn-primary d-flex align-items-center"
                               onClick={handleAddPricingLevel}
                           >
                             <i className="fas fa-plus me-2"></i>
                             Precio por nivel
                           </button>
                         </div>
                       </div>
                       ) : (
                        <div>
                           <div className="text-center py-5">
                             <div className="text-muted">
                               <i className="fas fa-info-circle fa-3x mb-3"></i>
                               <h5 className="text-muted">Configuración no disponible</h5>
                               <p className="text-muted">
                                 La configuración de precios solo está disponible cuando el modo de precios es "Por persona".
                               </p>
                            </div>
                          </div>
                        </div>
                       )
                      ) : (
                        // Error para valores de step no válidos
                        <div className="mb-5">
                                                  <div className="text-danger border-0">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-exclamation-triangle me-3 text-danger"></i>
                              <div>
                                <h5 className="alert-heading text-danger mb-2">
                                  Paso no válido
                                </h5>
                                <p className="mb-0 text-danger">
                                El valor del paso "{currentStep}" no es válido. Solo se permiten pasos del 1 al 4.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                {/* Botones de navegación */}
                {currentStep !== 2 && (
                <div className="d-flex justify-content-between mt-5">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary"
                    onClick={handleBack}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    {getTranslation('stepSchedule.buttons.back', language)}
                  </button>
                  
                                     <button 
                     type="button" 
                     className="btn btn-primary"
                     onClick={handleSaveAndContinue}
                     disabled={isSaving}
                   >
                     {isSaving ? (
                       <>
                         <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                         Guardando...
                       </>
                     ) : (
                       <>
                         {getTranslation('stepSchedule.buttons.saveAndContinue', language)}
                         <i className="fas fa-arrow-right ms-2"></i>
                       </>
                     )}
                   </button>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OptionSetupLayout>
  );
}
