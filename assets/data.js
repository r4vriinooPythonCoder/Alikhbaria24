// assets/data.js
// Slider images (max 20)
window.SLIDER = [
  { img: "https://images.unsplash.com/photo-1542317854-cc66fd3a5e8d?auto=format&fit=crop&w=1600&q=60", title: "الإخبارية24 - تازة" },
  { img: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=60", title: "آخر أخبار مدينة تازة" },
];

// Posts
// gallery: up to 3 extra images (optional)
window.POSTS = [
  {
    id: "taza-001",
    title: "تازة: خبر تجريبي أول",
    excerpt: "هذا وصف قصير كيظهر فالكارت فالصفحة الرئيسية.",
    content: [
      "هذا مثال لمحتوى خبر على شكل فقرات.",
      "تقدر تزيد فقرات أخرى بسهولة.",
      "غادي نزيدو لاحقاً لوحة تحكم حقيقية باش تنشر بلا ما تمس الكود."
    ],
    category: "local",
    categoryLabel: "محليات تازة",
    author: "هيئة التحرير",
    dateISO: "2026-03-04",
    image: "https://images.unsplash.com/photo-1542317854-cc66fd3a5e8d?auto=format&fit=crop&w=1400&q=60",
    gallery: [
      "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=1400&q=60",
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1400&q=60",
      "https://images.unsplash.com/photo-1520975682031-a1f3f2d2c2fd?auto=format&fit=crop&w=1400&q=60"
    ],
    tags: ["تازة", "محليات"]
  },
  {
    id: "taza-002",
    title: "حوادث: مثال ثاني",
    excerpt: "خبر تجريبي فتصنيف الحوادث.",
    content: [
      "تفاصيل الخبر هنا…",
      "يمكنك تغيير النص كيفما بغيتي."
    ],
    category: "incidents",
    categoryLabel: "حوادث",
    author: "هيئة التحرير",
    dateISO: "2026-03-03",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=60",
    gallery: [],
    tags: ["تازة", "حوادث"]
  },
  {
    id: "taza-003",
    title: "رياضة: مثال ثالث",
    excerpt: "ملخص صغير لخبر رياضي.",
    content: ["تفاصيل رياضية…"],
    category: "sports",
    categoryLabel: "رياضة",
    author: "قسم الرياضة",
    dateISO: "2026-03-02",
    image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=60",
    gallery: [
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1400&q=60"
    ],
    tags: ["رياضة", "تازة"]
  }
];