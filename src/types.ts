export type UserRole = 'shipper' | 'driver' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  company?: string;
  phone?: string;
  is_approved: number;
  created_at: string;
}

export interface Load {
  id: number;
  shipper_id: number;
  shipper_name?: string;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  truck_type: string;
  rate: number;
  contact_details: string;
  status: 'available' | 'pending' | 'completed';
  created_at: string;
}

export interface Truck {
  id: number;
  driver_id: number;
  driver_name?: string;
  current_location: string;
  truck_type: string;
  availability_date: string;
  contact: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface Review {
  id: number;
  reviewer_id: number;
  reviewer_name?: string;
  reviewee_id: number;
  rating: number;
  comment: string;
  created_at: string;
}
