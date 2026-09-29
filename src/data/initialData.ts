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
    id: "himaya-prod-101",
    title: "হিমায়া এক্সক্লুসিভ জর্জেট থ্রি-পিস কালেকশন",
    price: 2450,
    originalPrice: 3200,
    category: "Three-Piece",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800"
    ],
    description: "অসাধারণ কাজের সফট জর্জেট থ্রি-পিস। প্রিমিয়াম কোয়ালিটি ও আরামদায়ক ফ্যাব্রিক, যেকোনো পার্টি বা অনুষ্ঠানে পরার জন্য উপযুক্ত।",
    badge: "Hot Deal",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Maroon", "Navy Blue", "Emerald Green"],
    stock: 25,
    featured: true,
    isPopular: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "himaya-prod-102",
    title: "রয়েল ব্রাইডাল এমব্রয়ডারি জর্জেট থ্রি-পিস",
    price: 3150,
    originalPrice: 4000,
    category: "Three-Piece",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800"
    ],
    description: "স্টাইলিশ ও গর্জিয়াস এমব্রয়ডারি কাজের জর্জেট থ্রি-পিস। গর্জিয়াস দোপাট্টা ও নিখুঁত ফিনিশিং।",
    badge: "New",
    sizes: ["M", "L", "XL"],
    colors: ["Pink", "Sky Blue", "Violet"],
    stock: 18,
    featured: true,
    isPopular: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "himaya-prod-103",
    title: "প্রিমিয়াম সিল্ক জামদানি শাড়ি কালেকশন",
    price: 4500,
    originalPrice: 5800,
    category: "Saree",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800"
    ],
    description: "ঐতিহ্যবাহী জামদানি মোটিফে তৈরি প্রিমিয়াম সিল্ক শাড়ি। উৎসব ও বিশেষ দিনে আপনার সৌন্দর্য বাড়িয়ে তুলবে বহুগুণ।",
    badge: "Best Seller",
    sizes: ["Standard"],
    colors: ["Red", "Golden", "Royal Blue"],
    stock: 12,
    featured: true,
    isPopular: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "himaya-prod-104",
    title: "ডিজাইনার পার্টি গাউন ও থ্রি-পিস",
    price: 2850,
    originalPrice: 3500,
    category: "Party Wear",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800"
    ],
    description: "আধুনিক ডিজাইনের পার্টি ওয়্যার। চমৎকার কালার কম্বিনেশন এবং প্রিমিয়াম মেটেরিয়াল দিয়ে তৈরি।",
    badge: "Popular",
    sizes: ["S", "M", "L"],
    colors: ["Black", "Peach", "Olive"],
    stock: 20,
    featured: false,
    isPopular: true,
    createdAt: new Date().toISOString()
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
