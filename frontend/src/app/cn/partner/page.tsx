import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  Handshake, Users, ArrowRight, Globe, Smartphone,
  Monitor, MessageCircle, ExternalLink, Filter
} from "lucide-react";

interface Partner {
  name: string;
  img: string;
  href: string;
  category: "proxies" | "browsers" | "sms";
}

const partners: Partner[] = [
  { name: "AstroProxy", img: "/assets/img/partners/15/15_astro_060226023838_en.png", href: "https://is.gd/QRBsaH", category: "proxies" },
  { name: "Proxys", img: "/assets/img/partners/19/19_proxy_050226043602_en.png", href: "https://is.gd/0GJnDa", category: "proxies" },
  { name: "PSBProxy", img: "/assets/img/partners/20/20_psb_050226043820_en.png", href: "https://is.gd/DubMSg", category: "proxies" },
  { name: "Keyproxy", img: "/assets/img/partners/21/21_keyproxy_050226061940_en.png", href: "https://is.gd/xlSHB9", category: "proxies" },
  { name: "LTEBoost", img: "/assets/img/partners/24/24_lteboost_060226032840_en.png", href: "https://is.gd/XOqp60", category: "proxies" },
  { name: "SX.Org", img: "/assets/img/partners/27/27_sxorg_060226033808_en.png", href: "https://is.gd/JbDkSc", category: "proxies" },
  { name: "The Safety", img: "/assets/img/partners/31/31_ts-c8a330_060226035344_en.png", href: "https://is.gd/bIR1wk", category: "browsers" },
  { name: "ALISMS", img: "/assets/img/partners/32/32_ali_060226035655_en.png", href: "https://is.gd/DkwjPQ", category: "sms" },
  { name: "Moresms", img: "/assets/img/partners/35/35_moresms_060226040333_en.png", href: "https://is.gd/h4sUdV", category: "sms" },
  { name: "Coronium", img: "/assets/img/partners/37/37_corn_090626010007_en.png", href: "https://is.gd/TGMOik", category: "proxies" },
  { name: "IPOASIS", img: "/assets/img/partners/38/38_asis_090626125718_en.png", href: "https://is.gd/prMlnr5", category: "proxies" },
  { name: "White Link", img: "/assets/img/partners/39/39_white_090626010205_en.png", href: "https://is.gd/0iql9C", category: "proxies" },
  { name: "Arbitrage Traffic", img: "/assets/img/partners/40/40_arbitra_080626070358_en.png", href: "https://is.gd/Ro1Ln8", category: "proxies" },
  { name: "AntiSafety", img: "/assets/img/partners/41/41_as-13bc24_080626070413_en.png", href: "", category: "browsers" },
  { name: "To Detect", img: "/assets/img/partners/42/42_500x200_100226014909_en.png", href: "https://is.gd/P6AtFg", category: "browsers" },
  { name: "Live Proxies", img: "/assets/img/partners/43/43_life_090626010042_en.png", href: "https://is.gd/H13YmP", category: "proxies" },
  { name: "SMS-Active", img: "/assets/img/partners/44/44_12111_100226090102_en.png", href: "", category: "sms" },
  { name: "Cloaking.House", img: "/assets/img/partners/45/45_cloak_080626071529_en.png", href: "https://is.gd/SHouGw", category: "proxies" },
  { name: "SWIFTPROXY", img: "/assets/img/partners/46/46_swiftproxy-13_110226013747_en.png", href: "https://is.gd/t5IM2m", category: "proxies" },
  { name: "NovaProxy", img: "/assets/img/partners/47/47_logo-light-500-200_110226014159_en.png", href: "https://is.gd/itP64y", category: "proxies" },
  { name: "PRM4U", img: "/assets/img/partners/48/48_prm_080626070609_en.png", href: "https://is.gd/QKPL5P", category: "proxies" },
  { name: "Linken Sphere", img: "/assets/img/partners/49/49_link_080626061228_en.png", href: "https://is.gd/2SMfNd", category: "browsers" },
  { name: "Browser Vision", img: "/assets/img/partners/50/50_vision_080626062233_en.png", href: "https://is.gd/HbpOjA", category: "browsers" },
  { name: "NafeProxys", img: "/assets/img/partners/51/51_nafe_080626070554_en.png", href: "https://is.gd/aeNP7P", category: "proxies" },
  { name: "CPA Mafia", img: "/assets/img/partners/52/52_logo-500x200_130226120630_en.png", href: "https://is.gd/TeAYmn", category: "proxies" },
  { name: "MobileProxy", img: "/assets/img/partners/54/54_mobproxy_080626070536_en.png", href: "https://is.gd/uhPFtB", category: "proxies" },
  { name: "Rapidproxy", img: "/assets/img/partners/55/55_photo_2026-02-13_03-25-18_130226014409_en.png", href: "https://is.gd/W9P0kf", category: "proxies" },
  { name: "Proxy Coupons", img: "/assets/img/partners/57/57_coupons_080626070514_en.png", href: "https://is.gd/1nEYMu", category: "proxies" },
  { name: "FBKilla", img: "/assets/img/partners/58/58_fbkilla_080626061121_en.png", href: "https://is.gd/vNMhvQ", category: "browsers" },
  { name: "ProxySolutions", img: "/assets/img/partners/59/59_500-200_160226120553_en.png", href: "https://goo.su/KP2gcwh", category: "proxies" },
  { name: "Boomlify", img: "/assets/img/partners/60/60_boom_080626070456_en.png", href: "https://is.gd/eVPFT8", category: "proxies" },
  { name: "AnticBrowser", img: "/assets/img/partners/61/61_antic_080626070322_en.png", href: "https://goo.su/rVQTp", category: "browsers" },
  { name: "GeeLark", img: "/assets/img/partners/62/62_geelark_080626061142_en.png", href: "https://goo.su/rgTXDx7", category: "browsers" },
  { name: "UniMessenger", img: "/assets/img/partners/63/63_unimess_080626070642_en.png", href: "https://goo.su/JIcI3RX", category: "browsers" },
  { name: "Ace Proxies", img: "/assets/img/partners/64/64_ace_090626125702_en.png", href: "https://goo.su/sBok", category: "proxies" },
  { name: "BitBrowser", img: "/assets/img/partners/65/65_bit_090626125740_en.png", href: "https://goo.su/YCAH", category: "browsers" },
  { name: "Aezakmi", img: "/assets/img/partners/66/66_500h200-2_180226030617_en.png", href: "https://www.aezakmi.app/", category: "browsers" },
  { name: "Proxyma", img: "/assets/img/partners/67/67_proxyma_090626010150_en.png", href: "https://goo.su/dU0v", category: "proxies" },
  { name: "Cloudbypass API", img: "/assets/img/partners/68/68_cloud_090626125647_en.png", href: "https://goo.su/yStno6V", category: "proxies" },
  { name: "MoneySafe", img: "/assets/img/partners/69/69_money_090626081910_en.png", href: "https://goo.su/MnVbP", category: "sms" },
  { name: "Novproxy", img: "/assets/img/partners/70/70_165-1x_230226113025_en.png", href: "https://goo.su/XfEt83D", category: "proxies" },
  { name: "Cliproxy", img: "/assets/img/partners/71/71_500200cli_230226113142_en.png", href: "https://goo.su/qdLXjO", category: "proxies" },
  { name: "RichProxy", img: "/assets/img/partners/72/72_h-38d2f4_230226115543_en.png", href: "https://clck.ru/3Ryr2M", category: "proxies" },
  { name: "BeastBrowser", img: "/assets/img/partners/73/73_beast_090626081707_en.png", href: "https://beastbrowser.com/", category: "browsers" },
  { name: "TradeProxy", img: "/assets/img/partners/74/74_tradeproxy_240226011838_en.png", href: "https://goo.su/bgAm3I", category: "proxies" },
  { name: "Capi", img: "/assets/img/partners/76/76_capi_080626061102_en.png", href: "https://goo.su/E1nsR", category: "proxies" },
  { name: "Undetectable", img: "/assets/img/partners/77/77_undetect_250226105547_en.png", href: "https://goo.su/k4KWg1z", category: "browsers" },
  { name: "DSLRentals", img: "/assets/img/partners/78/78_dslrentals_2_-removebg-p_250226115708_en.png", href: "https://goo.su/iJSJRwd", category: "proxies" },
  { name: "SaleSmartly", img: "/assets/img/partners/79/79_sale_080626061307_en.png", href: "https://goo.su/J3Nrg", category: "browsers" },
  { name: "1024Proxy", img: "/assets/img/partners/80/80_1024_080626071509_en.png", href: "https://goo.su/pvU91qH", category: "proxies" },
  { name: "XLogin", img: "/assets/img/partners/81/81_login_090626081851_en.png", href: "https://goo.su/Yu6YRpg", category: "browsers" },
  { name: "MuLogin", img: "/assets/img/partners/82/82_mulogin_090626010117_en.png", href: "https://goo.su/gFjo8v8", category: "browsers" },
  { name: "GoProxy", img: "/assets/img/partners/83/83_goproxy_080626061200_en.png", href: "https://goo.su/f0vAhKY", category: "proxies" },
  { name: "ZeroCloak", img: "/assets/img/partners/84/84_zerocloak-png_170326054843_en.png", href: "https://goo.su/2lNN43", category: "browsers" },
  { name: "IPCola", img: "/assets/img/partners/85/85_ipcola_080626071453_en.png", href: "https://goo.su/koBbtoU", category: "proxies" },
  { name: "Captchas.io", img: "/assets/img/partners/86/86_captcha_090626081730_en.png", href: "https://goo.su/jJsBYWH", category: "proxies" },
  { name: "Pay2.House", img: "/assets/img/partners/87/87_pay2_080626071600_en.png", href: "https://goo.su/1JNyaL", category: "sms" },
  { name: "Comsign", img: "/assets/img/partners/88/88_comsign_080626071545_en.png", href: "https://goo.su/WyjrxH3", category: "sms" },
  { name: "ProxyFlash", img: "/assets/img/partners/89/89_flash_090626081816_en.png", href: "https://goo.su/8yvnmrG", category: "proxies" },
  { name: "PirateCPA", img: "/assets/img/partners/90/90_bazaart_269f3969-6266-47e_060326062519_en.png", href: "https://goo.su/TnrU8Dd", category: "proxies" },
  { name: "GotoProxy", img: "/assets/img/partners/91/91_goto_090626081832_en.png", href: "https://goo.su/yAzhE", category: "proxies" },
  { name: "FloppyData", img: "/assets/img/partners/92/92_floop_090626081632_en.png", href: "https://goo.su/xbgDjyT", category: "proxies" },
  { name: "OnesProxy", img: "/assets/img/partners/93/93_ones_090626081927_en.png", href: "https://goo.su/lCWF4x", category: "proxies" },
  { name: "Partnerkin", img: "/assets/img/partners/94/94_part_080626061249_en.png", href: "https://goo.su/OcFobf", category: "proxies" },
  { name: "B2Proxy", img: "/assets/img/partners/95/95_b2proxy_090626081647_en.png", href: "https://goo.su/OYSW", category: "proxies" },
  { name: "ProxyShard", img: "/assets/img/partners/96/96_shard_090626081941_en.png", href: "https://goo.su/M9VOr", category: "proxies" },
  { name: "Zenlink", img: "/assets/img/partners/97/97_zenlink_090626010219_en.png", href: "https://goo.su/ajzi5", category: "proxies" },
  { name: "ProxyPanda", img: "/assets/img/partners/98/98_logo15_130326030716_en.png", href: "https://goo.su/YFxtw", category: "proxies" },
  { name: "Hoax.tech", img: "/assets/img/partners/99/99_hoaxtech_500x200_for_blac_130326064007_en.png", href: "https://hoax.tech/?promo=TELEGRAMEXPERT", category: "proxies" },
  { name: "ExitAnty", img: "/assets/img/partners/100/100_exit_090626082420_en.png", href: "https://goo.su/yYHjfT", category: "browsers" },
  { name: "Cyberyozh", img: "/assets/img/partners/101/101_dizai-n-bez-nazvaniya-17_180326035232_en.png", href: "https://goo.su/iH5odu", category: "browsers" },
  { name: "Famesweb", img: "/assets/img/partners/103/103_fames_090626082440_en.png", href: "https://goo.su/p5YNRZD", category: "proxies" },
  { name: "Adspect", img: "/assets/img/partners/104/104_adspect_180326014252_en.png", href: "https://goo.su/Ji3pi", category: "proxies" },
  { name: "Detect.expert", img: "/assets/img/partners/105/105_detect_090626082407_en.png", href: "https://goo.su/DIkw", category: "browsers" },
  { name: "TrafficMafia", img: "/assets/img/partners/106/106_tm-e88e5d_080626062030_en.png", href: "https://goo.su/RyH9y", category: "proxies" },
  { name: "Spy.House", img: "/assets/img/partners/107/107_spyhouse_080626070627_en.png", href: "https://goo.su/cC8Hgu", category: "proxies" },
  { name: "OkkProxy", img: "/assets/img/partners/108/108_okk_090626082351_en.png", href: "https://goo.su/xnZkIf", category: "proxies" },
  { name: "ColaProxy", img: "/assets/img/partners/109/109_photo_2026-03-25_09-59-38_250326032110_en.png", href: "https://goo.su/mcrFVE", category: "proxies" },
  { name: "NiuProxy", img: "/assets/img/partners/110/110_photo_2026-03-25_09-59-54_250326032639_en.png", href: "https://goo.su/HBJm8dG", category: "proxies" },
  { name: "AffCult", img: "/assets/img/partners/111/111_aff-cult-logo-black-3-1_250326033031_en.png", href: "https://goo.su/ZgISs", category: "proxies" },
  { name: "Proxysieutoc", img: "/assets/img/partners/112/112_photo_2026-03-25_05-05-32_250326033208_en.png", href: "https://goo.su/iUqcJoH", category: "proxies" },
  { name: "IPFoxy", img: "/assets/img/partners/113/113_photo_2026-03-25_04-57-57_250326033651_en.png", href: "https://goo.su/xdgMpj4", category: "proxies" },
  { name: "Push.House", img: "/assets/img/partners/114/114_push_090626010910_en.png", href: "https://goo.su/DTP9t", category: "sms" },
  { name: "ProxyStyler", img: "/assets/img/partners/116/116_116_090626084509_en.png", href: "https://goo.su/xv98iF", category: "proxies" },
  { name: "iProxy", img: "/assets/img/partners/117/117_117_090626084524_en.png", href: "https://goo.su/qbC8Z", category: "proxies" },
  { name: "0DETECT", img: "/assets/img/partners/119/119_119_090626084538_en.png", href: "https://goo.su/CXIOs1", category: "browsers" },
  { name: "Quarkip", img: "/assets/img/partners/120/120_120_090626084553_en.png", href: "https://goo.su/dbHeE", category: "proxies" },
  { name: "FluxISP", img: "/assets/img/partners/121/121_500200removebgpreview_100426022609_en.png", href: "https://goo.su/UaA3sI", category: "proxies" },
  { name: "GonzoProxy", img: "/assets/img/partners/122/122_122_090626084605_en.png", href: "https://goo.su/jyzjl", category: "proxies" },
  { name: "Huoniaozhanghao", img: "/assets/img/partners/123/123_123_090626084619_en.png", href: "https://goo.su/GTERpH", category: "proxies" },
  { name: "PXM2", img: "/assets/img/partners/124/124_124_090626084632_en.png", href: "https://goo.su/888vU", category: "proxies" },
  { name: "Proxiware", img: "/assets/img/partners/126/126_126_090626084645_en.png", href: "https://goo.su/jaWCO", category: "proxies" },
  { name: "LTEasy Proxies", img: "/assets/img/partners/127/127_127_090626084659_en.png", href: "https://goo.su/Vk8chAX", category: "proxies" },
  { name: "Proxies.sx", img: "/assets/img/partners/128/128_128_090626084718_en.png", href: "https://goo.su/kO6q", category: "proxies" },
  { name: "ArealProxy", img: "/assets/img/partners/129/129_129_090626084733_en.png", href: "https://clck.ru/3Tfo9N", category: "proxies" },
  { name: "Ads Approved", img: "/assets/img/partners/130/130_appr_090626010802_en.png", href: "https://goo.su/mZoDqw", category: "proxies" },
  { name: "Proxy.Luxe", img: "/assets/img/partners/131/131_131_090626084747_en.png", href: "https://proxy.luxe/en", category: "proxies" },
  { name: "BlurPath", img: "/assets/img/partners/132/132_blur_080626070441_en.png", href: "https://clck.ru/3TqeV6", category: "browsers" },
  { name: "a1proxy", img: "/assets/img/partners/133/133_aiproxy_080626070306_en.png", href: "https://clck.ru/3TqeaB", category: "proxies" },
  { name: "mtwspy", img: "/assets/img/partners/134/134_mtw_090626010627_en.png", href: "https://goo.su/ua96k", category: "sms" },
  { name: "Quantum Proxies", img: "/assets/img/partners/135/135_quan_090626010503_en.png", href: "https://goo.su/JNuxc9", category: "proxies" },
  { name: "Cloakerly", img: "/assets/img/partners/136/136_cloak_090626125758_en.png", href: "https://goo.su/0vUkoA", category: "proxies" },
  { name: "OctoBrowser", img: "/assets/img/partners/137/137_color-1_030626010411_en.png", href: "https://goo.su/LTpF3v", category: "browsers" },
  { name: "Adshine", img: "/assets/img/partners/138/138_hine_090626125834_en.png", href: "https://goo.su/iQwvyrg", category: "proxies" },
  { name: "Proxy4U", img: "/assets/img/partners/139/139_proxy4u_090626010133_en.png", href: "https://goo.su/nx0OaOP", category: "proxies" },
  { name: "Affi.co", img: "/assets/img/partners/143/143_affico-2-1_100626044754_en.png", href: "https://goo.su/OJOGSs9", category: "proxies" },
  { name: "LikeVPS", img: "/assets/img/partners/148/148_frame-5_110626015749_en.png", href: "https://goo.su/d31LzCj", category: "proxies" },
  { name: "FlashID Antidetect Browser", img: "/assets/img/partners/150/150_frame-7_150626041824_en.png", href: "https://goo.su/7quHU", category: "browsers" },
  { name: "ThorData", img: "/assets/img/partners/151/151_gshpg_160626121827_en.png", href: "https://goo.su/5g2SmwZ", category: "proxies" },
  { name: "IPDeep", img: "/assets/img/partners/152/152_frame-1_170626010924_en.png", href: "https://goo.su/nfmdWNY", category: "proxies" },
  { name: "VMOS Cloud", img: "/assets/img/partners/153/153_frame-2_170626013255_en.png", href: "https://goo.su/JtYsO8", category: "browsers" },
  { name: "粉来宝 (fansbao)", img: "/assets/img/partners/154/154_ipma_180626125200_en.png", href: "https://goo.su/MdWrl", category: "sms" },
  { name: "Duoplus", img: "/assets/img/partners/155/155_ioji_220626013237_en.png", href: "https://goo.su/TDq8gw", category: "proxies" },
  { name: "BlazeProxies", img: "/assets/img/partners/156/156_sxa_230626120829_en.png", href: "https://goo.su/ICCE6kt", category: "proxies" },
  { name: "Mango Proxy", img: "/assets/img/partners/157/157_lkmjknj_240626115752_en.png", href: "https://goo.su/OUQPPy", category: "proxies" },
  { name: "anyIP", img: "/assets/img/partners/158/158_utskye_250626053531_en.png", href: "https://goo.su/Jw4RC", category: "proxies" },
  { name: "DolphinAnty", img: "/assets/img/partners/23/23_da-9f3a3d_060226032209_080726015251_en.png", href: "https://goo.su/cd8uyN", category: "browsers" },
  { name: "HeroSMS", img: "/assets/img/partners/22/22_idididi_100226090533_en.png", href: "https://is.gd/6jztlJ", category: "sms" },
  { name: "GrizzlySMS", img: "/assets/img/partners/28/28_gr-82b414_060226034101_en.png", href: "https://is.gd/k1cRh8", category: "sms" },
  { name: "SMSBower", img: "/assets/img/partners/25/25_smsbower_060226033145_en.png", href: "https://is.gd/72idaz", category: "sms" },
  { name: "Captcha AI", img: "/assets/img/partners/16/16_captchaai_050226042614_en.png", href: "https://is.gd/t4QtwT", category: "sms" },
  { name: "Nodemaven", img: "/assets/img/partners/17/17_nodemaven_050226042723_en.png", href: "https://goo.su/sBfYbq6", category: "sms" },
  { name: "Proxywing", img: "/assets/img/partners/18/18_proxywing_050226043503_en.png", href: "https://is.gd/iUemLT", category: "proxies" },
  { name: "MostLogin", img: "/assets/img/partners/29/29_ml-74e8b1_060226034412_en.png", href: "https://is.gd/sizPIG", category: "browsers" },
];

