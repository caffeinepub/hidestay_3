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
    owner: Principal;
    description: string;
    amenities: Array<string>;
    availableFrom: Time;
    approved: boolean;
    genderPreference: Variant_boys_unisex_girls;
    address: Address;
    pricePerMonth: bigint;
    roomType: Variant_apartment_sharedRoom_single;
    photos: Array<ExternalBlob>;
    coordinates: Coordinates;
    contactPhone: string;
}
export interface Review {
    propertyId: bigint;
    student: Principal;
    rating: bigint;
    comment: string;
    timestamp: Time;
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
export interface backendInterface {
    addReview(propertyId: bigint, rating: bigint, comment: string): Promise<void>;
    addToWishlist(propertyId: bigint): Promise<void>;
    approveProperty(propertyId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bookProperty(booking: Booking): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteReview(propertyId: bigint, reviewer: Principal): Promise<void>;
    getApprovedProperties(): Promise<Array<Property>>;
    getBookings(): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProperties(): Promise<Array<Property>>;
    getProperty(id: bigint): Promise<Property | null>;
    getPropertyBookings(propertyId: bigint): Promise<Array<Booking>>;
    getReviews(propertyId: bigint): Promise<Array<Review>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserBookings(user: Principal): Promise<Array<Booking>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWishlist(): Promise<Array<bigint>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listProperty(property: Property): Promise<void>;
    removeFromWishlist(propertyId: bigint): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateProperty(propertyId: bigint, property: Property): Promise<void>;
}
