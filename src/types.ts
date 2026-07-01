export interface Book {
  id: string;
  title: string;
  type: string; // 'رواية' | 'سيناريو' | 'كتاب' | 'مجموعة قصصية'
  year?: string;
  price: number;
  description: string;
  image: string; // Dynamic elegant thumbnail gradient or custom URL
}

export interface Review {
  id: string;
  bookId: string;
  userId?: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date | any; // Any allows for Firestore Timestamp
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
}

export interface OrderItem {
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id?: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: 'vodafone_cash' | 'instapay';
  paymentStatus: 'pending_payment' | 'payment_sent' | 'confirmed' | 'cancelled';
  walletNumber: string;
  createdAt: Date;
  notes?: string;
}