const categories = [
  { id: "all", label: "全部", icon: Filter },
  { id: "proxies", label: "代理", icon: Globe },
  { id: "browsers", label: "浏览器", icon: Monitor },
  { id: "sms", label: "短信服务", icon: Smartphone },
] as const;

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />
      <main>
        {/* ── Header ── */}
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Handshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  我们的合作伙伴
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  开放的合作为我们工作的基石。在这里，您将找到我们信赖的项目和服务，附有直达官网的链接
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Partner Grid ── */}
        <PartnerGrid />

        {/* ── CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                有兴趣合作吗？
              </h2>
              <p className="text-muted-foreground mb-8">
                留下您的联系方式，我们将与您取得联系
              </p>
              <Link
                href="/cn/contacts"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                成为合作伙伴 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recurring CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                助力频道快速增长的专业软件
              </h2>
              <p className="text-muted-foreground mb-8">
                加入成千上万信赖 Telegram Geeks 推广方案的专业人士
              </p>
              <Link
                href="/cn/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                购买许可证 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="cn" />
    </div>
  );
}

function PartnerGrid() {
  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {partners.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl border border-border bg-muted p-4 flex items-center justify-center aspect-[5/3] hover:border-primary/20 hover:bg-primary/5 transition-all overflow-hidden"
            >
              <img
                src={p.img}
                alt={p.name}
                className="max-w-full max-h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <ExternalLink className="w-3 h-3" />
                  访问
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
