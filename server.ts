import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Payment Configuration
const WALLET_NUMBER = "01066059542";
const MERCHANT_NAME = "محمد السيد عبد العزيز";

// Book prices catalog (server-side verification)
const bookPrices: Record<string, number> = {
  "سينما ريالتو": 150,
  "حلم البارون الأخير": 180,
  "جريفونيا": 200,
  "ملحمة أم المماليك": 160,
  "الأصل والفصل": 120,
  "ميزان من ذهب": 110,
  "نصف كائن": 100
};

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware for POST requests
  app.use(express.json());

  // API Route: E-commerce Checkout with Vodafone Cash / InstaPay
  app.post("/api/checkout", (req, res) => {
    try {
      const { items, email, customerName, customerPhone, paymentMethod } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "السلة فارغة أو البيانات غير صحيحة." 
        });
      }

      if (!customerName || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: "يرجى إدخال الاسم ورقم الهاتف لإتمام الطلب."
        });
      }

      // Validate payment method
      const validMethods = ['vodafone_cash', 'instapay'];
      const selectedMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'vodafone_cash';

      // Secure backend calculation of total
      let totalAmount = 0;
      const verifiedItems = items.map((item: any) => {
        const title = item.book ? item.book.title : (item.title || "كتاب غير معروف");
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

      // Generate unique order number
      const orderNumber = generateOrderNumber();

      return res.status(200).json({
        success: true,
        message: "تم إنشاء طلبك بنجاح! يرجى تحويل المبلغ لإتمام الطلب.",
        order: {
          orderNumber,
          customerName,
          customerPhone,
          customerEmail: email || "",
          items: verifiedItems,
          totalAmount,
          currency: "EGP",
          paymentMethod: selectedMethod,
          paymentStatus: "pending_payment",
          createdAt: new Date().toISOString()
        },
        paymentInstructions: {
          walletNumber: WALLET_NUMBER,
          merchantName: MERCHANT_NAME,
          method: selectedMethod,
          amount: totalAmount,
          currency: "جنيه مصري",
          steps: selectedMethod === 'vodafone_cash' 
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
        totalAmount,
        currency: "جنيه مصري",
        billingDetails: {
          authorName: MERCHANT_NAME,
          merchantName: `منصة الكاتب ${MERCHANT_NAME} الأدبية`
        }
      });
    } catch (error: any) {
      console.error("Error in checkout:", error);
      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء معالجة الطلب.",
        error: error.message
      });
    }
  });

  // Vite middleware for asset serving in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
