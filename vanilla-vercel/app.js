/**
 * Frontend Logic for Mohamed Al-Sayed Abdel Aziz Website (Vanilla JS)
 * Location: /vanilla-vercel/app.js
 * 
 * Implements:
 * 1. Modals (Auth Modal, Book Details Modal)
 * 2. Shopping Cart state & LocalStorage caching
 * 3. Fetching books dynamically from Firestore
 * 4. User Authenticated State Syncing
 */

// Cart and User State
let cart = [];
let currentUser = null;

// DOM Elements (Loaded on DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const authModal = document.getElementById("auth-modal");
  const bookDetailsModal = document.getElementById("book-details-modal");
  const invoiceModal = document.getElementById("invoice-modal");
  const cartDrawer = document.getElementById("cart-drawer");
  
  const authBtn = document.getElementById("auth-btn");
  const closeAuthBtn = document.getElementById("close-auth-btn");
  const cartBtn = document.getElementById("cart-btn");
  const closeCartBtn = document.getElementById("close-cart-btn");
  
  const authForm = document.getElementById("auth-form");
  const authTitle = document.getElementById("auth-title");
  const toggleAuthMode = document.getElementById("toggle-auth-mode");
  const authError = document.getElementById("auth-error");
  
  const booksGrid = document.getElementById("books-grid");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartBadge = document.getElementById("cart-badge");
  const cartTotalText = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  
  const contactForm = document.getElementById("contact-form");
  const filtersList = document.querySelectorAll(".filter-btn");

  // Track active state of auth mode ('login' or 'signup')
  let authMode = "login";

  // --- 1. FIREBASE AUTHENTICATION LISTENER ---
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      // User is logged in
      if (authBtn) {
        authBtn.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span>
          <span class="max-w-[100px] truncate inline-block">${user.email}</span>
          <button id="logout-btn" class="hover:text-gold mr-2 text-gold/60">خروج</button>
        `;
        document.getElementById("logout-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          auth.signOut();
        });
      }
      
      // Load user's cart from Firestore
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().cart) {
          cart = userDoc.data().cart;
          renderCart();
        } else {
          // If guest cart exists in localStorage, migrate it
          const localCart = localStorage.getItem("guest_cart");
          if (localCart) {
            cart = JSON.parse(localCart);
            await db.collection("users").doc(user.uid).set({ cart, email: user.email }, { merge: true });
            localStorage.removeItem("guest_cart");
            renderCart();
          }
        }
      } catch (e) {
        console.error("Error retrieving user cart:", e);
      }
    } else {
      // User is logged out
      if (authBtn) {
        authBtn.innerHTML = `
          <svg class="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span>دخول الأعضاء</span>
        `;
      }
      // Load cart from localStorage
      const localCart = localStorage.getItem("guest_cart");
      cart = localCart ? JSON.parse(localCart) : [];
      renderCart();
    }
  });

  // --- 2. AUTH MODAL EVENTS ---
  if (authBtn) {
    authBtn.addEventListener("click", () => {
      if (!currentUser) {
        authModal.classList.remove("hidden");
        authModal.classList.add("flex");
      }
    });
  }

  if (closeAuthBtn) {
    closeAuthBtn.addEventListener("click", () => {
      authModal.classList.remove("flex");
      authModal.classList.add("hidden");
    });
  }

  if (toggleAuthMode) {
    toggleAuthMode.addEventListener("click", (e) => {
      e.preventDefault();
      authError.textContent = "";
      if (authMode === "login") {
        authMode = "signup";
        authTitle.textContent = "إنشاء حساب جديد";
        toggleAuthMode.textContent = "تمتلك حساباً بالفعل؟ سجل الدخول";
      } else {
        authMode = "login";
        authTitle.textContent = "تسجيل دخول الأعضاء";
        toggleAuthMode.textContent = "لا تملك حساباً؟ أنشئ حساباً جديداً";
      }
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      authError.textContent = "";
      const emailInput = document.getElementById("auth-email").value;
      const passwordInput = document.getElementById("auth-password").value;
      
      try {
        if (authMode === "login") {
          await auth.signInWithEmailAndPassword(emailInput, passwordInput);
        } else {
          await auth.createUserWithEmailAndPassword(emailInput, passwordInput);
        }
        authModal.classList.add("hidden");
        authModal.classList.remove("flex");
        document.getElementById("auth-email").value = "";
        document.getElementById("auth-password").value = "";
      } catch (err) {
        console.error(err);
        authError.textContent = err.message || "حدث خطأ ما، يرجى المحاولة لاحقاً.";
      }
    });
  }

  // --- 3. CART DRAWER EVENTS ---
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      cartDrawer.classList.remove("translate-x-full");
    });
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => {
      cartDrawer.classList.add("translate-x-full");
    });
  }

  // --- 4. BOOKS LOAD & RENDER ---
  let books = [];
  async function loadBooks() {
    try {
      const snapshot = await db.collection("books").get();
      if (snapshot.empty) {
        // Option to pre-seed data on the client if database is empty
        console.log("Database empty. Seeding fallback...");
        return;
      }
      books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderBooks(books);
    } catch (err) {
      console.error("Error loading books:", err);
      if (booksGrid) {
        booksGrid.innerHTML = `<div class="col-span-full text-center text-red-400">عذراً، فشل تحميل الكتب من قاعدة البيانات.</div>`;
      }
    }
  }

  function renderBooks(booksList) {
    if (!booksGrid) return;
    booksGrid.innerHTML = "";
    
    booksList.forEach((book) => {
      const bookCard = document.createElement("div");
      bookCard.className = "group bg-dark-card border border-gold/15 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-gold hover:shadow-lg hover:shadow-gold/10";
      bookCard.innerHTML = `
        <div>
          <div class="relative overflow-hidden h-[250px] bg-dark-main">
            <img src="${book.image}" alt="${book.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <div class="absolute top-4 right-4 z-20 flex gap-2">
              <span class="bg-gold text-dark-main font-bold text-[10px] px-2.5 py-1 rounded-full">${book.type}</span>
              ${book.year ? `<span class="bg-dark-main/80 text-gold text-[10px] px-2.5 py-1 rounded-full font-mono border border-gold/20">${book.year}</span>` : ""}
            </div>
          </div>
          <div class="p-6 space-y-3">
            <h3 class="text-xl font-serif font-bold text-white group-hover:text-gold transition-colors duration-200">${book.title}</h3>
            <p class="text-light/60 text-sm line-clamp-3 leading-relaxed">${book.description}</p>
          </div>
        </div>
        <div class="p-6 pt-0 space-y-4">
          <div class="flex items-center justify-between border-t border-gold/10 pt-4">
            <span class="text-light/50 text-xs">سعر النسخة الأدبية</span>
            <span class="text-xl font-serif font-bold text-gold">${book.price} جنيه</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button class="add-to-cart-btn bg-transparent border border-gold/30 hover:border-gold text-gold hover:bg-gold/5 text-xs font-semibold py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5" data-id="${book.id}">
              إضافة للسلة
            </button>
            <button class="buy-now-btn bg-gold hover:bg-gold/90 text-dark-main font-bold text-xs py-2.5 rounded-lg transition-all duration-300" data-id="${book.id}">
              شراء الآن
            </button>
          </div>
          <button class="details-btn w-full text-center text-xs text-gold/60 hover:text-gold hover:underline transition-colors" data-id="${book.id}">
            تفاصيل أوفى عن العمل
          </button>
        </div>
      `;
      booksGrid.appendChild(bookCard);
    });

    // Add listeners to grid buttons
    document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const bookId = e.currentTarget.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (book) addToCart(book, false);
      });
    });

    document.querySelectorAll(".buy-now-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const bookId = e.currentTarget.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (book) addToCart(book, true);
      });
    });

    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const bookId = e.currentTarget.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (book) openBookDetails(book);
      });
    });
  }

  // --- 5. CART STATE OPERATIONS ---
  async function syncCart() {
    if (currentUser) {
      try {
        await db.collection("users").doc(currentUser.uid).set({ cart, email: currentUser.email }, { merge: true });
      } catch (e) {
        console.error("Failed to sync cart with Firestore:", e);
      }
    } else {
      localStorage.setItem("guest_cart", JSON.stringify(cart));
    }
    renderCart();
  }

  function addToCart(book, openDrawer = false) {
    const existing = cart.find((item) => item.book.id === book.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ book, quantity: 1 });
    }
    syncCart();
    if (openDrawer && cartDrawer) {
      cartDrawer.classList.remove("translate-x-full");
    }
  }

  function adjustQuantity(bookId, delta) {
    const item = cart.find((i) => i.book.id === bookId);
    if (item) {
      item.quantity += delta;
      if (item.quantity < 1) {
        cart = cart.filter((i) => i.book.id !== bookId);
      }
      syncCart();
    }
  }

  function removeFromCart(bookId) {
    cart = cart.filter((i) => i.book.id !== bookId);
    syncCart();
  }

  function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";
    
    let totalQty = 0;
    let totalAmount = 0;

    cart.forEach((item) => {
      totalQty += item.quantity;
      totalAmount += item.book.price * item.quantity;

      const itemEl = document.createElement("div");
      itemEl.className = "p-4 rounded-xl bg-dark-main border border-gold/5 flex gap-4 relative group";
      itemEl.innerHTML = `
        <img src="${item.book.image}" alt="${item.book.title}" class="w-12 h-16 object-cover rounded-md flex-shrink-0">
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[9px] text-gold bg-gold/10 px-2 py-0.5 rounded-full">${item.book.type}</span>
            <h4 class="text-xs font-bold text-white mt-1">${item.book.title}</h4>
          </div>
          <div class="flex items-center justify-between mt-1">
            <div class="flex items-center border border-gold/20 rounded">
              <button class="qty-minus p-0.5 px-1.5 text-xs text-light/60 hover:text-white" data-id="${item.book.id}">-</button>
              <span class="px-2 text-xs font-mono font-bold text-gold">${item.quantity}</span>
              <button class="qty-plus p-0.5 px-1.5 text-xs text-light/60 hover:text-white" data-id="${item.book.id}">+</button>
            </div>
            <span class="text-xs font-serif font-bold text-gold">${item.book.price * item.quantity} جنيه</span>
          </div>
        </div>
        <button class="remove-item absolute top-3 left-3 text-light/30 hover:text-red-400" data-id="${item.book.id}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    // Add list event listeners
    document.querySelectorAll(".qty-minus").forEach((btn) => {
      btn.addEventListener("click", (e) => adjustQuantity(e.currentTarget.getAttribute("data-id"), -1));
    });
    document.querySelectorAll(".qty-plus").forEach((btn) => {
      btn.addEventListener("click", (e) => adjustQuantity(e.currentTarget.getAttribute("data-id"), 1));
    });
    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", (e) => removeFromCart(e.currentTarget.getAttribute("data-id")));
    });

    // Update Totals in Header & Drawer
    if (cartBadge) {
      cartBadge.textContent = totalQty;
      cartBadge.classList.toggle("hidden", totalQty === 0);
    }
    if (cartTotalText) {
      cartTotalText.textContent = `${totalAmount} جنيه`;
    }
    
    // Toggle Empty Cart State
    const emptyState = document.getElementById("empty-cart-state");
    const checkoutArea = document.getElementById("checkout-area");
    if (emptyState && checkoutArea) {
      if (cart.length === 0) {
        emptyState.classList.remove("hidden");
        checkoutArea.classList.add("hidden");
      } else {
        emptyState.classList.add("hidden");
        checkoutArea.classList.remove("hidden");
      }
    }
  }

  // --- 6. DETAILS MODAL EVENT ---
  function openBookDetails(book) {
    if (!bookDetailsModal) return;
    
    document.getElementById("detail-image").src = book.image;
    document.getElementById("detail-title").textContent = book.title;
    document.getElementById("detail-type").textContent = book.type;
    document.getElementById("detail-year").textContent = book.year || "غير محدد";
    document.getElementById("detail-description").textContent = book.description;
    document.getElementById("detail-price").textContent = `${book.price} جنيه`;
    
    const detailBuyBtn = document.getElementById("detail-buy-btn");
    detailBuyBtn.onclick = () => {
      addToCart(book, true);
      bookDetailsModal.classList.add("hidden");
      bookDetailsModal.classList.remove("flex");
    };

    bookDetailsModal.classList.remove("hidden");
    bookDetailsModal.classList.add("flex");
  }

  const closeDetailBtn = document.getElementById("close-detail-btn");
  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
      bookDetailsModal.classList.add("hidden");
      bookDetailsModal.classList.remove("flex");
    });
  }

  // --- 7. SECURE CHECKOUT SUBMISSION ---
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      if (cart.length === 0) return;
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "جاري معالجة الطلب...";

      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: cart,
            email: currentUser ? currentUser.email : "guest@novelist.com"
          })
        });

        const data = await response.json();
        if (data.success) {
          // Display Invoice Modal
          document.getElementById("invoice-id").textContent = data.paymentIntent.id;
          document.getElementById("invoice-amount").textContent = `${data.totalAmount} جنيه مصري`;
          
          const invoiceItemsContainer = document.getElementById("invoice-items");
          if (invoiceItemsContainer) {
            invoiceItemsContainer.innerHTML = data.verifiedItems.map((item) => `
              <div class="flex justify-between items-center text-xs text-light/80">
                <span>${item.title} (x${item.quantity})</span>
                <span class="font-bold text-gold">${item.totalPrice} جنيه</span>
              </div>
            `).join("");
          }

          // Clear local/Firestore cart
          cart = [];
          await syncCart();
          
          cartDrawer.classList.add("translate-x-full");
          invoiceModal.classList.remove("hidden");
          invoiceModal.classList.add("flex");
        } else {
          alert(data.message || "فشلت معالجة الطلب.");
        }
      } catch (err) {
        console.error(err);
        alert("فشل الاتصال بالخادم لإجراء الدفع الآمن.");
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "إتمام عملية الدفع الآمن";
      }
    });
  }

  const closeInvoiceBtn = document.getElementById("close-invoice-btn");
  if (closeInvoiceBtn) {
    closeInvoiceBtn.addEventListener("click", () => {
      invoiceModal.classList.add("hidden");
      invoiceModal.classList.remove("flex");
    });
  }

  // --- 8. FILTERS CLICK EVENT ---
  filtersList.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filtersList.forEach((b) => b.classList.remove("bg-gold", "text-dark-main"));
      filtersList.forEach((b) => b.classList.add("text-light/70"));
      
      e.currentTarget.classList.add("bg-gold", "text-dark-main");
      e.currentTarget.classList.remove("text-light/70");
      
      const filterType = e.currentTarget.getAttribute("data-filter");
      if (filterType === "الكل") {
        renderBooks(books);
      } else if (filterType === "كتب وقصص") {
        renderBooks(books.filter((b) => b.type === "كتاب" || b.type === "مجموعة قصصية"));
      } else {
        renderBooks(books.filter((b) => b.type === filterType));
      }
    });
  });

  // --- 9. CONTACT FORM SUBMISSION ---
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector("button[type='submit']");
      const originalText = submitBtn.innerHTML;
      
      const name = document.getElementById("contact-name").value;
      const emailVal = document.getElementById("contact-email").value;
      const message = document.getElementById("contact-message").value;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `جاري الإرسال...`;

      try {
        await db.collection("contacts").add({
          name,
          email: emailVal,
          message,
          timestamp: new Date()
        });
        alert("شكراً لرسالتك! سيقوم الكاتب بالرد عليك قريباً.");
        contactForm.reset();
      } catch (err) {
        console.error(err);
        alert("عذراً، فشل إرسال الرسالة.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Initial load
  loadBooks();
});
