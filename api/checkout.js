/**
 * Vercel Serverless Function for handling secure e-commerce checkout.
 * Location: /api/checkout.js
 * 
 * Receives cart items, verifies prices on the server, calculates total, 
 * and returns payment instructions for Vodafone Cash / InstaPay.
 */

// Payment Configuration
const WALLET_NUMBER = "01066059542";
const MERCHANT_NAME = "محمد السيد عبد العزيز";

// Book prices catalog (server-side verification)
const bookPrices = {
  "سينما ريالتو": 150,
  "حلم البارون الأخير": 180,
  "جريفونيا": 200,
  "ملحمة أم المماليك": 160,
  "الأصل والفصل": 120,
  "ميزان من ذهب": 110,
  "نصف كائن": 100
};

function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

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

    let totalAmount = 0;
    const verifiedItems = items.map((item) => {
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
  } catch (error) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "حدث خطأ داخلي في الخادم أثناء معالجة عملية الدفع.",
      error: error.message 
    });
  }
};
