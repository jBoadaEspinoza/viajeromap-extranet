import { apiGet } from './apiConfig';
import { apiPost } from './apiConfig';
import { getRuc } from '../utils/configUtils';


export interface ScheduleException {
    id: number;
    reason: string;
    scheduleId: number;
    date: string;
    isCancelled: boolean;
}

export interface BookingOption {
    id: string;
    title: string;
    durationDays: number;
    durationHours: number;
    durationMinutes: number;
    groupMinSize: number;
    groupMaxSize: number | null;
    isPrivate: boolean;
    meetingType: string;
    pickupPoints: PickupPoint[];
    pickupNotificationWhen: string;
    pickupTimeOption: string;
    dropoffType: string;
    transportModeId: number;
    languages: string[];
    pricingMode: string;
    availabilityMode: string;
    isOpenDuration: boolean;
    validityDays: number;
    defaultCutoffMinutes: number;
    lastMinuteAfterFirst: boolean;
    isActive: boolean;
    meetingPointDescription: string;
    meetingPointAddress: string | null;
    meetingPointLatitude: number | null;
    meetingPointLongitude: number | null;
    meetingPointPointId: number | null;
    returnToMeetingPoint: boolean;
    meetingPointId: number;
    meetingPointCity: string;
    meetingPointCountry: string;
    schedules: Schedule[];
    scheduleExceptions: ScheduleException[];
    priceTiers: PriceTier[];
    itineraries: Itinerary[];
  }
  
  export interface Itinerary {
    id?: number;
    title?: string;
    description?: string;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
    itinerarySteps?: ItineraryStep[];
}

export interface ItineraryStep {
    id?: number;
    orderIndex?: number;
    dayNumber?: number;
    title?: string;
    description?: string;
    stepType?: string;
    durationDays?: number;
    durationHours?: number;
    durationMinutes?: number;
    place?: City;
    latitude?: number;
    longitude?: number;
    transportMode?: TransportMode;
    subactivityTag?: SubactivityTag;
    createdAt?: string;
    updatedAt?: string;
}

export interface TransportMode {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

export interface SubactivityTag {
    id: number;
    name: string;
    isActive: boolean;
}

export interface PickupPoint {
    id: number;
    city: City;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    notes: string | null;
}

export interface City {
    id: number;
    cityName: string;
    cityLatitude: number | null;
    cityLongitude: number | null;
    countryId: string;
    imageUrl: string;
    isActive: boolean | null;
}

export interface Schedule {
    id: number;
    title: string;
    dayOfWeek: number;
    seasonStartDate: string;
    seasonEndDate: string | null;
    startTime: string;
    endTime: string | null;
    isActive: boolean;
}

export interface PriceTier {
    id: number;
    minParticipants: number;
    maxParticipants: number | null;
    totalPrice: number;
    pricePerParticipant: number;
    commissionPercent: number;
    currency: string;
}

export interface CutOffTimeRequest{
    timeSlot: string;
    cutOffMinutes: number;
}

export interface BookingOptionCreateCutOffRequest{
    activityId: string;
    bookingOptionId: string;
    defaultCutOffMinutes: number;
    isLastMinutesAfterFirst: boolean;
    cutOffTimesRequest: CutOffTimeRequest[];
}

export interface BookingOptionCreateAvailabilityPricingPricePerPersonRequest {
    activityId: string;
    bookingOptionId: string;
    bookingPriceTiers: BookingPriceTierRequest[];
}
  
export interface BookingPriceTierRequest {
    minParticipants: number;
    maxParticipants: number | null;
    totalPrice: number;
    commissionPercent: number;
    pricePerParticipant: number;
    currency: string;
}

export interface BookingOptionCreateAvailabilityPricingCapacityRequest{
    activityId: string;
    bookingOptionId: string;
    groupMinSize: number;
}

export interface BookingOptionCreateAvailabilityPricingDepartureTimeRequest {
    activityId: string; // requerido
    bookingOptionId: string; // requerido
    title: string; // requerido, máx 50 caracteres
    lang: string; // requerido
    startDate: string; // ISO date (yyyy-MM-dd)
    endDate?: string; // opcional (yyyy-MM-dd)
    weeklySchedule: WeeklyScheduleRequest[]; // requerido
    exceptions?: ScheduleExceptionRequest[]; // opcional
}

export interface WeeklyScheduleRequest {
    dayOfWeek: number; // 0=Lunes, 1=Martes, etc.
    startTime: string; // HH:mm
    endTime?: string; // opcional HH:mm
}

export interface ScheduleExceptionRequest {
    date: string; // ISO date (yyyy-MM-dd)
    description: string; // requerido
}

export interface CreateBookingOptionAvailabilityPricingDepartureTimeResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface AvailabilityPricingMode{
    availabilityMode: string; // "TIME_SLOTS" | "OPENING_HOURS"
    pricingMode: string; // "PER_PERSON" | "PER_GROUP"
}

export interface AvailabilityPricingCapacity{
    groupMinSize: number;
    groupMaxSize: number;
}

export interface ApiErrorResponse {
    success: false;
    errorCode: string;
    message: string;
}

export interface BookingPickupPointRequest {
    cityId: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    notes: string;
}
export interface CreateBookingOptionAvailabilityPricingRequest {
    activityId: string;
    bookingOptionId: string; 
    availabilityMode: string; // "TIME_SLOTS" | "OPENING_HOURS"
    pricingMode: string; // "PER_PERSON" | "PER_GROUP"
}
export interface CreateBookingOptionMeetingPickupRequest {
    activityId: string;
    bookingOptionId: string;
    lang: string;
    meetingType: string; // "MEETING_POINT" | "PICKUP_ZONE" | "REFERENCE_CITY_WITH_LIST"

