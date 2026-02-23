import type {
    Service,
    ServiceCategory,
    Master,
    Booking,
    CreateBookingRequest,
    PromoCodeResult,
    Review,
    CreateReviewRequest,
    User,
    LoyaltyStamp,
    UpdateProfileRequest,
    LoyaltyData,
} from './types';

// Master Dashboard Types
interface MasterDashboardStats {
    todayBookings: number;
    weekBookings: number;
    monthBookings: number;
    todayIncome: number;
    weekIncome: number;
    monthIncome: number;
    totalClients: number;
    averageRating: number;
    reviewCount: number;
}

interface ScheduleDay {
    date: string;
    isDayOff: boolean;
    startTime: string | null;
    endTime: string | null;
    bookings: {
        id: string;
        startTime: string;
        endTime: string;
        status: string;
        serviceName: string;
        clientName: string;
        clientPhone: string;
        price: number;
    }[];
}

interface MasterClient {
    id: string;
    name: string;
    phone: string;
    visitCount: number;
    totalSpent: number;
    lastVisit: string | null;
    averageRating: number | null;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(json.error?.message || 'Request failed');
        }

        return json.data as T;
    }

    get<T>(path: string) {
        return this.request<T>('GET', path);
    }

    post<T>(path: string, body?: unknown) {
        return this.request<T>('POST', path, body);
    }

    put<T>(path: string, body?: unknown) {
        return this.request<T>('PUT', path, body);
    }

    patch<T>(path: string, body?: unknown) {
        return this.request<T>('PATCH', path, body);
    }

    delete<T>(path: string) {
        return this.request<T>('DELETE', path);
    }

    // ============ Services ============
    async getServices() {
        return this.get<{ services: Service[] }>('/services');
    }

    async getServiceCategories() {
        return this.get<{ categories: ServiceCategory[] }>('/services/categories');
    }

    async getService(id: string) {
        return this.get<{ service: Service }>(`/services/${id}`);
    }

    // ============ Masters ============
    async getMasters() {
        return this.get<{ masters: Master[] }>('/masters');
    }

    async getMaster(id: string) {
        return this.get<{ master: Master }>(`/masters/${id}`);
    }

    async getAvailableMasters(serviceId: string, date?: string) {
        const params = new URLSearchParams({ serviceId });
        if (date) params.append('date', date);
        return this.get<{ masters: Master[] }>(`/masters/available?${params}`);
    }

    // ============ Bookings ============
    async getSlots(masterId: string, date: string, durationMinutes: number) {
        return this.get<{ slots: string[] }>(
            `/bookings/slots?masterId=${masterId}&date=${date}&durationMinutes=${durationMinutes}`
        );
    }

    async createBooking(data: CreateBookingRequest) {
        return this.post<{ booking: Booking }>('/bookings', data);
    }

    async validatePromoCode(code: string, totalAmount: number) {
        return this.post<{ promoCode: PromoCodeResult }>('/bookings/validate-promo', {
            code,
            totalAmount,
        });
    }

    async getMyBookings() {
        return this.get<{ bookings: Booking[] }>('/bookings/my');
    }

    // ============ Reviews ============
    async getMasterReviews(masterId: string) {
        return this.get<{ reviews: Review[] }>(`/reviews/master/${masterId}`);
    }

    async createReview(data: CreateReviewRequest) {
        return this.post<{ review: Review }>('/reviews', data);
    }

    // ============ Auth ============
    async authenticate(initData: string) {
        return this.post<{ token: string; user: User }>('/auth/telegram', { initData });
    }

    // ============ Profile ============
    async getProfile() {
        return this.get<{ user: User }>('/profile');
    }

    async updateProfile(data: UpdateProfileRequest) {
        return this.put<{ user: User }>('/profile', data);
    }

    async getLoyalty() {
        return this.get<LoyaltyData>('/profile/loyalty');
    }

    async updateBookingStatus(bookingId: string, status: string) {
        return this.patch<{ booking: Booking }>(`/bookings/${bookingId}/status`, { status });
    }

    // ============ Master Dashboard ============
    async getMasterDashboard() {
        return this.get<{ stats: MasterDashboardStats }>('/master/dashboard');
    }

    async getMasterSchedule(startDate: string, endDate?: string) {
        const params = new URLSearchParams({ startDate });
        if (endDate) params.append('endDate', endDate);
        return this.get<{ schedule: ScheduleDay[] }>(`/master/schedule?${params}`);
    }

    async updateMasterSchedule(data: {
        workDate: string;
        startTime?: string;
        endTime?: string;
        isDayOff?: boolean;
    }) {
        return this.put<{ schedule: ScheduleDay }>('/master/schedule', data);
    }

    async updateMasterBookingStatus(bookingId: string, status: string, notes?: string) {
        return this.patch<{ booking: Booking }>(`/master/bookings/${bookingId}/status`, { status, notes });
    }

    async getMasterClients(page = 1, limit = 20, search?: string) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return this.get<{ clients: MasterClient[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/master/clients?${params}`);
    }
}

export const api = new ApiClient();
