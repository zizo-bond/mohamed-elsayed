import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  updateDoc,
  query,
  where,
  addDoc,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { Book, Review } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyBI55vGsSXvARv-Y4nKhaxgB8-8nQrU2r8",
  authDomain: "gen-lang-client-0446040294.firebaseapp.com",
  projectId: "gen-lang-client-0446040294",
  storageBucket: "gen-lang-client-0446040294.firebasestorage.app",
  messagingSenderId: "1067224146338",
  appId: "1:1067224146338:web:8a5bf85ca1adb83a3b92fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (with the custom database ID provided in the config)
export const db = getFirestore(app, "ai-studio-mohamedalsayedab-e3c83435-3653-4f4b-adae-98b60f23984f");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seed Books if they don't exist
export async function seedBooksIfEmpty() {
  try {
    const booksCol = collection(db, "books");
    let snapshot;
    try {
      snapshot = await getDocs(booksCol);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "books");
      return;
    }
    
    // Check if "حبيس الزمن" already exists in the snapshot, if not, add it
    const hasHabis = snapshot.docs.some(doc => doc.data().title === "حبيس الزمن");
    if (!snapshot.empty && !hasHabis) {
      try {
        await addDoc(booksCol, {
          title: "حبيس الزمن",
          type: "قصة قصيرة",
          year: "2022",
          price: 100,
          description: "قصة قصيرة فلسفية حائزة على جائزة iRead لأفضل قصة قصيرة، تأخذ القارئ في رحلة زمنية مثيرة تستكشف أبعاد الذاكرة والكينونة الإنسانية.",
          image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400"
        });
        console.log("Firestore successfully migrated: added 'حبيس الزمن'");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "books");
      }
    }

    if (snapshot.empty) {
      const initialBooks: Omit<Book, "id">[] = [
        {
          title: "سينما ريالتو",
          type: "رواية",
          year: "2026",
          price: 150,
          description: "رواية سينمائية ساحرة تدور أحداثها في وسط البلد بالقاهرة، حيث يتقاطع التاريخ مع الحكايات المفقودة لرواد سينما ريالتو العريقة في سرد فلسفي بديع.",
          image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "حلم البارون الأخير",
          type: "رواية",
          year: "2025",
          price: 180,
          description: "رحلة فلسفية داخل أروقة قصر البارون بمصر الجديدة، يمتزج فيها الماضي بالواقع الساحر، حيث يتتبع الكاتب الأسرار النفسية والروحية لساكني القصر.",
          image: "https://images.unsplash.com/photo-1531988042231-d39a9cc12a9a?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "جريفونيا",
          type: "سيناريو",
          year: "2022",
          price: 200,
          description: "نص سينمائي ملحمي مذهل يغوص في عوالم الفانتازيا والتشويق النفسي الدقيق، طارحاً تساؤلات وجودية حول الصراع الأزلي بين الواقع والخيال.",
          image: "https://images.unsplash.com/photo-1478720143022-385f704d3b6f?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "ملحمة أم المماليك",
          type: "رواية",
          year: "2021",
          price: 160,
          description: "رواية تاريخية ملحمية ترصد صراع القوى في مصر المملوكية، وتكشف بتفاصيل لغوية فخمة عن الصراعات النفسية والإنسانية العميقة خلف جدران القصور العتيقة.",
          image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "الأصل والفصل",
          type: "كتاب",
          price: 120,
          description: "دراسة فكرية وعميقة تبحث في الجذور الثقافية والهوية المصرية عبر العصور، برؤية تحليلية تجمع بين علم الاجتماع والأنثروبولوجيا والأدب.",
          image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "ميزان من ذهب",
          type: "مجموعة قصصية",
          price: 110,
          description: "مجموعة من القصص القصيرة المكثفة، حائز بعضها على جوائز أدبية رفيعة، ترسم ببراعة لغوية مواقف إنسانية معقدة ولحظات تجلي نفسية فريدة.",
          image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "فأر أبيض لا يحب الجبن",
          type: "مجموعة قصصية",
          price: 100,
          description: "قصص غريبة سريالية تحلل النفس البشرية بين الواقع والخيال، متسائلة عن ماهية الكينونة والوعي في عصر منقسم وغامض.",
          image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "حبيس الزمن",
          type: "قصة قصيرة",
          year: "2022",
          price: 100,
          description: "قصة قصيرة فلسفية حائزة على جائزة iRead لأفضل قصة قصيرة، تأخذ القارئ في رحلة زمنية مثيرة تستكشف أبعاد الذاكرة والكينونة الإنسانية.",
          image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400"
        }
      ];
 
      const batch = writeBatch(db);
      initialBooks.forEach((bookData) => {
        const newDocRef = doc(collection(db, "books"));
        batch.set(newDocRef, bookData);
      });
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "books");
        return;
      }
      console.log("Firestore successfully seeded with books data!");
    }
  } catch (error) {
    console.error("Error seeding books data: ", error);
  }
}

// One-time migration: rename "نصف كائن" to "فأر أبيض لا يحب الجبن"
export async function migrateBookTitles() {
  try {
    const booksCol = collection(db, "books");
    const q = query(booksCol, where("title", "==", "نصف كائن"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("Migration: No book found with old title, skipping.");
      return;
    }

    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, "books", docSnap.id), {
        title: "فأر أبيض لا يحب الجبن"
      });
      console.log(`Migration: Renamed book ${docSnap.id} to 'فأر أبيض لا يحب الجبن'`);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

// Get reviews for a specific book
export async function getReviewsForBook(bookId: string): Promise<Review[]> {
  try {
    const reviewsCol = collection(db, "books", bookId, "reviews");
    const q = query(reviewsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// Add a new review to a book
export async function addReviewForBook(bookId: string, reviewData: Omit<Review, "id" | "createdAt" | "bookId">) {
  try {
    const reviewsCol = collection(db, "books", bookId, "reviews");
    const newReview = {
      ...reviewData,
      bookId,
      createdAt: serverTimestamp()
    };
    await addDoc(reviewsCol, newReview);
    return true;
  } catch (error) {
    console.error("Error adding review:", error);
    return false;
  }
}