    // Meeting Point
    meetingPointId?: number;
    meetingPointAddress?: string;
    meetingPointLatitude?: number;
    meetingPointLongitude?: number;
    meetingPointDescription?: string;

    // Pickup Points (solo si meetingType = REFERENCE_CITY_WITH_LIST)
    pickupPoints?: BookingPickupPointRequest[];

    // Pickup Config
    pickupNotificationWhen?: "AT_BOOKING" | "DAY_BEFORE" | "24H_BEFORE" | "AT_START_TIME";
    pickupTimeOption?: "SAME_AS_START" | "30_MIN_BEFORE" | "60_MIN_BEFORE" | "90_MIN_BEFORE" | "120_MIN_BEFORE" | "CUSTOM";
    customPickupMinutes?: number;

    // Dropoff Config
    dropoffType?: "SAME_AS_PICKUP" | "DIFFERENT_LOCATION" | "NO_DROPOFF";
    dropoffLocationId?: number;

    // Transport
    transportModeId?: number;
}

export interface CreateBookingOptionMeetingPickupResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface CreateBookingOptionRequest{
    activityId: string;
}

export interface CreateBookingOptionSetupRequest{
    activityId: string;            
    bookingOptionId: string;       
    title: string;                 
    maxGroupSize?: number | null;  
    guideLanguages: string[];      
    isPrivate: boolean;            
    isOpenDuration: boolean;       
    durationDays?: number | null;
    durationHours?: number | null;
    durationMinutes?: number | null;
    validityDays?: number | null;
}

export interface ResetAvailabilityPricingResponse{
    success: boolean;
    successCode: string;
    message: string;
}

export interface CreateBookingOptionResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface CreateBookingOptionSetupResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface CreateBookingOptionAvailabilityPricingResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface CreateBookingOptionAvailabilityPricingCapacityResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface CreateBookingOptionAvailabilityPricingPricePerPersonResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface IsBookingOptionAvailabilityPricingCompletedResponse{
    success: boolean;
    successCode: string;
    message: string;
    data?: {
        isComplete: boolean;
    };
}

export interface ListOfTimeSlotsResponse {
    success: boolean;
    successCode: string;
    message: string;
    data: {
        title: string;
        startDate: string;
        timeSlots: TimeSlot[];
    };
}

export interface TimeSlot {
    id: string;
    departureTime: string;
    cutOffTime: string;
    isActive: boolean;
}

export interface CreateBookingOptionCutOffRequestResponse{
    success: boolean;
    message: string;
    idCreated: string;
}

export interface BookingOptionResponse{
    success: boolean;
    successCode: string;
    message: string;
    data: BookingOption[];
}

export interface BookingOptionByIdResponse{
    success: boolean;
    successCode: string;
    message: string;
    data: BookingOption;
}

export const bookingOptionApi = {
    create: async (request: CreateBookingOptionRequest): Promise<CreateBookingOptionResponse> => {
        try {
            const response = await apiPost<CreateBookingOptionResponse>('/booking-options/create', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionResponse;
            }
            return response;
        } catch (error: any) {
            console.error('Booking Option API: Error creating booking option:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    createSetup: async (request: CreateBookingOptionSetupRequest): Promise<CreateBookingOptionSetupResponse> => {
        try {
            const response = await apiPost<CreateBookingOptionSetupResponse>('/booking-options/createSetup', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionSetupResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionSetupResponse;
            }
            return response;
        } catch (error: any) {
            console.error('Booking Option API: Error creating booking option setup:', error);
            return {
                success: false,
                message: 'Error al crear la configuración de la opción de reserva',
                idCreated: ''
            };
        }
    },
    createBookingOptionMeetingPickup: async (request: CreateBookingOptionMeetingPickupRequest): Promise<CreateBookingOptionMeetingPickupResponse> => {
        try{
            const response = await apiPost<CreateBookingOptionMeetingPickupResponse>('/booking-options/createMeetingPickup', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionMeetingPickupResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionMeetingPickupResponse;
            }
            return response;
        }catch(error: any){
            console.error('Booking Option API: Error creating booking option meeting pickup:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    createBookingOptionAvailabilityPricing: async (request: CreateBookingOptionAvailabilityPricingRequest): Promise<CreateBookingOptionAvailabilityPricingResponse> => {
        try{
            const response = await apiPost<CreateBookingOptionAvailabilityPricingResponse>('/booking-options/createAvailabilityPricing', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionAvailabilityPricingResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionAvailabilityPricingResponse;
            }
            return response;
        }catch(error: any){
            console.error('Booking Option API: Error creating booking option availability pricing:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    getAvailabilityPricingMode: async (bookingOptionId: string): Promise<AvailabilityPricingMode | ApiErrorResponse> => {
        try {
            const response = await apiGet<AvailabilityPricingMode | ApiErrorResponse>(`/booking-options/${bookingOptionId}/getAvailabilityPricingMode`);
            
            // Si la respuesta indica un error (success: false)
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
                return response as ApiErrorResponse;
            }
            
            // Validar que la respuesta tenga la estructura correcta de AvailabilityPricingMode
            if (response && typeof response === 'object' && 'availabilityMode' in response && 'pricingMode' in response) {
                return response as AvailabilityPricingMode;
            }
            
            // Si la respuesta no tiene la estructura esperada, verificar si está en data
            if (response && typeof response === 'object' && 'data' in response) {
                const responseAny = response as any;
                if (responseAny.data && typeof responseAny.data === 'object' && 'availabilityMode' in responseAny.data && 'pricingMode' in responseAny.data) {
                    return responseAny.data as AvailabilityPricingMode;
                }
            }
            
            // Si no se puede determinar la estructura, retornar error genérico
            console.warn('Booking Option API: Response does not match expected structure:', response);
            return {
                success: false,
                errorCode: 'INVALID_RESPONSE_STRUCTURE',
                message: 'La respuesta del servidor no tiene la estructura esperada'
            };
        } catch (error: any) {
            console.error('Booking Option API: Error getting availability pricing mode:', error);
            return {
                success: false,
                errorCode: 'NETWORK_ERROR',
                message: 'Error de conexión al obtener el modo de disponibilidad y precios'
            };
        }
    },
    createAvailabilityPricingDepartureTime: async (request: BookingOptionCreateAvailabilityPricingDepartureTimeRequest): Promise<CreateBookingOptionAvailabilityPricingDepartureTimeResponse> => {
        try{
            const response = await apiPost<CreateBookingOptionAvailabilityPricingDepartureTimeResponse>('/booking-options/createAvailabilityPricingDepartureTime', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionAvailabilityPricingDepartureTimeResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionAvailabilityPricingDepartureTimeResponse;
            }
            return response;
        }catch(error: any){
            console.error('Booking Option API: Error creating booking option availability pricing departure time:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    createAvailabilityPricingCapacity: async (request: BookingOptionCreateAvailabilityPricingCapacityRequest): Promise<CreateBookingOptionAvailabilityPricingCapacityResponse> => {
        try{
            const response = await apiPost<CreateBookingOptionAvailabilityPricingCapacityResponse>('/booking-options/createAvailabilityPricingCapacity', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionAvailabilityPricingCapacityResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionAvailabilityPricingCapacityResponse;
            }
            return response;
        }catch(error: any){
            console.error('Booking Option API: Error creating booking option availability pricing capacity:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    getAvailabilityPricingCapacity: async (bookingOptionId: string): Promise<AvailabilityPricingCapacity | ApiErrorResponse> => {
        try{
            const response = await apiGet<AvailabilityPricingCapacity | ApiErrorResponse>(`/booking-options/${bookingOptionId}/getAvailabilityPricingCapacity`);
            // Si la respuesta indica un error (success: false)
            if(response && typeof response === 'object' && 'success' in response && response.success === false){
                return response as ApiErrorResponse;
            }
            // Validar que la respuesta tenga la estructura correcta de AvailabilityPricingCapacity
            if(response && typeof response === 'object' && 'groupMinSize' in response && 'groupMaxSize' in response){
                return response as AvailabilityPricingCapacity;
            }
            // Si la respuesta no tiene la estructura esperada, verificar si está en data
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as AvailabilityPricingCapacity;
            }
            // Si no se puede determinar la estructura, retornar error genérico
            console.warn('Booking Option API: Response does not match expected structure:', response);
            if(response && typeof response === 'object' && 'success' in response && response.success === false){
                return response as ApiErrorResponse;
            }
            return response;
        }catch(error: any){
            console.error('Booking Option API: Error getting availability pricing capacity:', error);
            return {
                success: false,
                errorCode: 'NETWORK_ERROR',
                message: 'Error de conexión al obtener la capacidad de disponibilidad y precios'
            };
        }
    },
    createAvailabilityPricingPricePerPerson: async (request: BookingOptionCreateAvailabilityPricingPricePerPersonRequest): Promise<CreateBookingOptionAvailabilityPricingPricePerPersonResponse> => {
        try{
            const response = await apiPost<CreateBookingOptionAvailabilityPricingPricePerPersonResponse>('/booking-options/createAvailabilityPricingPricePerPerson', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionAvailabilityPricingPricePerPersonResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionAvailabilityPricingPricePerPersonResponse;
            }
            return response;
        }catch(error: any){
            console.error('Booking Option API: Error creating booking option availability pricing price per person:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    isBookingOptionAvailabilityPricingCompleted: async (bookingOptionId: string): Promise<IsBookingOptionAvailabilityPricingCompletedResponse> => {
        try {
            const response = await apiGet<IsBookingOptionAvailabilityPricingCompletedResponse>(`/booking-options/${bookingOptionId}/isAvailabilityPricing`);
            
            // Validar que la respuesta tenga la estructura correcta según la imagen
            if (response && typeof response === 'object') {
                // Verificar que tenga los campos exactos de la respuesta esperada
                if ('success' in response && 'successCode' in response && 'message' in response) {
                    // Si success es true y successCode es AVAILABILITY_PRICING_STATUS_CHECKED, significa que se completó
                    if (response.success === true && response.successCode === 'AVAILABILITY_PRICING_STATUS_CHECKED') {
                        // Verificar también que data.isComplete sea true para confirmar que realmente se completó
                        if (response.data && response.data.isComplete === true) {
                            return response as IsBookingOptionAvailabilityPricingCompletedResponse;
                        }
                    }
                    // Si success es false, significa que no se completó
                    if (response.success === false) {
                    return response as IsBookingOptionAvailabilityPricingCompletedResponse;
                    }
                }
            }
            
            // Si la respuesta no tiene la estructura esperada, verificar si está en data
            const responseAny = response as any;
            if (responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data) {
                const dataResponse = responseAny.data;
                if ('success' in dataResponse && 'successCode' in dataResponse && 'message' in dataResponse) {
                    // Si success es true y successCode es AVAILABILITY_PRICING_STATUS_CHECKED, significa que se completó
                    if (dataResponse.success === true && dataResponse.successCode === 'AVAILABILITY_PRICING_STATUS_CHECKED') {
                        // Verificar también que data.isComplete sea true
                        if (dataResponse.data && dataResponse.data.isComplete === true) {
                            return dataResponse as IsBookingOptionAvailabilityPricingCompletedResponse;
                        }
                    }
                    // Si success es false, significa que no se completó
                    if (dataResponse.success === false) {
                        return dataResponse as IsBookingOptionAvailabilityPricingCompletedResponse;
                    }
                }
            }
        
            // Si no se puede determinar la estructura, retornar error genérico
            return {
                success: false,
                successCode: 'UNKNOWN_ERROR',
                message: 'Respuesta del servidor no válida - estructura esperada: { success: true, successCode: "AVAILABILITY_PRICING_STATUS_CHECKED", message, data: { isComplete: true } }'
            };
        } catch (error: any) {
            return {
                success: false,
                successCode: 'NETWORK_ERROR',
                message: 'Error de conexión al verificar el estado de disponibilidad y precios'
            };
        }
    },
    getListOfTimeSlots: async (bookingOptionId: string): Promise<ListOfTimeSlotsResponse> => {
        try {
            const response = await apiGet<ListOfTimeSlotsResponse>(`/booking-options/${bookingOptionId}/listTimeSlots`);
            
            // Validar que la respuesta tenga la estructura correcta
            if (response && typeof response === 'object') {
                // Verificar que tenga los campos exactos de la respuesta esperada
                if ('success' in response && 'successCode' in response && 'message' in response && 'data' in response) {
                    if (response.success === true && response.successCode === 'TIME_SLOTS_LISTED') {
                        return response as ListOfTimeSlotsResponse;
                    }
                }
            }
            
            // Si la respuesta no tiene la estructura esperada, verificar si está en data
            const responseAny = response as any;
            if (responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data) {
                const dataResponse = responseAny.data;
                if ('success' in dataResponse && 'successCode' in dataResponse && 'message' in dataResponse && 'data' in dataResponse) {
                    if (dataResponse.success === true && dataResponse.successCode === 'TIME_SLOTS_LISTED') {
                        return dataResponse as ListOfTimeSlotsResponse;
                    }
                }
            }
            
            // Si no se puede determinar la estructura, retornar error genérico
            return {
                success: false,
                successCode: 'UNKNOWN_ERROR',
                message: 'Respuesta del servidor no válida - estructura esperada: { success: true, successCode: "TIME_SLOTS_RETRIEVED", message, data: { timeSlots: [...] } }',
                data: {
                    title: '',
                    startDate: '',
                    timeSlots: []
                }
            };
        } catch (error: any) {
            console.error('Booking Option API: Error getting list of time slots:', error);
            return {
                success: false,
                successCode: 'NETWORK_ERROR',
                message: 'Error de conexión al obtener la lista de franjas horarias',
                data: {
                    title: '',
                    startDate: '',
                    timeSlots: []
                }
            };
        }
    },
    createCutOffRequest: async (request: BookingOptionCreateCutOffRequest): Promise<CreateBookingOptionCutOffRequestResponse> => {
        try {
            const response = await apiPost<CreateBookingOptionCutOffRequestResponse>('/booking-options/createCutOffTime', request);
            if(response && typeof response === 'object'){
                if('success' in response && 'idCreated' in response){
                    return response as CreateBookingOptionCutOffRequestResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as CreateBookingOptionCutOffRequestResponse;
            }
            return response;
        } catch (error: any) {
            console.error('Booking Option API: Error creating booking option cut off request:', error);
            return {
                success: false,
                message: 'Error al crear la opción de reserva',
                idCreated: ''
            }
        }
    },
    searchBookingOptionById: async(activityId: string, optionId: string, language: string, currency: string): Promise<BookingOptionByIdResponse> => {
        try {
            const response = await apiGet<BookingOptionByIdResponse>(`/booking-options/search?activityId=${activityId}&optionId=${optionId}&language=${language}&currency=${currency}`);
            if(response && typeof response === 'object'){
                if('success' in response && 'successCode' in response && 'message' in response && 'data' in response){
                    return response as BookingOptionByIdResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as BookingOptionByIdResponse;
            }
            return response;
        } catch (error: any) {
            console.error('Booking Option API: Error getting booking option by id:', error);
            return {
                success: false,
                successCode: 'ERROR',
                message: 'Error de conexión al obtener la opción de reserva',
                data: {} as BookingOption
            }
        }
    },
    searchBookingOptions: async (activityId: string, language: string, currency: string): Promise<BookingOptionResponse> => {
        try {
            const response = await apiGet<BookingOptionResponse>(`/booking-options/search?activityId=${activityId}&language=${language}&currency=${currency}`);
            if(response && typeof response === 'object'){
                if('success' in response && 'successCode' in response && 'message' in response && 'data' in response){
                    return response as BookingOptionResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as BookingOptionResponse;
            }
            return response;
        } catch (error: any) {
            console.error('Booking Option API: Error getting booking option:', error);
            return {
                success: false,
                successCode: 'NETWORK_ERROR',
                message: 'Error de conexión al obtener la opción de reserva',
                data: []
            }
        }
    },
    resetAvailabilityPricing: async (bookingOptionId: string): Promise<ResetAvailabilityPricingResponse> => {
        try {
            const response = await apiPost<ResetAvailabilityPricingResponse>(`/booking-options/${bookingOptionId}/resetAvailabilityPricing`);
            if(response && typeof response === 'object'){
                if('success' in response && 'successCode' in response && 'message' in response){
                    return response as ResetAvailabilityPricingResponse;
                }
            }
            const responseAny = response as any;
            if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
                return responseAny.data as ResetAvailabilityPricingResponse;
            }
            return response;
        } catch (error: any) {
            return {
                success: false,
                successCode: 'NETWORK_ERROR',
                message: 'Error de conexión al resetear la disponibilidad y precios'
            }
        }
    }
}