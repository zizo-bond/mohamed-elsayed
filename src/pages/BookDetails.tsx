import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Book, Review } from '../types';
import { User } from 'firebase/auth';
import { getReviewsForBook, addReviewForBook } from '../firebase';
import { ArrowLeft, ShoppingBag, Star, Send } from 'lucide-react';

interface BookDetailsProps {
  books: Book[];
  addToCart: (book: Book, openCart: boolean) => void;
  user: User | null;
}

export default function BookDetails({ books, addToCart, user }: BookDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const book = books.find(b => b.id === id);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadReviews();
    }
    window.scrollTo(0, 0); // Scroll to top when page changes
  }, [id]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    if (id) {
      const fetched = await getReviewsForBook(id);
      setReviews(fetched);
    }
    setLoadingReviews(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!comment.trim()) return;

    setSubmitting(true);
    const success = await addReviewForBook(id, {
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || "مستخدم",
      rating,
      comment
    });

    if (success) {
      setComment("");
      setRating(5);
      await loadReviews();
    }
    setSubmitting(false);
  };

  if (!book) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl text-gold font-serif">لم يتم العثور على الكتاب</h2>
        <Link to="/" className="text-light/60 hover:text-white flex items-center gap-2">
          <ArrowLeft size={16} /> العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-10 pb-20 max-w-5xl mx-auto px-6">
      <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 font-serif mb-8 transition-colors">
        <ArrowLeft size={16} /> العودة للمكتبة
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <img
            src={book.image}
            alt={book.title}
            className="w-full object-cover rounded-xl shadow-2xl shadow-gold/10 border border-gold/20"
          />
        </div>

        <div className="md:col-span-7 space-y-6">
          <div className="flex gap-2">
            <span className="bg-[#D4AF37] text-[#0D0D12] font-serif font-bold text-xs px-3 py-1 rounded">
              {book.type}
            </span>
            {book.year && (
              <span className="bg-dark-main text-[#D4AF37] text-xs px-3 py-1 rounded font-serif border border-gold/20">
                {book.year}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-serif font-bold text-white">{book.title}</h1>
          <div className="w-16 h-[2px] bg-gold/50" />

          <p className="text-light/80 text-lg leading-relaxed font-serif font-light">
            {book.description}
          </p>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-gold/15">
            <div>
              <span className="text-sm text-light/50 block font-serif">سعر النسخة الأدبية</span>
              <span className="text-3xl font-serif font-bold text-[#D4AF37]">{book.price} جنيه</span>
            </div>

            <button
              onClick={() => addToCart(book, true)}
              className="bg-[#D4AF37] hover:bg-[#B49027] text-[#0D0D12] font-serif font-bold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md shadow-gold/20 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <ShoppingBag size={18} />
              شراء النسخة
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-20 pt-10 border-t border-gold/10">
        <h2 className="text-2xl font-serif font-bold text-white mb-8 flex items-center gap-3">
          <Star className="text-gold fill-gold" /> تقييمات القراء
        </h2>

        {user ? (
          <form onSubmit={handleReviewSubmit} className="bg-dark-card border border-gold/10 p-6 rounded-xl mb-10">
            <h3 className="text-lg font-serif text-white mb-4">أضف تقييمك</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 transition-all cursor-pointer ${rating >= star ? 'text-gold fill-gold' : 'text-light/20'}`}
                >
                  <Star size={24} className={rating >= star ? "fill-gold" : ""} />
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب انطباعك عن الكتاب..."
              className="w-full bg-dark-main border border-gold/20 focus:border-gold rounded-lg px-4 py-3 text-sm text-white placeholder-light/30 outline-none transition-all resize-none font-serif mb-4"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-gold hover:bg-[#B49027] text-dark-main font-bold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "جاري الإرسال..." : <><Send size={14} /> نشر التقييم</>}
            </button>
          </form>
        ) : (
          <div className="bg-dark-card border border-gold/10 p-6 rounded-xl mb-10 text-center">
            <p className="text-light/60 font-serif mb-4">يجب تسجيل الدخول لإضافة تقييم للكتاب.</p>
          </div>
        )}

        <div className="space-y-6">
          {loadingReviews ? (
            <div className="text-center text-light/40 py-10 font-serif">جاري تحميل التقييمات...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-light/40 py-10 font-serif">لا توجد تقييمات بعد. كن أول من يقيّم هذا الكتاب!</div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-dark-main border border-white/5 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gold font-serif">{review.userName}</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} className={review.rating >= star ? "text-gold fill-gold" : "text-light/20"} />
                    ))}
                  </div>
                </div>
                <p className="text-light/80 text-sm leading-relaxed font-serif">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
