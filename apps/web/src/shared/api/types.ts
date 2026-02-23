// ============ Base Types ============
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
    };
}

// ============ User ============
export interface User {
    id: string;
    telegramId: bigint;
    telegramUsername?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    role: 'client' | 'master' | 'admin' | 'owner';
    language: string;
    isActive: boolean;
}

// ============ Service ============
export interface ServiceCategory {
    id: string;
    parentId?: string;
    name: Record<string, string>;
    description?: Record<string, string>;
    imageUrl?: string;
    sortOrder: number;
    children?: ServiceCategory[];
}

export interface ServiceDuration {
    id: string;
    serviceId: string;
    durationMinutes: number;
    basePrice: number;
    isActive: boolean;
}

export interface Service {
    id: string;
    categoryId?: string;
    name: Record<string, string>;
    description?: Record<string, string>;
    imageUrl?: string;
    requiresConfirmation: boolean;
    isActive: boolean;
    sortOrder: number;
    category?: ServiceCategory;
    durations: ServiceDuration[];
}

// ============ Master ============
export interface MasterService {
    id: string;
    masterId: string;
    serviceId: string;
    priceModifier: number;
}

export interface Master {
    id: string;
    displayName: Record<string, string>;
    bio?: Record<string, string>;
    photoUrl?: string;
    specialization?: string;
    isActive: boolean;
    sortOrder: number;
    rating: number;
    reviewCount: number;
    services?: Service[];
    masterServices?: MasterService[];
}

// ============ Booking ============
export interface BookingItem {
    id: string;
    serviceId: string;
    durationId: string;
    price: number;
    sortOrder: number;
    service: {
        name: Record<string, string>;
    };
    duration: {
        durationMinutes: number;
    };
}

export interface Booking {
    id: string;
    userId: string;
    masterId?: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    totalPrice: number;
    discountAmount: number;
    depositAmount?: number;
    depositPercent?: number;
    adminNotes?: string;
    cancelReason?: string;
    createdAt: string;
    master?: {
        displayName: Record<string, string>;
        photoUrl?: string;
    };
    items: BookingItem[];
}

export type BookingStatus =
    | 'pending_confirmation'
    | 'confirmed'
    | 'deposit_pending'
    | 'deposit_paid'
    | 'in_progress'
    | 'completed'
    | 'cancelled_by_client'
    | 'cancelled_by_admin'
    | 'no_show';

export interface CreateBookingRequest {
    masterId: string;
    bookingDate: string;
    startTime: string;
    serviceDurations: Array<{
        serviceId: string;
        durationId: string;
    }>;
    promoCode?: string;
}

export interface PromoCodeResult {
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    discountAmount: number;
}

// ============ Review ============
export interface Review {
    id: string;
    userId: string;
    masterId: string;
    bookingId: string;
    rating: number;
    comment?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    user?: {
        firstName?: string;
        avatarUrl?: string;
    };
}

export interface CreateReviewRequest {
    masterId: string;
    bookingId: string;
    rating: number;
    comment?: string;
}

// ============ Loyalty ============
export interface LoyaltyStamp {
    id: string;
    userId: string;
    bookingId: string;
    stampNumber: number;
    isReward: boolean;
    createdAt: string;
}

export interface LoyaltyData {
    currentStamps: number;
    stampsForReward: number;
    totalRewards: number;
    stamps: LoyaltyStamp[];
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    language?: string;
}

// ============ Time Slot ============
export interface TimeSlot {
    time: string;
    available: boolean;
}
