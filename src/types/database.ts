export type UserRole = "guest" | "host";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  host_id: string;
  images: string[];
  max_guests: number;
  created_at?: string;
}

export interface Booking {
  id: string;
  listing_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  payment_note: string;
  created_at?: string;
}

export interface ListingWithHost extends Listing {
  host?: Pick<Profile, "id" | "name" | "email">;
}

export interface BookingWithListing extends Booking {
  listing?: Listing;
}
