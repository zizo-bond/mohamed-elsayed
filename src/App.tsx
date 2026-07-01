import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  User as UserIcon,
  LogOut,
  X,
  Plus,
  Minus,
  Trash2,
  Check,
  BookOpen,
  Award,
  Mail,
  MessageSquare,
  Send,
  Lock,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  DollarSign,
  Menu,
  Phone,
  Copy,
  CheckCircle,
  Smartphone,
  CreditCard,
  ArrowLeft,
  Hash,
  Clock,
  MapPin,
  Facebook,
  Instagram,
  BookMarked,
  Feather,
  Sparkles,
  Eye
} from "lucide-react";

import { auth, db, seedBooksIfEmpty, migrateBookTitles, handleFirestoreError, OperationType } from "./firebase";
import { Book, CartItem } from "./types";
import { Routes, Route, Link } from "react-router-dom";
import BookDetails from "./pages/BookDetails";

import heroImage from "./assets/images/author1.png";
import baronCover from "./assets/images/baron's last dream.jpg";
import malhamaCover from "./assets/images/ملحمة-ام-المماليك.jpg";
import griffoniaCover from "./assets/images/جريفونيا.jpg";
import aslCover from "./assets/images/asl.png";
import farCover from "./assets/images/far.png";
import mizanCover from "./assets/images/ميزان.png";
import rialtoCover from "./assets/images/ريالتو.png";
import habiscover from "./assets/images/حبيس.png";

// Payment constants
const WALLET_NUMBER = "01066059542";
const WHATSAPP_NUMBER = "01066059542";

