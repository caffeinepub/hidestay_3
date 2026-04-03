import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Review {
    propertyId: bigint;
    comment: string;
    timestamp: Time;
    student: Principal;
    rating: bigint;
}
export interface Address {
    blocknumber: string;
    street: string;
    country: string;
    city: string;
    state: string;
    bluenumber: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Coordinates {
    lat: string;
    lang: string;
}
export interface Report {
    id: bigint;
    status: Variant_resolved_pending_dismissed;
    targetPropertyId: bigint;
    description: string;
    reporterId: Principal;
    timestamp: Time;
    actionTaken?: string;
    reason: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Property {
    id: bigint;
    title: string;
    verified: boolean;
    owner: Principal;
    description: string;
    amenities: Array<string>;
    availableFrom: Time;
    viewCount: bigint;
    approved: boolean;
    genderPreference: Variant_boys_unisex_girls;
    address: Address;
    pricePerMonth: bigint;
    roomType: Variant_apartment_sharedRoom_single;
    photos: Array<ExternalBlob>;
    coordinates: Coordinates;
    contactPhone: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Notification {
    id: bigint;
    ownerPrincipal: Principal;
    relatedInquiryId?: bigint;
    isRead: boolean;
    message: string;
    timestamp: Time;
}
export interface Announcement {
    id: bigint;
    title: string;
    expiresAt?: Time;
    createdAt: Time;
    isActive: boolean;
    message: string;
}
export interface Booking {
    id: bigint;
    status: Variant_cancelled_pending_paid_rejected;
    endDate: Time;
    propertyId: bigint;
    userDetails: {
        name: string;
        email: string;
        phone: string;
    };
    propertyIdText: string;
    student: Principal;
    stripeSessionId?: string;
    totalPrice: bigint;
    startDate: Time;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Inquiry {
    id: bigint;
    status: Variant_pending_rejected_accepted;
    studentName: string;
    inquiryType: Variant_bookVisit_contactOwner;
    studentPrincipal: Principal;
    studentPhone: string;
    propertyId: bigint;
    message: string;
    timestamp: Time;
}
export interface UserProfile {
    name: string;
    role: Variant_admin_owner_student;
    email: string;
    phone: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_admin_owner_student {
    admin = "admin",
    owner = "owner",
    student = "student"
}
export enum Variant_apartment_sharedRoom_single {
    apartment = "apartment",
    sharedRoom = "sharedRoom",
    single = "single"
}
export enum Variant_bookVisit_contactOwner {
    bookVisit = "bookVisit",
    contactOwner = "contactOwner"
}
export enum Variant_boys_unisex_girls {
    boys = "boys",
    unisex = "unisex",
    girls = "girls"
}
export enum Variant_cancelled_pending_paid_rejected {
    cancelled = "cancelled",
    pending = "pending",
    paid = "paid",
    rejected = "rejected"
}
export enum Variant_pending_rejected_accepted {
    pending = "pending",
    rejected = "rejected",
    accepted = "accepted"
}
export enum Variant_rejected_accepted {
    rejected = "rejected",
    accepted = "accepted"
}
export enum Variant_resolved_pending_dismissed {
    resolved = "resolved",
    pending = "pending",
    dismissed = "dismissed"
}
export interface backendInterface {
    addReview(propertyId: bigint, rating: bigint, comment: string): Promise<void>;
    addToWishlist(propertyId: bigint): Promise<void>;
    approveProperty(propertyId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    bookProperty(booking: Booking): Promise<void>;
    createAnnouncement(title: string, message: string, expiresAt: Time | null): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createInquiry(propertyId: bigint, studentName: string, studentPhone: string, inquiryType: Variant_bookVisit_contactOwner, message: string): Promise<void>;
    deactivateAnnouncement(announcementId: bigint): Promise<void>;
    deleteProperty(propertyId: bigint): Promise<void>;
    deleteReview(propertyId: bigint, reviewer: Principal): Promise<void>;
    dismissReport(reportId: bigint): Promise<void>;
    getActiveAnnouncements(): Promise<Array<Announcement>>;
    getAllInquiries(): Promise<Array<Inquiry>>;
    getAnalyticsSummary(): Promise<{
        pendingListings: bigint;
        totalProperties: bigint;
        activeListings: bigint;
        totalReports: bigint;
        totalBookings: bigint;
        totalUsers: bigint;
        totalInquiries: bigint;
    }>;
    getApprovedProperties(): Promise<Array<Property>>;
    getBookings(): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyActiveUserCounts(): Promise<Array<{
        date: string;
        count: bigint;
    }>>;
    getOwnerInquiries(): Promise<Array<Inquiry>>;
    getOwnerNotifications(): Promise<Array<Notification>>;
    getProperties(): Promise<Array<Property>>;
    getProperty(id: bigint): Promise<Property | null>;
    getPropertyBookings(propertyId: bigint): Promise<Array<Booking>>;
    getReports(): Promise<Array<Report>>;
    getReviews(propertyId: bigint): Promise<Array<Review>>;
    getStripePayments(): Promise<string>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserBookings(user: Principal): Promise<Array<Booking>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWishlist(): Promise<Array<bigint>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    isUserBlocked(user: Principal): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listProperty(property: Property): Promise<void>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(notificationId: bigint): Promise<void>;
    removeFromWishlist(propertyId: bigint): Promise<void>;
    requestApproval(): Promise<void>;
    resolveReport(reportId: bigint, actionTaken: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitReport(targetPropertyId: bigint, reason: string, description: string): Promise<void>;
    trackActivity(): Promise<void>;
    trackPropertyView(propertyId: bigint): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unblockUser(user: Principal): Promise<void>;
    updateInquiryStatus(inquiryId: bigint, status: Variant_rejected_accepted): Promise<void>;
    updateProperty(propertyId: bigint, property: Property): Promise<void>;
    verifyProperty(propertyId: bigint): Promise<void>;
}
