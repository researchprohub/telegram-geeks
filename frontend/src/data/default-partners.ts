export interface Partner {
  id?: number;
  name: string;
  img: string;
  href: string;
  category: 'proxies' | 'browsers' | 'sms' | string;
  sort_order?: number;
}

export const DEFAULT_PARTNERS: Partner[] = [
  {
    "sort_order": 0,
    "name": "AstroProxy",
    "img": "/assets/img/partners/15/15_astro_060226023838_en.png",
    "href": "https://is.gd/QRBsaH",
    "category": "proxies"
  },
  {
    "sort_order": 1,
    "name": "Proxys",
    "img": "/assets/img/partners/19/19_proxy_050226043602_en.png",
    "href": "https://is.gd/0GJnDa",
    "category": "proxies"
  },
  {
    "sort_order": 2,
    "name": "PSBProxy",
    "img": "/assets/img/partners/20/20_psb_050226043820_en.png",
    "href": "https://is.gd/DubMSg",
    "category": "proxies"
  },
  {
    "sort_order": 3,
    "name": "Keyproxy",
    "img": "/assets/img/partners/21/21_keyproxy_050226061940_en.png",
    "href": "https://is.gd/xlSHB9",
    "category": "proxies"
  },
  {
    "sort_order": 4,
    "name": "LTEBoost",
    "img": "/assets/img/partners/24/24_lteboost_060226032840_en.png",
    "href": "https://is.gd/XOqp60",
    "category": "proxies"
  },
  {
    "sort_order": 5,
    "name": "SX.Org",
    "img": "/assets/img/partners/27/27_sxorg_060226033808_en.png",
    "href": "https://is.gd/JbDkSc",
    "category": "proxies"
  },
  {
    "sort_order": 6,
    "name": "The Safety",
    "img": "/assets/img/partners/31/31_ts-c8a330_060226035344_en.png",
    "href": "https://is.gd/bIR1wk",
    "category": "browsers"
  },
  {
    "sort_order": 7,
    "name": "ALISMS",
    "img": "/assets/img/partners/32/32_ali_060226035655_en.png",
    "href": "https://is.gd/DkwjPQ",
    "category": "sms"
  },
  {
    "sort_order": 8,
    "name": "Moresms",
    "img": "/assets/img/partners/35/35_moresms_060226040333_en.png",
    "href": "https://is.gd/h4sUdV",
    "category": "sms"
  },
  {
    "sort_order": 9,
    "name": "Coronium",
    "img": "/assets/img/partners/37/37_corn_090626010007_en.png",
    "href": "https://is.gd/TGMOik",
    "category": "proxies"
  },
  {
    "sort_order": 10,
    "name": "IPOASIS",
    "img": "/assets/img/partners/38/38_asis_090626125718_en.png",
    "href": "https://is.gd/prMlnr5",
    "category": "proxies"
  },
  {
    "sort_order": 11,
    "name": "White Link",
    "img": "/assets/img/partners/39/39_white_090626010205_en.png",
    "href": "https://is.gd/0iql9C",
    "category": "proxies"
  },
  {
    "sort_order": 12,
    "name": "Arbitrage Traffic",
    "img": "/assets/img/partners/40/40_arbitra_080626070358_en.png",
    "href": "https://is.gd/Ro1Ln8",
    "category": "proxies"
  },
  {
    "sort_order": 13,
    "name": "AntiSafety",
    "img": "/assets/img/partners/41/41_as-13bc24_080626070413_en.png",
    "href": "/contacts",
    "category": "browsers"
  },
  {
    "sort_order": 14,
    "name": "To Detect",
    "img": "/assets/img/partners/42/42_500x200_100226014909_en.png",
    "href": "https://is.gd/P6AtFg",
    "category": "browsers"
  },
  {
    "sort_order": 15,
    "name": "Live Proxies",
    "img": "/assets/img/partners/43/43_life_090626010042_en.png",
    "href": "https://is.gd/H13YmP",
    "category": "proxies"
  },
  {
    "sort_order": 16,
    "name": "SMS-Active",
    "img": "/assets/img/partners/44/44_12111_100226090102_en.png",
    "href": "/contacts",
    "category": "sms"
  },
  {
    "sort_order": 17,
    "name": "Cloaking.House",
    "img": "/assets/img/partners/45/45_cloak_080626071529_en.png",
    "href": "https://is.gd/SHouGw",
    "category": "proxies"
  },
  {
    "sort_order": 18,
    "name": "SWIFTPROXY",
    "img": "/assets/img/partners/46/46_swiftproxy-13_110226013747_en.png",
    "href": "https://is.gd/t5IM2m",
    "category": "proxies"
  },
  {
    "sort_order": 19,
    "name": "NovaProxy",
    "img": "/assets/img/partners/47/47_logo-light-500-200_110226014159_en.png",
    "href": "https://is.gd/itP64y",
    "category": "proxies"
  },
  {
    "sort_order": 20,
    "name": "PRM4U",
    "img": "/assets/img/partners/48/48_prm_080626070609_en.png",
    "href": "https://is.gd/QKPL5P",
    "category": "proxies"
  },
  {
    "sort_order": 21,
    "name": "Linken Sphere",
    "img": "/assets/img/partners/49/49_link_080626061228_en.png",
    "href": "https://is.gd/2SMfNd",
    "category": "browsers"
  },
  {
    "sort_order": 22,
    "name": "Browser Vision",
    "img": "/assets/img/partners/50/50_vision_080626062233_en.png",
    "href": "https://is.gd/HbpOjA",
    "category": "browsers"
  },
  {
    "sort_order": 23,
    "name": "NafeProxys",
    "img": "/assets/img/partners/51/51_nafe_080626070554_en.png",
    "href": "https://is.gd/aeNP7P",
    "category": "proxies"
  },
  {
    "sort_order": 24,
    "name": "CPA Mafia",
    "img": "/assets/img/partners/52/52_logo-500x200_130226120630_en.png",
    "href": "https://is.gd/TeAYmn",
    "category": "proxies"
  },
  {
    "sort_order": 25,
    "name": "MobileProxy",
    "img": "/assets/img/partners/54/54_mobproxy_080626070536_en.png",
    "href": "https://is.gd/uhPFtB",
    "category": "proxies"
  },
  {
    "sort_order": 26,
    "name": "Rapidproxy",
    "img": "/assets/img/partners/55/55_photo_2026-02-13_03-25-18_130226014409_en.png",
    "href": "https://is.gd/W9P0kf",
    "category": "proxies"
  },
  {
    "sort_order": 27,
    "name": "Proxy Coupons",
    "img": "/assets/img/partners/57/57_coupons_080626070514_en.png",
    "href": "https://is.gd/1nEYMu",
    "category": "proxies"
  },
  {
    "sort_order": 28,
    "name": "FBKilla",
    "img": "/assets/img/partners/58/58_fbkilla_080626061121_en.png",
    "href": "https://is.gd/vNMhvQ",
    "category": "browsers"
  },
  {
    "sort_order": 29,
    "name": "ProxySolutions",
    "img": "/assets/img/partners/59/59_500-200_160226120553_en.png",
    "href": "https://goo.su/KP2gcwh",
    "category": "proxies"
  },
  {
    "sort_order": 30,
    "name": "Boomlify",
    "img": "/assets/img/partners/60/60_boom_080626070456_en.png",
    "href": "https://is.gd/eVPFT8",
    "category": "proxies"
  },
  {
    "sort_order": 31,
    "name": "AnticBrowser",
    "img": "/assets/img/partners/61/61_antic_080626070322_en.png",
    "href": "https://goo.su/rVQTp",
    "category": "browsers"
  },
  {
    "sort_order": 32,
    "name": "GeeLark",
    "img": "/assets/img/partners/62/62_geelark_080626061142_en.png",
    "href": "https://goo.su/rgTXDx7",
    "category": "browsers"
  },
  {
    "sort_order": 33,
    "name": "UniMessenger",
    "img": "/assets/img/partners/63/63_unimess_080626070642_en.png",
    "href": "https://goo.su/JIcI3RX",
    "category": "browsers"
  },
  {
    "sort_order": 34,
    "name": "Ace Proxies",
    "img": "/assets/img/partners/64/64_ace_090626125702_en.png",
    "href": "https://goo.su/sBok",
    "category": "proxies"
  },
  {
    "sort_order": 35,
    "name": "BitBrowser",
    "img": "/assets/img/partners/65/65_bit_090626125740_en.png",
    "href": "https://goo.su/YCAH",
    "category": "browsers"
  },
  {
    "sort_order": 36,
    "name": "Aezakmi",
    "img": "/assets/img/partners/66/66_500h200-2_180226030617_en.png",
    "href": "https://www.aezakmi.app/",
    "category": "browsers"
  },
  {
    "sort_order": 37,
    "name": "Proxyma",
    "img": "/assets/img/partners/67/67_proxyma_090626010150_en.png",
    "href": "https://goo.su/dU0v",
    "category": "proxies"
  },
  {
    "sort_order": 38,
    "name": "Cloudbypass API",
    "img": "/assets/img/partners/68/68_cloud_090626125647_en.png",
    "href": "https://goo.su/yStno6V",
    "category": "proxies"
  },
  {
    "sort_order": 39,
    "name": "MoneySafe",
    "img": "/assets/img/partners/69/69_money_090626081910_en.png",
    "href": "https://goo.su/MnVbP",
    "category": "sms"
  },
  {
    "sort_order": 40,
    "name": "Novproxy",
    "img": "/assets/img/partners/70/70_165-1x_230226113025_en.png",
    "href": "https://goo.su/XfEt83D",
    "category": "proxies"
  },
  {
    "sort_order": 41,
    "name": "Cliproxy",
    "img": "/assets/img/partners/71/71_500200cli_230226113142_en.png",
    "href": "https://goo.su/qdLXjO",
    "category": "proxies"
  },
  {
    "sort_order": 42,
    "name": "RichProxy",
    "img": "/assets/img/partners/72/72_h-38d2f4_230226115543_en.png",
    "href": "https://clck.ru/3Ryr2M",
    "category": "proxies"
  },
  {
    "sort_order": 43,
    "name": "BeastBrowser",
    "img": "/assets/img/partners/73/73_beast_090626081707_en.png",
    "href": "https://beastbrowser.com/",
    "category": "browsers"
  },
  {
    "sort_order": 44,
    "name": "TradeProxy",
    "img": "/assets/img/partners/74/74_tradeproxy_240226011838_en.png",
    "href": "https://goo.su/bgAm3I",
    "category": "proxies"
  },
  {
    "sort_order": 45,
    "name": "Capi",
    "img": "/assets/img/partners/76/76_capi_080626061102_en.png",
    "href": "https://goo.su/E1nsR",
    "category": "proxies"
  },
  {
    "sort_order": 46,
    "name": "Undetectable",
    "img": "/assets/img/partners/77/77_undetect_250226105547_en.png",
    "href": "https://goo.su/k4KWg1z",
    "category": "browsers"
  },
  {
    "sort_order": 47,
    "name": "DSLRentals",
    "img": "/assets/img/partners/78/78_dslrentals_2_-removebg-p_250226115708_en.png",
    "href": "https://goo.su/iJSJRwd",
    "category": "proxies"
  },
  {
    "sort_order": 48,
    "name": "SaleSmartly",
    "img": "/assets/img/partners/79/79_sale_080626061307_en.png",
    "href": "https://goo.su/J3Nrg",
    "category": "browsers"
  },
  {
    "sort_order": 49,
    "name": "1024Proxy",
    "img": "/assets/img/partners/80/80_1024_080626071509_en.png",
    "href": "https://goo.su/pvU91qH",
    "category": "proxies"
  },
  {
    "sort_order": 50,
    "name": "XLogin",
    "img": "/assets/img/partners/81/81_login_090626081851_en.png",
    "href": "https://goo.su/Yu6YRpg",
    "category": "browsers"
  },
  {
    "sort_order": 51,
    "name": "MuLogin",
    "img": "/assets/img/partners/82/82_mulogin_090626010117_en.png",
    "href": "https://goo.su/gFjo8v8",
    "category": "browsers"
  },
  {
    "sort_order": 52,
    "name": "GoProxy",
    "img": "/assets/img/partners/83/83_goproxy_080626061200_en.png",
    "href": "https://goo.su/f0vAhKY",
    "category": "proxies"
  },
  {
    "sort_order": 53,
    "name": "ZeroCloak",
    "img": "/assets/img/partners/84/84_zerocloak-png_170326054843_en.png",
    "href": "https://goo.su/2lNN43",
    "category": "browsers"
  },
  {
    "sort_order": 54,
    "name": "IPCola",
    "img": "/assets/img/partners/85/85_ipcola_080626071453_en.png",
    "href": "https://goo.su/koBbtoU",
    "category": "proxies"
  },
  {
    "sort_order": 55,
    "name": "Captchas.io",
    "img": "/assets/img/partners/86/86_captcha_090626081730_en.png",
    "href": "https://goo.su/jJsBYWH",
    "category": "proxies"
  },
  {
    "sort_order": 56,
    "name": "Pay2.House",
    "img": "/assets/img/partners/87/87_pay2_080626071600_en.png",
    "href": "https://goo.su/1JNyaL",
    "category": "sms"
  },
  {
    "sort_order": 57,
    "name": "Comsign",
    "img": "/assets/img/partners/88/88_comsign_080626071545_en.png",
    "href": "https://goo.su/WyjrxH3",
    "category": "sms"
  },
  {
    "sort_order": 58,
    "name": "ProxyFlash",
    "img": "/assets/img/partners/89/89_flash_090626081816_en.png",
    "href": "https://goo.su/8yvnmrG",
    "category": "proxies"
  },
  {
    "sort_order": 59,
    "name": "PirateCPA",
    "img": "/assets/img/partners/90/90_bazaart_269f3969-6266-47e_060326062519_en.png",
    "href": "https://goo.su/TnrU8Dd",
    "category": "proxies"
  },
  {
    "sort_order": 60,
    "name": "GotoProxy",
    "img": "/assets/img/partners/91/91_goto_090626081832_en.png",
    "href": "https://goo.su/yAzhE",
    "category": "proxies"
  },
  {
    "sort_order": 61,
    "name": "FloppyData",
    "img": "/assets/img/partners/92/92_floop_090626081632_en.png",
    "href": "https://goo.su/xbgDjyT",
    "category": "proxies"
  },
  {
    "sort_order": 62,
    "name": "OnesProxy",
    "img": "/assets/img/partners/93/93_ones_090626081927_en.png",
    "href": "https://goo.su/lCWF4x",
    "category": "proxies"
  },
  {
    "sort_order": 63,
    "name": "Partnerkin",
    "img": "/assets/img/partners/94/94_part_080626061249_en.png",
    "href": "https://goo.su/OcFobf",
    "category": "proxies"
  },
  {
    "sort_order": 64,
    "name": "B2Proxy",
    "img": "/assets/img/partners/95/95_b2proxy_090626081647_en.png",
    "href": "https://goo.su/OYSW",
    "category": "proxies"
  },
  {
    "sort_order": 65,
    "name": "ProxyShard",
    "img": "/assets/img/partners/96/96_shard_090626081941_en.png",
    "href": "https://goo.su/M9VOr",
    "category": "proxies"
  },
  {
    "sort_order": 66,
    "name": "Zenlink",
    "img": "/assets/img/partners/97/97_zenlink_090626010219_en.png",
    "href": "https://goo.su/ajzi5",
    "category": "proxies"
  },
  {
    "sort_order": 67,
    "name": "ProxyPanda",
    "img": "/assets/img/partners/98/98_logo15_130326030716_en.png",
    "href": "https://goo.su/YFxtw",
    "category": "proxies"
  },
  {
    "sort_order": 68,
    "name": "Hoax.tech",
    "img": "/assets/img/partners/99/99_hoaxtech_500x200_for_blac_130326064007_en.png",
    "href": "https://hoax.tech/?promo=TELEGRAMEXPERT",
    "category": "proxies"
  },
  {
    "sort_order": 69,
    "name": "ExitAnty",
    "img": "/assets/img/partners/100/100_exit_090626082420_en.png",
    "href": "https://goo.su/yYHjfT",
    "category": "browsers"
  },
  {
    "sort_order": 70,
    "name": "Cyberyozh",
    "img": "/assets/img/partners/101/101_dizai-n-bez-nazvaniya-17_180326035232_en.png",
    "href": "https://goo.su/iH5odu",
    "category": "browsers"
  },
  {
    "sort_order": 71,
    "name": "Famesweb",
    "img": "/assets/img/partners/103/103_fames_090626082440_en.png",
    "href": "https://goo.su/p5YNRZD",
    "category": "proxies"
  },
  {
    "sort_order": 72,
    "name": "Adspect",
    "img": "/assets/img/partners/104/104_adspect_180326014252_en.png",
    "href": "https://goo.su/Ji3pi",
    "category": "proxies"
  },
  {
    "sort_order": 73,
    "name": "Detect.expert",
    "img": "/assets/img/partners/105/105_detect_090626082407_en.png",
    "href": "https://goo.su/DIkw",
    "category": "browsers"
  },
  {
    "sort_order": 74,
    "name": "TrafficMafia",
    "img": "/assets/img/partners/106/106_tm-e88e5d_080626062030_en.png",
    "href": "https://goo.su/RyH9y",
    "category": "proxies"
  },
  {
    "sort_order": 75,
    "name": "Spy.House",
    "img": "/assets/img/partners/107/107_spyhouse_080626070627_en.png",
    "href": "https://goo.su/cC8Hgu",
    "category": "proxies"
  },
  {
    "sort_order": 76,
    "name": "OkkProxy",
    "img": "/assets/img/partners/108/108_okk_090626082351_en.png",
    "href": "https://goo.su/xnZkIf",
    "category": "proxies"
  },
  {
    "sort_order": 77,
    "name": "ColaProxy",
    "img": "/assets/img/partners/109/109_photo_2026-03-25_09-59-38_250326032110_en.png",
    "href": "https://goo.su/mcrFVE",
    "category": "proxies"
  },
  {
    "sort_order": 78,
    "name": "NiuProxy",
    "img": "/assets/img/partners/110/110_photo_2026-03-25_09-59-54_250326032639_en.png",
    "href": "https://goo.su/HBJm8dG",
    "category": "proxies"
  },
  {
    "sort_order": 79,
    "name": "AffCult",
    "img": "/assets/img/partners/111/111_aff-cult-logo-black-3-1_250326033031_en.png",
    "href": "https://goo.su/ZgISs",
    "category": "proxies"
  },
  {
    "sort_order": 80,
    "name": "Proxysieutoc",
    "img": "/assets/img/partners/112/112_photo_2026-03-25_05-05-32_250326033208_en.png",
    "href": "https://goo.su/iUqcJoH",
    "category": "proxies"
  },
  {
    "sort_order": 81,
    "name": "IPFoxy",
    "img": "/assets/img/partners/113/113_photo_2026-03-25_04-57-57_250326033651_en.png",
    "href": "https://goo.su/xdgMpj4",
    "category": "proxies"
  },
  {
    "sort_order": 82,
    "name": "Push.House",
    "img": "/assets/img/partners/114/114_push_090626010910_en.png",
    "href": "https://goo.su/DTP9t",
    "category": "sms"
  },
  {
    "sort_order": 83,
    "name": "ProxyStyler",
    "img": "/assets/img/partners/116/116_116_090626084509_en.png",
    "href": "https://goo.su/xv98iF",
    "category": "proxies"
  },
  {
    "sort_order": 84,
    "name": "iProxy",
    "img": "/assets/img/partners/117/117_117_090626084524_en.png",
    "href": "https://goo.su/qbC8Z",
    "category": "proxies"
  },
  {
    "sort_order": 85,
    "name": "0DETECT",
    "img": "/assets/img/partners/119/119_119_090626084538_en.png",
    "href": "https://goo.su/CXIOs1",
    "category": "browsers"
  },
  {
    "sort_order": 86,
    "name": "Quarkip",
    "img": "/assets/img/partners/120/120_120_090626084553_en.png",
    "href": "https://goo.su/dbHeE",
    "category": "proxies"
  },
  {
    "sort_order": 87,
    "name": "FluxISP",
    "img": "/assets/img/partners/121/121_500200removebgpreview_100426022609_en.png",
    "href": "https://goo.su/UaA3sI",
    "category": "proxies"
  },
  {
    "sort_order": 88,
    "name": "GonzoProxy",
    "img": "/assets/img/partners/122/122_122_090626084605_en.png",
    "href": "https://goo.su/jyzjl",
    "category": "proxies"
  },
  {
    "sort_order": 89,
    "name": "Huoniaozhanghao",
    "img": "/assets/img/partners/123/123_123_090626084619_en.png",
    "href": "https://goo.su/GTERpH",
    "category": "proxies"
  },
  {
    "sort_order": 90,
    "name": "PXM2",
    "img": "/assets/img/partners/124/124_124_090626084632_en.png",
    "href": "https://goo.su/888vU",
    "category": "proxies"
  },
  {
    "sort_order": 91,
    "name": "Proxiware",
    "img": "/assets/img/partners/126/126_126_090626084645_en.png",
    "href": "https://goo.su/jaWCO",
    "category": "proxies"
  },
  {
    "sort_order": 92,
    "name": "LTEasy Proxies",
    "img": "/assets/img/partners/127/127_127_090626084659_en.png",
    "href": "https://goo.su/Vk8chAX",
    "category": "proxies"
  },
  {
    "sort_order": 93,
    "name": "Proxies.sx",
    "img": "/assets/img/partners/128/128_128_090626084718_en.png",
    "href": "https://goo.su/kO6q",
    "category": "proxies"
  },
  {
    "sort_order": 94,
    "name": "ArealProxy",
    "img": "/assets/img/partners/129/129_129_090626084733_en.png",
    "href": "https://clck.ru/3Tfo9N",
    "category": "proxies"
  },
  {
    "sort_order": 95,
    "name": "Ads Approved",
    "img": "/assets/img/partners/130/130_appr_090626010802_en.png",
    "href": "https://goo.su/mZoDqw",
    "category": "proxies"
  },
  {
    "sort_order": 96,
    "name": "Proxy.Luxe",
    "img": "/assets/img/partners/131/131_131_090626084747_en.png",
    "href": "https://proxy.luxe/en",
    "category": "proxies"
  },
  {
    "sort_order": 97,
    "name": "BlurPath",
    "img": "/assets/img/partners/132/132_blur_080626070441_en.png",
    "href": "https://clck.ru/3TqeV6",
    "category": "browsers"
  },
  {
    "sort_order": 98,
    "name": "a1proxy",
    "img": "/assets/img/partners/133/133_aiproxy_080626070306_en.png",
    "href": "https://clck.ru/3TqeaB",
    "category": "proxies"
  },
  {
    "sort_order": 99,
    "name": "mtwspy",
    "img": "/assets/img/partners/134/134_mtw_090626010627_en.png",
    "href": "https://goo.su/ua96k",
    "category": "sms"
  },
  {
    "sort_order": 100,
    "name": "Quantum Proxies",
    "img": "/assets/img/partners/135/135_quan_090626010503_en.png",
    "href": "https://goo.su/JNuxc9",
    "category": "proxies"
  },
  {
    "sort_order": 101,
    "name": "Cloakerly",
    "img": "/assets/img/partners/136/136_cloak_090626125758_en.png",
    "href": "https://goo.su/0vUkoA",
    "category": "proxies"
  },
  {
    "sort_order": 102,
    "name": "OctoBrowser",
    "img": "/assets/img/partners/137/137_color-1_030626010411_en.png",
    "href": "https://goo.su/LTpF3v",
    "category": "browsers"
  },
  {
    "sort_order": 103,
    "name": "Adshine",
    "img": "/assets/img/partners/138/138_hine_090626125834_en.png",
    "href": "https://goo.su/iQwvyrg",
    "category": "proxies"
  },
  {
    "sort_order": 104,
    "name": "Proxy4U",
    "img": "/assets/img/partners/139/139_proxy4u_090626010133_en.png",
    "href": "https://goo.su/nx0OaOP",
    "category": "proxies"
  },
  {
    "sort_order": 105,
    "name": "Affi.co",
    "img": "/assets/img/partners/143/143_affico-2-1_100626044754_en.png",
    "href": "https://goo.su/OJOGSs9",
    "category": "proxies"
  },
  {
    "sort_order": 106,
    "name": "LikeVPS",
    "img": "/assets/img/partners/148/148_frame-5_110626015749_en.png",
    "href": "https://goo.su/d31LzCj",
    "category": "proxies"
  },
  {
    "sort_order": 107,
    "name": "FlashID Antidetect Browser",
    "img": "/assets/img/partners/150/150_frame-7_150626041824_en.png",
    "href": "https://goo.su/7quHU",
    "category": "browsers"
  },
  {
    "sort_order": 108,
    "name": "ThorData",
    "img": "/assets/img/partners/151/151_gshpg_160626121827_en.png",
    "href": "https://goo.su/5g2SmwZ",
    "category": "proxies"
  },
  {
    "sort_order": 109,
    "name": "IPDeep",
    "img": "/assets/img/partners/152/152_frame-1_170626010924_en.png",
    "href": "https://goo.su/nfmdWNY",
    "category": "proxies"
  },
  {
    "sort_order": 110,
    "name": "VMOS Cloud",
    "img": "/assets/img/partners/153/153_frame-2_170626013255_en.png",
    "href": "https://goo.su/JtYsO8",
    "category": "browsers"
  },
  {
    "sort_order": 111,
    "name": "\u7c89\u6765\u5b9d (fansbao)",
    "img": "/assets/img/partners/154/154_ipma_180626125200_en.png",
    "href": "https://goo.su/MdWrl",
    "category": "sms"
  },
  {
    "sort_order": 112,
    "name": "Duoplus",
    "img": "/assets/img/partners/155/155_ioji_220626013237_en.png",
    "href": "https://goo.su/TDq8gw",
    "category": "proxies"
  },
  {
    "sort_order": 113,
    "name": "BlazeProxies",
    "img": "/assets/img/partners/156/156_sxa_230626120829_en.png",
    "href": "https://goo.su/ICCE6kt",
    "category": "proxies"
  },
  {
    "sort_order": 114,
    "name": "Mango Proxy",
    "img": "/assets/img/partners/157/157_lkmjknj_240626115752_en.png",
    "href": "https://goo.su/OUQPPy",
    "category": "proxies"
  },
  {
    "sort_order": 115,
    "name": "anyIP",
    "img": "/assets/img/partners/158/158_utskye_250626053531_en.png",
    "href": "https://goo.su/Jw4RC",
    "category": "proxies"
  },
  {
    "sort_order": 116,
    "name": "DolphinAnty",
    "img": "/assets/img/partners/23/dolphin-anty-logo.svg",
    "href": "https://goo.su/cd8uyN",
    "category": "browsers"
  },
  {
    "sort_order": 117,
    "name": "HeroSMS",
    "img": "/assets/img/partners/22/22_idididi_100226090533_en.png",
    "href": "https://is.gd/6jztlJ",
    "category": "sms"
  },
  {
    "sort_order": 118,
    "name": "GrizzlySMS",
    "img": "/assets/img/partners/28/28_gr-82b414_060226034101_en.png",
    "href": "https://is.gd/k1cRh8",
    "category": "sms"
  },
  {
    "sort_order": 119,
    "name": "SMSBower",
    "img": "/assets/img/partners/25/25_smsbower_060226033145_en.png",
    "href": "https://is.gd/72idaz",
    "category": "sms"
  },
  {
    "sort_order": 120,
    "name": "Captcha AI",
    "img": "/assets/img/partners/16/16_captchaai_050226042614_en.png",
    "href": "https://is.gd/t4QtwT",
    "category": "sms"
  },
  {
    "sort_order": 121,
    "name": "Nodemaven",
    "img": "/assets/img/partners/17/17_nodemaven_050226042723_en.png",
    "href": "https://goo.su/sBfYbq6",
    "category": "sms"
  },
  {
    "sort_order": 122,
    "name": "Proxywing",
    "img": "/assets/img/partners/18/18_proxywing_050226043503_en.png",
    "href": "https://is.gd/iUemLT",
    "category": "proxies"
  },
  {
    "sort_order": 123,
    "name": "MostLogin",
    "img": "/assets/img/partners/29/29_ml-74e8b1_060226034412_en.png",
    "href": "https://is.gd/sizPIG",
    "category": "browsers"
  }
];
