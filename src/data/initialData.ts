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

// No demo or sample products: only real products added via admin panel are displayed
export const initialProducts: Product[] = [];

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
