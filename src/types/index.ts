export type UserRole = "student" | "alumnus" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  image?: string;
}

export interface AlumniCardData {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  universityName: string;
  course: string;
  country: string;
  graduationYearJbcn: number;
  qsRankingTier: string;
  bio: string | null;
  languages: string[];
  verificationStatus: string;
  isVerifiedJbcnAlumnus: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  avgResponseTimeHours: number | null;
  sessionTypes: SessionTypeData[];
  isSaved: boolean;
}

export interface SessionTypeData {
  id: string;
  type: "call_30" | "call_45" | "call_60" | "group_40";
  pricePaise: number;
  maxParticipants: number;
  descriptionOneLiner: string | null;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export type BookingStatus = "pending_payment" | "payment_submitted" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface BookingData {
  id: string;
  alumnusName: string;
  alumnusPhoto: string | null;
  sessionType: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: BookingStatus;
  meetLink: string | null;
  amountPaise: number;
  canJoin: boolean;
  canReview: boolean;
}

export type PaymentStatus = "awaiting_ref" | "submitted" | "verified" | "rejected";

export interface BookingAlumniInfo {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  universityName: string;
  course: string;
  country: string;
}

export interface BookingSessionTypeInfo {
  id: string;
  type: string;
  pricePaise: number;
  maxParticipants: number;
  descriptionOneLiner: string | null;
}

export interface BookingPaymentInfo {
  id: string;
  bookingId: string;
  amountPaise: number;
  upiTransactionRef: string | null;
  status: string;
  verifiedAt: string | null;
}

export interface BookingReviewInfo {
  id: string;
  rating: number;
  text: string | null;
}

export interface BookingWithDetails {
  id: string;
  studentId: string;
  alumniId: string;
  sessionTypeOfferingId: string;
  status: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  meetLink: string | null;
  createdAt: Date;
  updatedAt: Date;
  alumni: BookingAlumniInfo;
  sessionType: BookingSessionTypeInfo;
  payment: BookingPaymentInfo | null;
  review: BookingReviewInfo | null;
}

export interface CreateBookingInput {
  alumniId: string;
  sessionTypeOfferingId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}

export interface ReviewData {
  id: string;
  rating: number;
  text: string | null;
  reviewerName: string;
  createdAt: string;
}

export interface AdminStats {
  totalAlumni: number;
  totalBookings: number;
  totalRevenuePaise: number;
  pendingReviews: number;
}

export interface AlumniFilters {
  university?: string;
  country?: string;
  course?: string;
  studyLevel?: string;
  gradYearMin?: number;
  gradYearMax?: number;
  qsTiers?: string[];
  priceMin?: number;
  priceMax?: number;
  languages?: string[];
  minRating?: string;
  availability?: "this_week" | "this_month" | "any";
  sessionType?: "1:1" | "group" | "both";
  search?: string;
  sortBy?: "relevance" | "rating" | "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export type AdminAlumniItem = {
  id: string
  userId: string
  fullName: string
  profilePhotoUrl: string | null
  universityName: string
  course: string
  country: string
  graduationYearJbcn: number
  currentStudyLevel: string
  qsRankingTier: string
  bio: string | null
  languages: string
  linkedinUrl: string | null
  verificationStatus: string
  isVerifiedJbcnAlumnus: boolean
  ratingAvg: number | null
  ratingCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  user: { email: string }
  sessionTypes: SessionTypeData[]
}

export type AdminBookingItem = {
  id: string
  studentId: string
  alumniId: string
  status: string
  scheduledStartAt: Date
  scheduledEndAt: Date
  meetLink: string | null
  createdAt: Date
  student: { email: string; studentProfile: { fullName: string } | null }
  alumni: { fullName: string; profilePhotoUrl: string | null }
  payment: { amountPaise: number; status: string } | null
  sessionType: { type: string; pricePaise: number }
}

export type AdminUserItem = {
  id: string
  email: string
  role: string
  createdAt: Date
  studentProfile: { fullName: string } | null
  alumniProfile: { fullName: string; verificationStatus: string } | null
}

export type AdminReviewItem = {
  id: string
  rating: number
  text: string | null
  reviewerType: string
  moderationStatus: string
  createdAt: Date
  alumnus: { fullName: string; profilePhotoUrl: string | null } | null
  booking: {
    student: { email: string; studentProfile: { fullName: string } | null }
  }
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  totalPages: number
  page: number
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
