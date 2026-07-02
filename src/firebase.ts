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
          image: "https://j.top4top.io/p_3834lfb1o1.png"
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
          description: "رحلة سيكولوجية وفلسفية ممعنة في الغموض، تبحر بالقارئ في الفضاءات الفاصلة بين الحلم والحقيقة، والوعي واللاوعي؛ حيث يسرد العمل قصة الغوص في سراديب النفس البشرية ومتاهات الذاكرة من خلال بطل يعيش صراعاً مريراً مع 'سلطان النوم' وجبال النعاس التي تثقل جفنيه، محاولاً فك طلاسم الواقع عبر مرآة الأحلام التي تتفكك من حولها جدران العالم، لتتشابك الأحداث وتتساقط الأقنعة أمام الحقيقة العارية والمرة في صياغة ساحرة لجدلية الطموح الإنساني والمخاوف الوجودية.",
          image: "https://images.unsplash.com/photo-1531988042231-d39a9cc12a9a?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "جريفونيا",
          type: "سيناريو",
          year: "2022",
          price: 200,
          description: "نص درامي حركي مكتوب بأسلوب السيناريو، يمزج بين الواقعية المؤلمة وأجواء الخيال العلمي والديستوبيا المستقبلية، مستعرضاً تفاوت الطبقات الصارخ وصرخات الوجع الإنساني خلف أسوار إلكترونية منيعة لصرح طبي شاهق، يتناقض بحدة مع البؤس والمباني المتهالكة المحيطة به، ويتتبع الصراع الأليم لأب مكلوم يسعى لإنقاذ ابنه المريض، ليتطور النص يناقش فرضيات بيولوجية وتأثيرات علمية معقدة على خلايا الدماغ في قالب من التشويق السياسي والأمني والصراع المستميت من أجل البقاء والعدالة.",
          image: "https://images.unsplash.com/photo-1478720143022-385f704d3b6f?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "ملحمة أم المماليك",
          type: "رواية",
          year: "2021",
          price: 160,
          description: "لوحة تاريخية مهيبة تنبض بعبق المحروسة، تستحضر حقبة حرجة من تاريخ مصر المملوكي وتدافع القوى الاستعمارية، متمحورة حول مسيرة 'نفيسة البيضا' الاستثنائية من جارية وئدت طفولتها في أسواق النخاسة إلى سيدة مهابة تقود مصائر الرجال وتدير كواليس الحكم بذكاء فذ، ليغوص الكاتب في صراعات عنيفة وتحالفات متقلبة بين أقطاب تلك المرحلة مثل علي بك الكبير ومراد بك، راصداً قصة الشغف، السلطة، الخيانة، وصمود المرأة في وجه عواصف السياسة العاتية بأسلوب يجمع بين دقة المؤرخ وعاطفة الشاعر.",
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
          description: "مجموعة تفيض بعبق الحارات المصرية العتيقة وسحر الواقعية السحرية في حي الجمالية، تفتتح بحكاية صانع موازين عتيق تحيل أصابعه المعدن الصامت إلى تحف فنية نابضة بالدقة المطلقة، وتتصاعد أحداثها حين يأتيه فتوة جبار بميزان ذهبي أثري خرب مأخوذ من كنوز الفراعنة لإصلاحه، لتمتد المجموعة وتستعرض تركيبات عجيبة تقلب وعي المجتمع وتحوله إلى مسرح كبير يعيش فيه كل فرد بطولته الوهمية، طارحةً بأسلوب أدبي بديع معضلات العدالة، واختلال موازين القوى، والفوضى الوجودية.",
          image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "فأر أبيض لا يحب الجبن",
          type: "مجموعة قصصية",
          price: 100,
          description: "تجربة إبداعية مغايرة تنتمي لأدب الفلسفة الرمزية والواقعية السحرية، تنحي البشر جانباً لتصبح الكائنات الصامتة والحيوانات والأشياء المهملة هي الروّاة الحقيقيين والأبطال الفاعلين الذين يمتلكون وعياً حاداً ولساناً فصيحاً ينتقد عالم البشر ويكشف زيفه؛ انطلاقاً من فأر تجارب يتمرد على غريزته ويرفض الجبن الذي يراه فخاً للاستعباد، لتطرح المجموعة عبر السخرية السوداء والمرارة الفلسفية تساؤلات قاسية حول جدلية الحرية والعبودية، والنزوع نحو التمرد وصناعة المصير بعيداً عن الوصاية البشرية.",
          image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400"
        },
        {
          title: "حبيس الزمن",
          type: "قصة قصيرة",
          year: "2022",
          price: 100,
          description: "قصة قصيرة فلسفية حائزة على جائزة iRead لأفضل قصة قصيرة، تأخذ القارئ في رحلة زمنية مثيرة تستكشف أبعاد الذاكرة والكينونة الإنسانية.",
          image: "https://j.top4top.io/p_3834lfb1o1.png"
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

// One-time migration: update book descriptions to the new detailed versions
export async function migrateBookDescriptions() {
  try {
    const booksCol = collection(db, "books");
    const snapshot = await getDocs(booksCol);

    if (snapshot.empty) return;

    const updates: Record<string, string> = {
      "ملحمة أم المماليك": "لوحة تاريخية مهيبة تنبض بعبق المحروسة، تستحضر حقبة حرجة من تاريخ مصر المملوكي وتدافع القوى الاستعمارية، متمحورة حول مسيرة 'نفيسة البيضا' الاستثنائية من جارية وئدت طفولتها في أسواق النخاسة إلى سيدة مهابة تقود مصائر الرجال وتدير كواليس الحكم بذكاء فذ، ليغوص الكاتب في صراعات عنيفة وتحالفات متقلبة بين أقطاب تلك المرحلة مثل علي بك الكبير ومراد بك، راصداً قصة الشغف، السلطة، الخيانة، وصمود المرأة في وجه عواصف السياسة العاتية بأسلوب يجمع بين دقة المؤرخ وعاطفة الشاعر.",
      "حلم البارون الأخير": "رحلة سيكولوجية وفلسفية ممعنة في الغموض، تبحر بالقارئ في الفضاءات الفاصلة بين الحلم والحقيقة، والوعي واللاوعي؛ حيث يسرد العمل قصة الغوص في سراديب النفس البشرية ومتاهات الذاكرة من خلال بطل يعيش صراعاً مريراً مع 'سلطان النوم' وجبال النعاس التي تثقل جفنيه، محاولاً فك طلاسم الواقع عبر مرآة الأحلام التي تتفكك من حولها جدران العالم، لتتشابك الأحداث وتتساقط الأقنعة أمام الحقيقة العارية والمرة في صياغة ساحرة لجدلية الطموح الإنساني والمخاوف الوجودية.",
      "جريفونيا": "نص درامي حركي مكتوب بأسلوب السيناريو، يمزج بين الواقعية المؤلمة وأجواء الخيال العلمي والديستوبيا المستقبلية، مستعرضاً تفاوت الطبقات الصارخ وصرخات الوجع الإنساني خلف أسوار إلكترونية منيعة لصرح طبي شاهق، يتناقض بحدة مع البؤس والمباني المتهالكة المحيطة به، ويتتبع الصراع الأليم لأب مكلوم يسعى لإنقاذ ابنه المريض، ليتطور النص يناقش فرضيات بيولوجية وتأثيرات علمية معقدة على خلايا الدماغ في قالب من التشويق السياسي والأمني والصراع المستميت من أجل البقاء والعدالة.",
      "فأر أبيض لا يحب الجبن": "تجربة إبداعية مغايرة تنتمي لأدب الفلسفة الرمزية والواقعية السحرية، تنحي البشر جانباً لتصبح الكائنات الصامتة والحيوانات والأشياء المهملة هي الروّاة الحقيقيين والأبطال الفاعلين الذين يمتلكون وعياً حاداً ولساناً فصيحاً ينتقد عالم البشر ويكشف زيفه؛ انطلاقاً من فأر تجارب يتمرد على غريزته ويرفض الجبن الذي يراه فخاً للاستعباد، لتطرح المجموعة عبر السخرية السوداء والمرارة الفلسفية تساؤلات قاسية حول جدلية الحرية والعبودية، والنزوع نحو التمرد وصناعة المصير بعيداً عن الوصاية البشرية.",
      "ميزان من ذهب": "مجموعة تفيض بعبق الحارات المصرية العتيقة وسحر الواقعية السحرية في حي الجمالية، تفتتح بحكاية صانع موازين عتيق تحيل أصابعه المعدن الصامت إلى تحف فنية نابضة بالدقة المطلقة، وتتصاعد أحداثها حين يأتيه فتوة جبار بميزان ذهبي أثري خرب مأخوذ من كنوز الفراعنة لإصلاحه، لتمتد المجموعة وتستعرض تركيبات عجيبة تقلب وعي المجتمع وتحوله إلى مسرح كبير يعيش فيه كل فرد بطولته الوهمية، طارحةً بأسلوب أدبي بديع معضلات العدالة، واختلال موازين القوى، والفوضى الوجودية."
    };

    for (const docSnap of snapshot.docs) {
      const title = docSnap.data().title;
      if (updates[title] && docSnap.data().description !== updates[title]) {
        await updateDoc(doc(db, "books", docSnap.id), {
          description: updates[title]
        });
        console.log(`Migration: Updated description for '${title}'`);
      }
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
