import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type {
    CreateBookingRequest,
    CreateReviewRequest,
    UpdateProfileRequest,
} from '../api/types';

// Query Keys
export const queryKeys = {
    services: ['services'] as const,
    serviceCategories: ['services', 'categories'] as const,
    service: (id: string) => ['services', id] as const,

    masters: ['masters'] as const,
    master: (id: string) => ['masters', id] as const,
    availableMasters: (serviceId: string, date?: string) => ['masters', 'available', serviceId, date] as const,

    bookings: ['bookings'] as const,
    myBookings: ['bookings', 'my'] as const,
    slots: (masterId: string, date: string, duration: number) => ['slots', masterId, date, duration] as const,

    reviews: (masterId: string) => ['reviews', masterId] as const,

    profile: ['profile'] as const,
    loyalty: ['loyalty'] as const,

    masterDashboard: ['master', 'dashboard'] as const,
    masterSchedule: (startDate: string, endDate?: string) => ['master', 'schedule', startDate, endDate] as const,
    masterClients: (page: number, limit: number, search?: string) => ['master', 'clients', page, limit, search] as const,
    masterBookings: ['master', 'bookings'] as const,
};

// ============ Services ============
export function useServices() {
    return useQuery({
        queryKey: queryKeys.services,
        queryFn: () => api.getServices(),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useServiceCategories() {
    return useQuery({
        queryKey: queryKeys.serviceCategories,
        queryFn: () => api.getServiceCategories(),
        staleTime: 1000 * 60 * 10,
    });
}

export function useService(id: string) {
    return useQuery({
        queryKey: queryKeys.service(id),
        queryFn: () => api.getService(id),
        enabled: !!id,
    });
}

// ============ Masters ============
export function useMasters() {
    return useQuery({
        queryKey: queryKeys.masters,
        queryFn: () => api.getMasters(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useMaster(id: string) {
    return useQuery({
        queryKey: queryKeys.master(id),
        queryFn: () => api.getMaster(id),
        enabled: !!id,
    });
}

export function useAvailableMasters(serviceId: string, date?: string) {
    return useQuery({
        queryKey: queryKeys.availableMasters(serviceId, date),
        queryFn: () => api.getAvailableMasters(serviceId, date),
        enabled: !!serviceId,
    });
}

// ============ Bookings ============
export function useMyBookings() {
    return useQuery({
        queryKey: queryKeys.myBookings,
        queryFn: () => api.getMyBookings(),
    });
}

export function useSlots(masterId: string, date: string, durationMinutes: number) {
    return useQuery({
        queryKey: queryKeys.slots(masterId, date, durationMinutes),
        queryFn: () => api.getSlots(masterId, date, durationMinutes),
        enabled: !!masterId && !!date && !!durationMinutes,
    });
}

export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBookingRequest) => api.createBooking(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.myBookings });
            queryClient.invalidateQueries({ queryKey: queryKeys.masterBookings });
        },
    });
}

export function useValidatePromoCode() {
    return useMutation({
        mutationFn: ({ code, totalAmount }: { code: string; totalAmount: number }) =>
            api.validatePromoCode(code, totalAmount),
    });
}

// ============ Reviews ============
export function useMasterReviews(masterId: string) {
    return useQuery({
        queryKey: queryKeys.reviews(masterId),
        queryFn: () => api.getMasterReviews(masterId),
        enabled: !!masterId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReviewRequest) => api.createReview(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.reviews(result.review.masterId)
            });
        },
    });
}

// ============ Profile ============
export function useProfile() {
    return useQuery({
        queryKey: queryKeys.profile,
        queryFn: () => api.getProfile(),
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileRequest) => api.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        },
    });
}

export function useLoyalty() {
    return useQuery({
        queryKey: queryKeys.loyalty,
        queryFn: () => api.getLoyalty(),
    });
}

// ============ Master Dashboard ============
export function useMasterDashboard() {
    return useQuery({
        queryKey: queryKeys.masterDashboard,
        queryFn: () => api.getMasterDashboard(),
    });
}

export function useMasterSchedule(startDate: string, endDate?: string) {
    return useQuery({
        queryKey: queryKeys.masterSchedule(startDate, endDate),
        queryFn: () => api.getMasterSchedule(startDate, endDate),
        enabled: !!startDate,
    });
}

export function useUpdateMasterSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: api.updateMasterSchedule,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.masterSchedule(variables.workDate)
            });
        },
    });
}

export function useMasterClients(page = 1, limit = 20, search?: string) {
    return useQuery({
        queryKey: queryKeys.masterClients(page, limit, search),
        queryFn: () => api.getMasterClients(page, limit, search),
    });
}

export function useUpdateMasterBookingStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId, status, notes }: { bookingId: string; status: string; notes?: string }) =>
            api.updateMasterBookingStatus(bookingId, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.masterSchedule(undefined as unknown as string) });
            queryClient.invalidateQueries({ queryKey: queryKeys.masterBookings });
        },
    });
}
