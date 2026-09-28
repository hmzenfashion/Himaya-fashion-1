import { Product, BannerAd } from '../types';

export const initialBanners: BannerAd[] = [
  {
    id: "b1",
    title: "হিমায়া ফ্যাশন — প্রিমিয়াম কালেকশন '২৬",
    subtitle: "আপনার পছন্দের জর্জেট থ্রি-পিস, জামদানি, কাতান ও এক্সক্লুসিভ ফ্যাশন কালেকশন।",
    image: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=1200",
    linkText: "কালেকশন দেখুন",
    active: true,
    tag: "স্পেশাল রিলিজ"
  },
  {
    id: "b2",
    title: "The Silk & Georgette Edit",
    subtitle: "হাতে বোনা বেনারসি, জর্জেট থ্রি-পিস এবং প্রিমিয়াম কালেকশন যা আপনার ব্যক্তিত্বে আনে রাজকীয় আভিজাত্য।",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1200",
    linkText: "শপিং করুন",
    active: true,
    tag: "সিগনেচার সিরিজ"
  }
];

export const initialProducts: Product[] = [
  {
    id: "prod-georgette-1",
    title: "Premium Georgette Three-Piece (প্রিমিয়াম জর্জেট থ্রি-পিস - ১)",
    price: 3450,
    originalPrice: 4200,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800"
    ],
    description: "এক্সক্লুসিভ ডিজাইনের সফট জর্জেট থ্রি-পিস। কামিজ, ইনার ও চমৎকার ম্যাচিং ওড়না সহ কমপ্লিট সেট যা যেকোনো অনুষ্ঠানে পরার জন্য দারুণ আরামদায়ক।",
    badge: "Best Seller",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Dusty Pink", "Mint Green", "Sky Blue"],
    stock: 15,
    featured: true,
    createdAt: "2026-09-27T08:00:00.000Z"
  },
  {
    id: "prod-georgette-2",
    title: "Designer Georgette Party Three-Piece (ডিজাইনার জর্জেট থ্রি-পিস - ২)",
    price: 3950,
    originalPrice: 4800,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800"
    ],
    description: "পার্টি ও উৎসবের জন্য আকর্ষণীয় এমব্রয়ডারি ওয়ার্ক করা প্রিমিয়াম জর্জেট থ্রি-পিস। প্রিমিয়াম কোয়ালিটি ফেব্রিক।",
    badge: "Trending",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Wine Red", "Royal Blue", "Bottle Green"],
    stock: 12,
    featured: true,
    createdAt: "2026-09-27T08:15:00.000Z"
  },
  {
    id: "prod-georgette-3",
    title: "Embroidered Georgette Salwar Kameez (স্টোন ওয়ার্ক জর্জেট থ্রি-পিস - ৩)",
    price: 4200,
    originalPrice: 5000,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800"
    ],
    description: "নজরকাড়া স্টোন ও থ্রেড ওয়ার্কের জর্জেট থ্রি-পিস সেট। গর্জিউস লুক এবং আরামদায়ক ফিটিং।",
    badge: "New Arrival",
    sizes: ["M", "L", "XL"],
    colors: ["Peach", "Lavender", "Teal"],
    stock: 10,
    featured: true,
    createdAt: "2026-09-27T08:30:00.000Z"
  },
  {
    id: "prod-1",
    title: "Royal Crimson Jamdani Saree (রয়েল ক্রিসন জামদানি শাড়ি)",
    price: 12500,
    originalPrice: 14500,
    category: "Traditional",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"
    ],
    description: "হাতে বোনা খাঁটি ঐতিহ্যবাহী জামদানি শাড়ি। সোনালী ও রেশমি সুতার নিখুঁত কাজ।",
    badge: "Traditional",
    sizes: ["Standard (12 Haat)"],
    colors: ["Crimson Red", "Royal Gold"],
    stock: 12,
    featured: true,
    createdAt: "2026-09-26T10:00:00.000Z"
  },
  {
    id: "prod-2",
    title: "Emerald Silk Katan Saree (এমেরাল্ড সিল্ক কাতান শাড়ি)",
    price: 15800,
    originalPrice: 18000,
    category: "Traditional",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800"
    ],
    description: "রিচ এমেরাল্ড গ্রিন ও গোল্ডেন জরি ওয়ার্কের প্রিমিয়াম সিল্ক কাতান শাড়ি।",
    badge: "Bridal",
    sizes: ["Standard (12 Haat)"],
    colors: ["Emerald Green", "Deep Maroon"],
    stock: 8,
    featured: true,
    createdAt: "2026-09-26T10:30:00.000Z"
  },
  {
    id: "prod-3",
    title: "Zardozi Bridal Lehenga Choli (জরদৌসি ব্রাইডাল লেহেঙ্গা)",
    price: 32000,
    originalPrice: 38000,
    category: "Traditional",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800"
    ],
    description: "ভারী জরদৌসি ও স্টোন এমব্রয়ডারি করা রাজকীয় ব্রাইডাল লেহেঙ্গা সেট।",
    badge: "Bridal",
    sizes: ["Free Size (Semi-Stitched)", "M", "L", "XL"],
    colors: ["Maroon Red", "Blush Pink"],
    stock: 5,
    featured: true,
    createdAt: "2026-09-26T11:00:00.000Z"
  },
  {
    id: "prod-4",
    title: "Classic Executive Men's Panjabi (ক্লাসিক জেন্টস পাঞ্জাবি)",
    price: 3800,
    originalPrice: 4500,
    category: "Traditional",
    image: "https://images.unsplash.com/photo-1627914713280-928efad971ca?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1627914713280-928efad971ca?auto=format&fit=crop&q=80&w=800"
    ],
    description: "প্রিমিয়াম কটন ও সিল্ক ব্লেন্ডের সুদৃশ্য এমব্রয়ডারি কলার জেন্টস পাঞ্জাবি।",
    badge: "Men's Pick",
    sizes: ["40 (M)", "42 (L)", "44 (XL)"],
    colors: ["Off White", "Navy Blue", "Maroon"],
    stock: 20,
    featured: true,
    createdAt: "2026-09-26T11:30:00.000Z"
  },
  {
    id: "prod-5",
    title: "Luxury Velvet Three-Piece Set (লাক্সারি ভেলভেট থ্রি-পিস)",
    price: 6500,
    originalPrice: 7800,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800"
    ],
    description: "শীতকালীন উৎসব ও পার্টি ওয়্যারের চমৎকার সফট ভেলভেট থ্রি-পিস সেট।",
    badge: "Winter",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Deep Plum", "Emerald"],
    stock: 14,
    featured: false,
    createdAt: "2026-09-26T12:00:00.000Z"
  }
];

export const initialAdConfig = {
  globalAdsEnabled: true,
  popunderCooldownMinutes: 1,
  ads: [
    {
      id: "adsterra-popunder",
      name: "Adsterra Popunder / Direct Smartlink",
      type: "popunder" as const,
      enabled: true,
      linkUrl: "https://www.profitableratecpmnetwork.com/peqj1c1g?key=22bd9ad3eec7103becba033d685cb45f",
      placement: "popunder" as const,
      createdAt: "2026-03-01T00:00:00.000Z"
    },
    {
      id: "adsterra-banner-160x300",
      name: "Adsterra 160x300 Iframe Banner",
      type: "script_banner" as const,
      enabled: true,
      scriptCode: `<script type="text/javascript">
  atOptions = {
    'key' : 'c4ae09df70d272d84914d3233703d9dd',
    'format' : 'iframe',
    'height' : 300,
    'width' : 160,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highrevenueformat.com/c4ae09df70d272d84914d3233703d9dd/invoke.js"></script>`,
      placement: "floating_corner" as const,
      createdAt: "2026-03-01T00:00:00.000Z"
    }
  ],
  updatedAt: "2026-03-01T00:00:00.000Z"
};