export default function App() {
  // Loading State
  const [appLoading, setAppLoading] = useState(true);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // E-commerce Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  // Checkout form state
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"vodafone_cash" | "instapay">("vodafone_cash");

  // Books State
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("الكل");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" }[]>([]);

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactLoading, setContactLoading] = useState(false);

  // Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Copied state for wallet number
  const [copied, setCopied] = useState(false);

  // Scroll state for header
  const [scrolled, setScrolled] = useState(false);

  // Animated counters
  const [countersVisible, setCountersVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Add toast helper
  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [booksLoading]);

  // Stats counter observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Seed data & Load Books
  useEffect(() => {
    const initApp = async () => {
      // 1. Seed books into Firestore if it is a fresh instance
      await seedBooksIfEmpty();

      // 1.5 Run one-time migrations
      await migrateBookTitles();

      // 2. Fetch books from Firestore
      try {
        const booksCol = collection(db, "books");
        let snapshot;
        try {
          snapshot = await getDocs(booksCol);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "books");
          throw err;
        }
        const booksList = snapshot.docs.map((doc) => {
          const bookData = doc.data() as Book;
          if (bookData.title === "حلم البارون الأخير") {
            bookData.image = baronCover;
          }
          if (bookData.title === "ملحمة أم المماليك") {
            bookData.image = malhamaCover;
          }
          if (bookData.title === "جريفونيا") {
            bookData.image = griffoniaCover;
          }
          if (bookData.title === "الأصل والفصل") {
            bookData.image = aslCover;
          }
          if (bookData.title === "فأر أبيض لا يحب الجبن") {
            bookData.image = farCover;
          }
          if (bookData.title === "ميزان من ذهب") {
            bookData.image = mizanCover;
          }
          if (bookData.title === "سينما ريالتو") {
            bookData.image = rialtoCover;
          }
          if (bookData.title === "حبيس الزمن") {
            bookData.image = habiscover;
          }
          return {
            id: doc.id,
            ...bookData
          };
        }) as Book[];

        // Sort books by year descending or custom order
        const sortedBooks = booksList.sort((a, b) => {
          const yearA = parseInt(a.year || "0", 10);
          const yearB = parseInt(b.year || "0", 10);
          return yearB - yearA;
        });
        setBooks(sortedBooks);
      } catch (err) {
        console.error("Error fetching books:", err);
        addToast("عذراً، فشل تحميل الكتب من قاعدة البيانات.", "error");
      } finally {
        setBooksLoading(false);
        // Hide loading screen after data is ready
        setTimeout(() => setAppLoading(false), 800);
      }
    };

    initApp();
  }, []);

  // Monitor Auth State and Load Cart from Firestore or LocalStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Load cart from Firestore for authenticated user
        try {
          const cartRef = doc(db, "users", currentUser.uid);
          let cartSnap;
          try {
            cartSnap = await getDoc(cartRef);
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${currentUser.uid}`);
            throw e;
          }
          if (cartSnap.exists() && cartSnap.data().cart) {
            setCart(cartSnap.data().cart);
          } else {
            // Merge localStorage guest cart into Firestore if exists
            const localCart = localStorage.getItem("guest_cart");
            if (localCart) {
              const parsed = JSON.parse(localCart);
              if (parsed.length > 0) {
                setCart(parsed);
                try {
                  await setDoc(cartRef, { cart: parsed, email: currentUser.email }, { merge: true });
                } catch (e) {
                  handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
                  throw e;
                }
                localStorage.removeItem("guest_cart");
              }
            }
          }
        } catch (e) {
          console.error("Error loading user cart:", e);
        }
      } else {
        // Load cart from localStorage for guest
        const localCart = localStorage.getItem("guest_cart");
        if (localCart) {
          setCart(JSON.parse(localCart));
        } else {
          setCart([]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Cart to storage when it changes
  const updateCartState = async (newCart: CartItem[]) => {
    setCart(newCart);
    if (user) {
      try {
        const cartRef = doc(db, "users", user.uid);
        try {
          await setDoc(cartRef, { cart: newCart, email: user.email }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
          throw e;
        }
      } catch (e) {
        console.error("Error saving user cart to Firestore:", e);
      }
    } else {
      localStorage.setItem("guest_cart", JSON.stringify(newCart));
    }
  };

  // Cart Operations
  const addToCart = (book: Book, openDrawer = false) => {
    const existing = cart.find((item) => item.book.id === book.id);
    let newCart: CartItem[] = [];
    if (existing) {
      newCart = cart.map((item) =>
        item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { book, quantity: 1 }];
    }
    updateCartState(newCart);
    addToast(`تمت إضافة "${book.title}" إلى سلة المشتريات`);
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (bookId: string) => {
    const newCart = cart.filter((item) => item.book.id !== bookId);
    updateCartState(newCart);
    addToast("تمت إزالة الكتاب من السلة", "success");
  };

  const adjustQuantity = (bookId: string, delta: number) => {
    const newCart = cart.map((item) => {
      if (item.book.id === bookId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    updateCartState(newCart);
  };

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        addToast("تم تسجيل الدخول بنجاح! أهلاً بك.");
      } else {
        // Validate signup fields
        if (!signupName.trim()) {
          setAuthError("يرجى إدخال الاسم الكامل.");
          setAuthLoading(false);
          return;
        }
        if (!signupPhone.trim() || signupPhone.length < 11) {
          setAuthError("يرجى إدخال رقم هاتف صحيح (11 رقم على الأقل).");
          setAuthLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Save additional user data to Firestore
        try {
          await setDoc(doc(db, "users", cred.user.uid), {
            email: email,
            displayName: signupName.trim(),
            phone: signupPhone.trim(),
            cart: [],
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${cred.user.uid}`);
        }

        addToast("تم إنشاء الحساب وتسجيل الدخول بنجاح!");
      }
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
      setSignupName("");
      setSignupPhone("");
    } catch (err: any) {
      console.error(err);
      let errMsg = "حدث خطأ ما، يرجى المحاولة لاحقاً.";
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        errMsg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "هذا البريد الإلكتروني مسجل بالفعل.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "البريد الإلكتروني غير صالح.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "كلمة المرور ضعيفة جداً (يجب ألا تقل عن 6 أحرف).";
      } else if (err.code === "auth/too-many-requests") {
        errMsg = "محاولات كثيرة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
      } else if (err.code === "auth/network-request-failed") {
        errMsg = "خطأ في الاتصال بالإنترنت. تأكد من اتصالك وأعد المحاولة.";
      }
      setAuthError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast("تم تسجيل الخروج بنجاح.");
    } catch (e) {
      console.error(e);
    }
  };

  // Checkout flow - show checkout form first
  const initiateCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutForm(true);
  };

  // Checkout API handler with real payment
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!checkoutName.trim() || !checkoutPhone.trim()) {
      addToast("يرجى ملء الاسم ورقم الهاتف.", "error");
      return;
    }

    if (checkoutPhone.trim().length < 11) {
      addToast("يرجى إدخال رقم هاتف صحيح (11 رقم).", "error");
      return;
    }

    setCheckoutLoading(true);
    try {
      let data = null;
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: cart,
            email: user?.email || "",
            customerName: checkoutName.trim(),
            customerPhone: checkoutPhone.trim(),
            paymentMethod: paymentMethod
          })
        });
        if (response.ok) {
          data = await response.json();
        } else {
          console.warn(`Server checkout returned status: ${response.status}. Using client fallback.`);
        }
      } catch (fetchErr) {
        console.warn("API checkout failed, falling back to client-side calculation:", fetchErr);
      }

      // Secure client-side fallback if backend API is not found or fails (for static hosting)
      if (!data || !data.success) {
        const bookPrices: Record<string, number> = {
          "سينما ريالتو": 150,
          "حلم البارون الأخير": 180,
          "جريفونيا": 200,
          "ملحمة أم المماليك": 160,
          "الأصل والفصل": 120,
          "ميزان من ذهب": 110,
          "فأر أبيض لا يحب الجبن": 100
        };

        const generateOrderNumber = () => {
          const now = new Date();
          const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
          const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
          return `ORD-${datePart}-${randomPart}`;
        };

        const orderNumber = generateOrderNumber();
        let totalAmount = 0;
        const verifiedItems = cart.map((item) => {
          const title = item.book ? item.book.title : "كتاب غير معروف";
          const price = bookPrices[title] || (item.book ? item.book.price : 100);
          const qty = item.quantity || 1;
          const itemTotal = price * qty;
          totalAmount += itemTotal;

          return {
            title,
            quantity: qty,
            unitPrice: price,
            totalPrice: itemTotal
          };
        });

        data = {
          success: true,
          message: "تم إنشاء طلبك بنجاح! يرجى تحويل المبلغ لإتمام الطلب.",
          order: {
            orderNumber,
            customerName: checkoutName.trim(),
            customerPhone: checkoutPhone.trim(),
            customerEmail: user?.email || "",
            items: verifiedItems,
            totalAmount,
            currency: "EGP",
            paymentMethod: paymentMethod,
            paymentStatus: "pending_payment",
            createdAt: new Date().toISOString()
          },
          paymentInstructions: {
            walletNumber: WALLET_NUMBER,
            merchantName: "محمد السيد عبد العزيز",
            method: paymentMethod,
            amount: totalAmount,
            currency: "جنيه مصري",
            steps: paymentMethod === 'vodafone_cash' 
              ? [
                  "افتح تطبيق فودافون كاش أو اتصل بـ *9*",
                  `حوّل مبلغ ${totalAmount} جنيه على الرقم ${WALLET_NUMBER}`,
                  `اكتب رقم الطلب في الملاحظات: ${orderNumber}`,
                  "أرسل صورة إيصال التحويل عبر واتساب على نفس الرقم"
                ]
              : [
                  "افتح تطبيق البنك الخاص بك",
                  `حوّل مبلغ ${totalAmount} جنيه عبر إنستاباي على الرقم ${WALLET_NUMBER}`,
                  `اكتب رقم الطلب في الملاحظات: ${orderNumber}`,
                  "أرسل صورة إيصال التحويل عبر واتساب على نفس الرقم"
                ]
          },
          verifiedItems,
          totalAmount
        };
      }

      if (data.success) {
        // Save order to Firestore
        try {
          await addDoc(collection(db, "orders"), {
            orderNumber: data.order.orderNumber,
            userId: user?.uid || null,
            customerEmail: user?.email || "",
            customerName: checkoutName.trim(),
            customerPhone: checkoutPhone.trim(),
            items: data.verifiedItems,
            totalAmount: data.totalAmount,
            currency: "EGP",
            paymentMethod: paymentMethod,
            paymentStatus: "pending_payment",
            walletNumber: WALLET_NUMBER,
            createdAt: new Date(),
          });
        } catch (firestoreErr) {
          console.error("Error saving order to Firestore:", firestoreErr);
        }

        setCheckoutResult(data);
        // Clear cart
        await updateCartState([]);
        setIsCartOpen(false);
        setShowCheckoutForm(false);
        addToast("تم إنشاء طلبك بنجاح! اتبع تعليمات الدفع.", "success");
      } else {
        addToast(data.message || "فشلت عملية إنشاء الطلب", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("خطأ في الاتصال بالخادم لإتمام الطلب.", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Copy wallet number
  const copyWalletNumber = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_NUMBER);
      setCopied(true);
      addToast("تم نسخ رقم المحفظة بنجاح!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = WALLET_NUMBER;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      addToast("تم نسخ رقم المحفظة بنجاح!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Contact Form Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      addToast("يرجى ملء جميع الحقول المطلوبة.", "error");
      return;
    }
    setContactLoading(true);
    try {
      // Save contact message to firestore
      try {
        await addDoc(collection(db, "contacts"), {
          name: contactName,
          email: contactEmail,
          message: contactMsg,
          timestamp: new Date()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, "contacts");
        throw e;
      }
      addToast("شكراً لرسالتك! سيقوم الكاتب بالرد عليك قريباً.", "success");
      setContactName("");
      setContactEmail("");
      setContactMsg("");
    } catch (e) {
      console.error(e);
      addToast("فشل إرسال الرسالة، يرجى المحاولة لاحقاً.", "error");
    } finally {
      setContactLoading(false);
    }
  };

  // Animated counter component
  const AnimatedCounter = ({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!countersVisible) return;
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [countersVisible, end, duration]);

    return <span>{count}{suffix}</span>;
  };

  // Filter books list
  const filteredBooks = selectedFilter === "الكل"
    ? books
    : books.filter((b) => b.type === selectedFilter || (selectedFilter === "كتب وقصص" && (b.type === "كتاب" || b.type === "مجموعة قصصية")));

  const totalCartAmount = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-dark-main text-light selection:bg-gold selection:text-dark-main relative overflow-x-hidden font-sans">

      {/* ===== LOADING SCREEN ===== */}
      <AnimatePresence>
        {appLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="loading-screen"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-gold/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="font-serif text-2xl font-bold text-gold">محمد السيد عبد العزيز</h2>
                <p className="text-xs text-light/40 tracking-widest uppercase">جارٍ تحميل المنصة الأدبية...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Toast Notifications */}
      <div className="fixed top-24 left-6 z-[60] flex flex-col gap-3 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-lg border flex items-center gap-3 backdrop-blur-md shadow-lg ${toast.type === "success"
                  ? "bg-dark-card/90 border-gold/40 text-gold shadow-gold/10"
                  : "bg-red-950/90 border-red-500/40 text-red-200"
                }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type === "success" ? "bg-gold" : "bg-red-500"}`} />
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ===== STICKY HEADER & NAVIGATION ===== */}
      <header id="header" className={`sticky top-0 z-40 transition-all duration-500 ${scrolled
          ? "bg-dark-main/95 backdrop-blur-xl border-b border-gold/20 shadow-lg shadow-black/20"
          : "bg-dark-main border-b border-gold/10"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">

          {/* Right Side: Logo */}
          <div className="flex items-center gap-4">
            <a href="#" className="flex flex-col group">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-gold group-hover:opacity-90 transition-opacity">
                محمد السيد عبد العزيز
              </span>
              <span className="text-[9px] sm:text-[10px] font-serif tracking-[0.15em] uppercase text-gold/60 mr-1">
                روائي وقاص مصري
              </span>
            </a>
          </div>

          {/* Middle: Elegant Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-serif tracking-wide text-light/85">
            <a href="#" className="hover:text-gold transition-colors duration-200 relative group">
              الرئيسية
              <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#about" className="hover:text-gold transition-colors duration-200 relative group">
              عن الكاتب
              <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#library" className="hover:text-gold transition-colors duration-200 relative group">
              إصداراتي
              <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#awards" className="hover:text-gold transition-colors duration-200 relative group">
              الجوائز
              <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#contact" className="hover:text-gold transition-colors duration-200 relative group">
              تواصل
              <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-300" />
            </a>
          </nav>

          {/* Left Side: Auth & Shopping Cart & Mobile Menu */}
          <div className="flex items-center gap-3 sm:gap-6">

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 border border-gold/50 px-3 sm:px-4 py-1.5 rounded-full text-xs text-gold hover:bg-gold/5 transition-all cursor-pointer"
            >
              <ShoppingBag size={13} className="text-gold" />
              <span className="font-serif font-bold hidden sm:inline">السلة</span>
              <span className="bg-gold text-dark-main w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold">
                {totalCartCount}
              </span>
            </button>

            {/* Dynamic User Profile / Login */}
            {user ? (
              <div className="hidden sm:flex items-center gap-3 bg-dark-card border border-gold/20 rounded-full px-4 py-1.5 text-xs text-light">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="max-w-[120px] truncate">{user.email}</span>
                <button
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                  className="hover:text-gold text-light/60 transition-colors p-1 cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                className="bg-gold text-dark-main text-xs font-bold px-4 sm:px-5 py-2 rounded shadow-lg shadow-gold/10 hover:bg-[#B49027] transition-all cursor-pointer"
              >
                دخول
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-gold/20 hover:border-gold/40 text-gold transition-all cursor-pointer"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 mobile-menu-overlay z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-[280px] bg-dark-card border-l border-gold/20 z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gold/10 flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-gold">القائمة</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-dark-main text-light/60 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 p-6 space-y-2">
                {[
                  { label: "الرئيسية", href: "#" },
                  { label: "عن الكاتب", href: "#about" },
                  { label: "إصداراتي", href: "#library" },
                  { label: "الجوائز", href: "#awards" },
                  { label: "تواصل", href: "#contact" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-light/80 hover:text-gold hover:bg-gold/5 transition-all font-serif text-sm border border-transparent hover:border-gold/10"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* User info in mobile menu */}
              <div className="p-6 border-t border-gold/10">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-light/60">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full text-center text-xs text-red-400 border border-red-500/20 py-2 rounded-lg hover:bg-red-950/20 transition-all cursor-pointer"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAuthMode("login"); setShowAuthModal(true); setMobileMenuOpen(false); }}
                    className="w-full bg-gold text-dark-main text-xs font-bold py-2.5 rounded-lg cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={
          <>
            {/* ===== HERO SECTION ===== */}
            <section id="hero" className="relative w-full min-h-[65vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with absolute overlay gradient */}
        <div className="absolute inset-0 z-0">
          <img
            id="hero-image"
            src={heroImage}
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1600";
            }}
            alt="الروائي محمد السيد عبد العزيز"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-90"
            style={{ animation: "heroZoom 30s ease-in-out infinite alternate" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-main via-dark-main/70 to-dark-main/20" />
          <div className="absolute inset-0 bg-gradient-to-l from-dark-main/30 via-transparent to-dark-main/30" />
        </div>

        {/* Sparkle Particles */}
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gold/40 rounded-full"
              style={{
                top: `${15 + Math.random() * 70}%`,
                left: `${10 + Math.random() * 80}%`,
                animation: `sparkle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 lg:px-12 xl:px-24 flex justify-end mt-12">
          <div className="max-w-lg text-left w-full">
            {/* Subtle Watermark behind text */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.04] text-[120px] sm:text-[200px] font-bold text-gold select-none pointer-events-none font-serif z-0">
              سرد
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 relative z-10 flex flex-col items-start"
              dir="ltr"
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-gold text-xs uppercase tracking-[0.25em] mb-2 inline-flex items-center gap-2 font-serif bg-gold/5 border border-gold/20 px-4 py-1.5 rounded-full"
                dir="rtl"
              >
                <Feather size={12} />
                روائي وقاص مصري
              </motion.span>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-tight md:leading-[1.15] text-left" dir="rtl">
                سرد يلامس الوجدان <br />
                <span className="text-gold-gradient">ويطرح تساؤلات الوجود</span>
              </h1>

              <div className="hidden md:block max-w-xl py-2 w-full text-left" dir="rtl">
                <p className="text-[#EAEAEA]/85 text-sm md:text-base leading-relaxed italic border-l-2 border-gold pl-4 text-left">
                  "مشروعي الأدبي يجمع بين العمق الفني والجمال اللغوي، موظفاً الفانتازيا والواقعية السحرية ليسرد حكايات تلامس وجدان القارئ وتثير لديه التساؤلات الفلسفية."
                </p>
              </div>

              <p className="max-w-2xl text-light/70 text-sm md:text-base leading-relaxed font-light text-left w-full" dir="rtl">
                مرحباً بكم في الصالون الأدبي للروائي والقاصّ المصري محمد السيد عبد العزيز. رحلة في عوالم الفانتازيا الفلسفية التي تأسر القلوب وتوقظ الفكر.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4 w-full" dir="rtl">
                <a
                  href="#library"
                  className="w-full sm:w-auto bg-gold hover:bg-[#B49027] text-dark-main font-bold px-8 py-3 rounded shadow-lg shadow-gold/10 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>اكتشف أعمالي</span>
                  <ChevronLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
                </a>
                <a
                  href="#about"
                  className="w-full sm:w-auto border border-gold text-gold hover:bg-gold/5 font-bold px-8 py-3 rounded transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>عن الكاتب</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Elegant scroll down indicator */}
        <a href="#about" className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
          <span className="text-[10px] font-mono tracking-widest text-gold uppercase">اسحب للأسفل</span>
          <div className="w-5 h-8 border-2 border-gold/30 rounded-full flex justify-center p-1">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1 h-2 bg-gold rounded-full"
            />
          </div>
        </a>
      </section>

      {/* ===== ANIMATED STATS SECTION ===== */}
      <section ref={statsRef} className="relative py-16 bg-gradient-to-b from-dark-main to-[#0D0D12] border-b border-gold/10 overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: <BookOpen size={24} />, value: 7, suffix: "+", label: "أعمال أدبية منشورة" },
              { icon: <Award size={24} />, value: 1, suffix: "", label: "جائزة أدبية كبرى" },
              { icon: <Calendar size={24} />, value: 2021, suffix: "", label: "بداية المسيرة الأدبية" },
              { icon: <Eye size={24} />, value: 5, suffix: "+", label: "سنوات من الإبداع" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={countersVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center p-6 rounded-xl bg-dark-card/50 border border-gold/10 hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="text-gold/60 group-hover:text-gold transition-colors flex justify-center mb-3">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-serif font-bold text-gold mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] sm:text-xs text-light/40 font-serif">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT THE AUTHOR SECTION ===== */}
      <section id="about" className="py-24 border-t border-gold/10 bg-[#0D0D12] relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Bio Column */}
            <div className="lg:col-span-7 space-y-8 scroll-reveal">
              <div className="space-y-2">
                <span className="text-gold font-serif text-xs uppercase tracking-[0.2em] mb-2 block flex items-center gap-2">
                  <Sparkles size={12} />
                  من أنا
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">من هو محمد السيد عبد العزيز؟</h2>
                <div className="w-16 h-[1px] bg-gold/50" />
              </div>

              <p className="text-[#EAEAEA]/95 text-lg leading-relaxed font-serif font-light">
                صيدلي، وروائي مصري يرتكز مشروعه على تقديم أعمال تجمع بين العمق الفني والجمال اللغوي. أسعى من خلال كتاباتي إلى سرد حكايات تلامس وجدان القارئ وتثير لديه التساؤلات الفلسفية والوجودية، موظفاً الفانتازيا والواقعية السحرية.
              </p>

              {/* Awards Box */}
              <div id="awards" className="bg-[#1A1A24] border border-[#D4AF37]/30 p-5 rounded-xl flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all shadow-lg shadow-[#D4AF37]/5 group">
                <div className="text-3xl p-3 bg-dark-main rounded-xl border border-gold/20 group-hover:scale-110 transition-transform">🏆</div>
                <div>
                  <h4 className="text-[#D4AF37] text-xs font-serif font-bold tracking-[0.1em] uppercase mb-1">جائزة iRead</h4>
                  <p className="text-[#EAEAEA] text-sm leading-relaxed font-serif">
                    أفضل قصة قصيرة عن عمل <span className="text-gold underline underline-offset-4 font-bold">"حبيس الزمن"</span>
                  </p>
                  <p className="text-[10px] text-light/40 mt-1 font-serif">
                    المنصة العربية الأكبر المعنية برعاية وتقدير الإبداع الأدبي في مصر والوطن العربي.
                  </p>
                </div>
              </div>
            </div>

            {/* Showcase Visual column */}
            <div className="lg:col-span-5 flex justify-center scroll-reveal">
              <div className="relative group max-w-md w-full">
                {/* Decorative glowing background frame */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-transparent rounded-xl blur-xl group-hover:scale-102 transition-transform duration-500" />

                {/* Book Collage Visual Representation */}
                <div className="relative bg-[#1A1A24] border border-gold/25 p-8 rounded-xl shadow-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full" />

                  <div className="flex flex-col items-center text-center space-y-6">
                    <BookOpen size={40} className="text-gold opacity-80" />

                    <h3 className="text-xl font-serif text-white font-semibold tracking-wide">بصمة أدبية فريدة</h3>
                    <p className="text-light/60 text-xs sm:text-sm leading-relaxed italic font-serif">
                      "الكتابة بالنسبة لي ليست مجرد صياغة كلمات، بل هي استكشاف للمجهول داخل الروح، ومحاولة لمسح الغبار عن الأسئلة الصامتة التي نخشى مواجهتها."
                    </p>

                    <div className="w-full pt-4 border-t border-gold/10 grid grid-cols-3 gap-2 text-center font-serif">
                      <div>
                        <div className="text-gold font-bold text-lg">7+</div>
                        <div className="text-[10px] text-light/40 uppercase tracking-wider">أعمال منشورة</div>
                      </div>
                      <div>
                        <div className="text-gold font-bold text-lg">2021</div>
                        <div className="text-[10px] text-light/40 uppercase tracking-wider">بداية المشوار الأدبي</div>
                      </div>
                      <div>
                        <div className="text-gold font-bold text-lg">1</div>
                        <div className="text-[10px] text-light/40 uppercase tracking-wider">جوائز كبرى</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== LIBRARY (إصداراتي) ===== */}
      <section id="library" className="py-24 border-t border-gold/10 bg-[#0D0D12] relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 scroll-reveal">
            <div className="space-y-2">
              <span className="text-[#D4AF37] text-xs uppercase tracking-[0.2em] mb-2 flex items-center gap-2 font-serif">
                <BookMarked size={12} />
                المكتبة المختارة
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">المكتبة الرقمية وإصداراتي الأدبية</h2>
              <div className="w-16 h-[1px] bg-gold/50" />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 bg-[#1A1A24] border border-[#D4AF37]/20 p-1.5 rounded-lg">
              {["الكل", "رواية", "سيناريو", "كتب وقصص"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-5 py-2 rounded-lg text-xs font-serif transition-all duration-300 cursor-pointer ${selectedFilter === filter
                      ? "bg-[#D4AF37] text-[#0D0D12] font-bold shadow-md shadow-gold/20"
                      : "text-light/70 hover:text-white hover:bg-[#1A1A24]/55"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Skeletons or Books Grid */}
          {booksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#1A1A24] border border-gold/10 rounded-xl h-[450px] animate-pulse p-6 space-y-6">
                  <div className="bg-[#0D0D12] rounded-lg w-full h-[220px]" />
                  <div className="h-6 bg-[#0D0D12] rounded w-3/4" />
                  <div className="h-4 bg-[#0D0D12] rounded w-1/2" />
                  <div className="h-12 bg-[#0D0D12] rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16 bg-[#1A1A24] rounded-xl border border-gold/10">
              <BookOpen size={48} className="text-[#D4AF37]/40 mx-auto mb-4" />
              <p className="text-light/60 font-serif">لا توجد أعمال تطابق هذا التصنيف حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group bg-[#1A1A24] border border-white/5 rounded-xl overflow-hidden shadow-2xl hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between h-full hover:shadow-gold/5"
                >

                  {/* Card Content Top */}
                  <div>
                    {/* Book Cover Image */}
                    <div className="relative overflow-hidden h-[300px] bg-[#0D0D12] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A24] via-transparent to-transparent z-10" />
                      <img
                        src={book.image}
                        alt={book.title}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Tag & Year */}
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <span className="bg-[#D4AF37] text-[#0D0D12] font-serif font-bold text-[10px] px-2.5 py-1 rounded">
                          {book.type}
                        </span>
                        {book.year && (
                          <span className="bg-[#0D0D12]/85 text-[#D4AF37] text-[10px] px-2.5 py-1 rounded font-serif border border-[#D4AF37]/30">
                            {book.year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Book Meta */}
                    <div className="p-6 space-y-3">
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-gold transition-colors duration-200">
                        {book.title}
                      </h3>

                      <p className="text-light/60 text-xs sm:text-sm line-clamp-3 leading-relaxed font-serif font-light">
                        {book.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Action / Price Bottom */}
                  <div className="p-6 pt-0 space-y-4">
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-light/50 text-[11px] font-serif">سعر النسخة</span>
                      <span className="text-lg font-serif font-bold text-[#D4AF37]">
                        {book.price} <span className="text-[10px] font-sans">جنيه</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(book, true)}
                        className="flex-1 bg-transparent border border-[#D4AF37] text-[#D4AF37] text-xs py-2.5 rounded-lg hover:bg-[#D4AF37] hover:text-[#0D0D12] transition-all font-serif font-bold cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={12} />
                        شراء
                      </button>
                      <Link
                        to={`/book/${book.id}`}
                        onClick={() => window.scrollTo(0, 0)}
                        className="flex-1 bg-[#1A1A24] border border-white/10 text-white text-xs py-2.5 rounded-lg hover:border-[#D4AF37]/50 transition-all font-serif cursor-pointer text-center"
                      >
                        تفاصيل
                      </Link>
                    </div>
                  </div>

                </motion.div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ===== CONTACT THE AUTHOR ===== */}
      <section id="contact" className="py-24 border-t border-gold/10 bg-gradient-to-b from-[#0D0D12] to-dark-card relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* Contact Details Left */}
            <div className="lg:col-span-5 space-y-8 scroll-reveal">
              <div className="space-y-2">
                <span className="text-[#D4AF37] text-xs uppercase tracking-[0.2em] mb-2 flex items-center gap-2 font-serif">
                  <MessageSquare size={12} />
                  تواصل مباشر
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">تواصل مع الكاتب</h2>
                <div className="w-16 h-[1px] bg-gold/50" />
              </div>

              <p className="text-light/70 text-base leading-relaxed font-serif font-light">
                يسعد الكاتب الروائي محمد السيد عبد العزيز تلقي آرائكم النقدية، واستفساراتكم حول الإصدارات، والمشاركات في الندوات واللقاءات الثقافية والتلفزيونية.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A24] border border-[#D4AF37]/20 shadow-md hover:border-gold/40 transition-all">
                  <div className="text-[#D4AF37] bg-[#D4AF37]/10 p-2.5 rounded-lg border border-[#D4AF37]/20">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h5 className="text-[10px] text-light/40 uppercase tracking-wider font-serif">البريد الإلكتروني المباشر</h5>
                    <p className="text-sm font-semibold text-[#D4AF37] font-serif">zizobond36@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A24] border border-[#D4AF37]/20 shadow-md hover:border-gold/40 transition-all">
                  <div className="text-[#D4AF37] bg-[#D4AF37]/10 p-2.5 rounded-lg border border-[#D4AF37]/20">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h5 className="text-[10px] text-light/40 uppercase tracking-wider font-serif">واتساب / هاتف</h5>
                    <p className="text-sm font-semibold text-[#D4AF37] font-serif" dir="ltr">{WALLET_NUMBER}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A24] border border-[#D4AF37]/20 shadow-md hover:border-gold/40 transition-all">
                  <div className="text-[#D4AF37] bg-[#D4AF37]/10 p-2.5 rounded-lg border border-[#D4AF37]/20">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h5 className="text-[10px] text-light/40 uppercase tracking-wider font-serif">المقر الأدبي</h5>
                    <p className="text-sm font-semibold text-light font-serif">القاهرة، جمهورية مصر العربية</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Right */}
            <div className="lg:col-span-7 bg-[#1A1A24] p-8 rounded-xl border border-gold/25 shadow-2xl scroll-reveal">
              <h3 className="text-xl font-serif text-white font-bold mb-6 flex items-center gap-2">
                <Send size={16} className="text-[#D4AF37]" />
                <span>إرسال رسالة مباشرة للكاتب</span>
              </h3>

              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-light/70 font-serif">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="أدخل اسمك الكريم"
                      className="w-full bg-dark-main border border-gold/20 focus:border-gold rounded-lg px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all font-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-light/70 font-serif">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-dark-main border border-gold/20 focus:border-gold rounded-lg px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all text-left font-serif"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-light/70 font-serif">نص الرسالة *</label>
                  <textarea
                    required
                    rows={5}
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="اكتب انطباعك عن الروايات أو رسالتك الأدبية هنا..."
                    className="w-full bg-dark-main border border-gold/20 focus:border-gold rounded-lg px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all resize-none font-serif"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full bg-gold hover:bg-[#B49027] text-dark-main font-serif font-bold py-3.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
                >
                  {contactLoading ? (
                    <div className="w-5 h-5 border-2 border-dark-main border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>إرسال الرسالة الآن</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

          </>
        } />
        <Route path="/book/:id" element={<BookDetails books={books} addToCart={addToCart} user={user} />} />
      </Routes>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0A0A0E] border-t border-gold/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Footer Top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-gold">محمد السيد عبد العزيز</h3>
              <p className="text-xs text-light/40 leading-relaxed font-serif">
                روائي وقاص مصري. يرتكز مشروعه الأدبي على تقديم أعمال تجمع بين العمق الفني والجمال اللغوي، موظفاً الفانتازيا والواقعية السحرية.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="w-9 h-9 rounded-lg bg-dark-card border border-gold/10 hover:border-gold/40 flex items-center justify-center text-light/40 hover:text-gold transition-all">
                  <Facebook size={14} />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-dark-card border border-gold/10 hover:border-gold/40 flex items-center justify-center text-light/40 hover:text-gold transition-all">
                  <Instagram size={14} />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-dark-card border border-gold/10 hover:border-gold/40 flex items-center justify-center text-light/40 hover:text-gold transition-all">
                  <BookOpen size={14} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-serif font-bold text-white">روابط سريعة</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "الرئيسية", href: "#" },
                  { label: "عن الكاتب", href: "#about" },
                  { label: "إصداراتي", href: "#library" },
                  { label: "الجوائز", href: "#awards" },
                  { label: "تواصل", href: "#contact" },
                  { label: "المتجر", href: "#library" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs text-light/40 hover:text-gold transition-colors font-serif py-1"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-serif font-bold text-white">طرق الدفع المتاحة</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-light/50">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <Smartphone size={14} />
                  </div>
                  <span className="font-serif">فودافون كاش</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-light/50">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <CreditCard size={14} />
                  </div>
                  <span className="font-serif">إنستاباي</span>
                </div>
                <p className="text-[10px] text-light/30 font-serif">رقم المحفظة: {WALLET_NUMBER}</p>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-white/30 font-serif">
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} - الروائي محمد السيد عبد العزيز
            </div>
            <div className="flex items-center gap-1">
              <span>صُنع بـ</span>
              <span className="text-gold">♥</span>
              <span>للأدب العربي</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== SHOPPING CART DRAWER (Slide-in) ===== */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCartOpen(false); setShowCheckoutForm(false); }}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-dark-card border-l border-gold/10 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-gold/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="text-gold" size={20} />
                  <h3 className="font-serif text-lg font-bold text-white">
                    {showCheckoutForm ? "بيانات الطلب" : "سلة المشتريات"}
                  </h3>
                  {!showCheckoutForm && (
                    <span className="text-[10px] bg-gold/10 text-gold px-2.5 py-0.5 rounded-full font-bold">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setIsCartOpen(false); setShowCheckoutForm(false); }}
                  className="p-1 rounded-lg hover:bg-dark-main text-light/60 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Checkout Form View */}
              {showCheckoutForm ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={handleCheckout} className="space-y-5">
                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => setShowCheckoutForm(false)}
                      className="flex items-center gap-2 text-xs text-gold hover:underline cursor-pointer"
                    >
                      <ChevronRight size={14} />
                      <span>العودة للسلة</span>
                    </button>

                    {/* Order Summary */}
                    <div className="p-4 bg-dark-main rounded-xl border border-gold/10 space-y-2">
                      <div className="flex justify-between text-xs text-light/60">
                        <span>عدد العناصر</span>
                        <span>{totalCartCount} نسخة</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white">المجموع</span>
                        <span className="text-gold font-serif">{totalCartAmount} جنيه</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                        <UserIcon size={14} className="text-gold" />
                        بيانات المشتري
                      </h4>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-light/70">الاسم الكامل *</label>
                        <input
                          type="text"
                          required
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          placeholder="أدخل اسمك الكامل"
                          className="w-full bg-dark-main border border-gold/20 focus:border-gold rounded-lg px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all font-serif"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-light/70">رقم الهاتف *</label>
                        <input
                          type="tel"
                          required
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="w-full bg-dark-main border border-gold/20 focus:border-gold rounded-lg px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all text-left font-serif"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                        <CreditCard size={14} className="text-gold" />
                        طريقة الدفع
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("vodafone_cash")}
                          className={`payment-card p-4 rounded-xl border text-center cursor-pointer ${paymentMethod === "vodafone_cash"
                              ? "selected border-gold bg-gold/5"
                              : "border-white/10 hover:border-gold/30"
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
                            <Smartphone size={18} className="text-red-400" />
                          </div>
                          <span className="text-xs font-bold text-white block">فودافون كاش</span>
                          <span className="text-[10px] text-light/40">Vodafone Cash</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("instapay")}
                          className={`payment-card p-4 rounded-xl border text-center cursor-pointer ${paymentMethod === "instapay"
                              ? "selected border-gold bg-gold/5"
                              : "border-white/10 hover:border-gold/30"
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-2">
                            <CreditCard size={18} className="text-blue-400" />
                          </div>
                          <span className="text-xs font-bold text-white block">إنستاباي</span>
                          <span className="text-[10px] text-light/40">InstaPay</span>
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full bg-gold hover:bg-[#B49027] text-dark-main font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gold/10 disabled:opacity-50 cursor-pointer"
                    >
                      {checkoutLoading ? (
                        <div className="w-5 h-5 border-2 border-dark-main border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>تأكيد الطلب والمتابعة للدفع</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-24 space-y-4">
                        <ShoppingBag size={48} className="text-gold/20 mx-auto" />
                        <p className="text-light/50 text-sm">السلة فارغة حالياً. تصفح المكتبة وأضف روايتك المفضلة.</p>
                        <a
                          href="#library"
                          onClick={() => setIsCartOpen(false)}
                          className="inline-block text-xs text-gold border border-gold/30 hover:border-gold px-4 py-2 rounded-lg transition-all cursor-pointer text-center"
                        >
                          تصفح المكتبة
                        </a>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.book.id}
                          className="p-4 rounded-xl bg-dark-main border border-gold/5 flex gap-4 relative group"
                        >
                          <img
                            src={item.book.image}
                            alt={item.book.title}
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-20 object-cover rounded-md bg-dark-card flex-shrink-0"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full font-bold">
                                {item.book.type}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1.5">{item.book.title}</h4>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              {/* Quantity control */}
                              <div className="flex items-center border border-gold/20 rounded-md">
                                <button
                                  onClick={() => adjustQuantity(item.book.id, -1)}
                                  className="p-1 text-light/60 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-3 text-xs font-mono font-bold text-gold">{item.quantity}</span>
                                <button
                                  onClick={() => adjustQuantity(item.book.id, 1)}
                                  className="p-1 text-light/60 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <span className="text-sm font-serif font-bold text-gold">
                                {item.book.price * item.quantity} جنيه
                              </span>
                            </div>
                          </div>

                          {/* Remove item button */}
                          <button
                            onClick={() => removeFromCart(item.book.id)}
                            className="absolute top-4 left-4 p-1 rounded hover:bg-red-950/20 text-light/30 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="حذف من السلة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer Checkout info */}
                  {cart.length > 0 && (
                    <div className="p-6 border-t border-gold/10 bg-dark-main space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-light/60">
                          <span>إجمالي عدد النسخ</span>
                          <span>{totalCartCount} نسخة</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-white">المجموع النهائي</span>
                          <span className="text-xl font-serif font-bold text-gold">{totalCartAmount} جنيه مصري</span>
                        </div>
                      </div>

                      <button
                        onClick={initiateCheckout}
                        className="w-full bg-gold hover:bg-gold/90 text-dark-main font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gold/10 cursor-pointer"
                      >
                        <Lock size={14} />
                        <span>متابعة إتمام الطلب</span>
                      </button>

                      <div className="flex items-center justify-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-light/30">
                          <Smartphone size={10} />
                          <span>فودافون كاش</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-light/30">
                          <CreditCard size={10} />
                          <span>إنستاباي</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== FIREBASE AUTHENTICATION DIALOG (Modal) ===== */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 cursor-pointer"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-dark-card border border-gold/25 rounded-2xl shadow-gold-glow p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 left-5 p-1 text-light/40 hover:text-white rounded-lg hover:bg-dark-main transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2">
                <span className="font-serif text-lg font-bold text-gold">المنصة الأدبية للكاتب</span>
                <h3 className="text-2xl font-serif font-bold text-white">
                  {authMode === "login" ? "تسجيل دخول الأعضاء" : "إنشاء حساب جديد"}
                </h3>
                <p className="text-xs text-light/50">
                  {authMode === "login"
                    ? "سجل دخولك لحفظ مشترياتك ومتابعة أحدث الروايات فور صدورها."
                    : "أنشئ حساباً لتتمكن من حفظ سلة المشتريات ومتابعة طلباتك."
                  }
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-300 text-center">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Signup-only fields */}
                {authMode === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-light/70 flex items-center gap-1.5">
                        <UserIcon size={12} className="text-gold" />
                        الاسم الكامل *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full bg-dark-main border border-gold/10 focus:border-gold rounded-xl px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all font-serif"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-light/70 flex items-center gap-1.5">
                        <Phone size={12} className="text-gold" />
                        رقم الهاتف *
                      </label>
                      <input
                        type="tel"
                        required
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="w-full bg-dark-main border border-gold/10 focus:border-gold rounded-xl px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all text-left"
                        dir="ltr"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-light/70">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-dark-main border border-gold/10 focus:border-gold rounded-xl px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-light/70">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark-main border border-gold/10 focus:border-gold rounded-xl px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all text-left"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gold hover:bg-gold/90 text-dark-main font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-dark-main border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{authMode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-gold/10">
                <button
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setAuthError("");
                  }}
                  className="text-xs text-gold/80 hover:text-gold hover:underline cursor-pointer"
                >
                  {authMode === "login" ? "لا تملك حساباً؟ أنشئ حساباً جديداً" : "تمتلك حساباً بالفعل؟ سجل الدخول"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* ===== PAYMENT INSTRUCTIONS MODAL (Vodafone Cash / InstaPay) ===== */}
      <AnimatePresence>
        {checkoutResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutResult(null)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-dark-card border border-gold/30 rounded-2xl shadow-lg p-6 sm:p-8 z-10 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setCheckoutResult(null)}
                className="absolute top-5 left-5 p-1 text-light/40 hover:text-white rounded-lg hover:bg-dark-main transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Success Header */}
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulseGlow">
                  <Check size={28} />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">تم إنشاء طلبك بنجاح!</h3>
                <p className="text-xs text-light/50">يرجى تحويل المبلغ لإتمام عملية الشراء</p>
              </div>

              {/* Order Number */}
              <div className="p-4 bg-dark-main rounded-xl border border-gold/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-gold" />
                  <span className="text-xs text-light/50">رقم الطلب</span>
                </div>
                <span className="text-sm font-mono font-bold text-gold">{checkoutResult.order?.orderNumber}</span>
              </div>

              {/* Payment Details */}
              <div className="p-5 bg-dark-main rounded-xl border border-gold/20 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  {checkoutResult.order?.paymentMethod === 'vodafone_cash' ? (
                    <Smartphone size={16} className="text-red-400" />
                  ) : (
                    <CreditCard size={16} className="text-blue-400" />
                  )}
                  <span>
                    {checkoutResult.order?.paymentMethod === 'vodafone_cash' ? 'الدفع عبر فودافون كاش' : 'الدفع عبر إنستاباي'}
                  </span>
                </div>

                {/* Wallet Number with Copy */}
                <div className="flex items-center justify-between p-3 bg-gold/5 border border-gold/20 rounded-lg animate-borderGlow">
                  <div>
                    <span className="text-[10px] text-light/40 block">رقم المحفظة</span>
                    <span className="text-lg font-bold text-gold font-mono tracking-wider" dir="ltr">{WALLET_NUMBER}</span>
                  </div>
                  <button
                    onClick={copyWalletNumber}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${copied
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 copy-success"
                        : "bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                      }`}
                    title="نسخ الرقم"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg border border-white/5">
                  <span className="text-xs text-light/50">المبلغ المطلوب</span>
                  <span className="text-xl font-serif font-bold text-gold">{checkoutResult.totalAmount} جنيه</span>
                </div>
              </div>

              {/* Payment Steps */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Info size={14} className="text-gold" />
                  خطوات إتمام الدفع
                </h4>
                <div className="space-y-2">
                  {checkoutResult.paymentInstructions?.steps?.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-dark-main rounded-lg border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-gold">{i + 1}</span>
                      </div>
                      <p className="text-xs text-light/70 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/2${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `مرحباً، أريد تأكيد طلب رقم: ${checkoutResult.order?.orderNumber}\nالمبلغ: ${checkoutResult.totalAmount} جنيه\nطريقة الدفع: ${checkoutResult.order?.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستاباي'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <MessageSquare size={16} />
                <span>إرسال إيصال الدفع عبر واتساب</span>
              </a>

              {/* Order Items Summary */}
              <details className="group">
                <summary className="text-xs text-gold/70 cursor-pointer hover:text-gold transition-colors flex items-center gap-1">
                  <ChevronLeft size={12} className="group-open:rotate-90 transition-transform" />
                  عرض تفاصيل الطلب
                </summary>
                <div className="mt-3 p-4 bg-dark-main rounded-xl border border-gold/10 space-y-2">
                  {checkoutResult.verifiedItems?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs text-light/70">
                      <span>{item.title} (x{item.quantity})</span>
                      <span className="font-serif font-bold text-gold">{item.totalPrice} جنيه</span>
                    </div>
                  ))}
                  <div className="border-t border-gold/10 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-white">الإجمالي</span>
                    <span className="text-gold font-serif">{checkoutResult.totalAmount} جنيه</span>
                  </div>
                </div>
              </details>

              <button
                onClick={() => setCheckoutResult(null)}
                className="w-full border border-gold/30 text-gold hover:bg-gold/5 font-bold py-3 rounded-xl transition-all duration-300 text-center cursor-pointer text-sm"
              >
                متابعة تصفح الأعمال
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
