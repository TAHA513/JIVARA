import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { products, categories } from "../shared/schema";
import { eq } from "drizzle-orm";

const connStr = process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString: connStr,
  ssl: connStr.includes("render.com") ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

type Item = { name:string; nameAr:string; sku:string; cost:number; qty:number; slug:string };

const items: Item[] = [
  // ============== INVOICE 1 (032208) Items 1-20 ==============
  { name:"Hoco X20 Cable 3M",         nameAr:"كيبل هوكو X20 3متر",          sku:"HOCO-X20-3M",    cost:1900, qty:5,  slug:"cables" },
  { name:"Hoco X20 Cable 2M",         nameAr:"كيبل هوكو X20 2متر",          sku:"HOCO-X20-2M",    cost:1600, qty:6,  slug:"cables" },
  { name:"Hoco X113 TC-IP Cable",     nameAr:"كيبل هوكو X113 TC-IP",        sku:"HOCO-X113",      cost:1500, qty:6,  slug:"cables" },
  { name:"Hoco X125 TC-TC Cable",     nameAr:"كيبل هوكو X125 TC-TC",        sku:"HOCO-X125",      cost:2200, qty:5,  slug:"cables" },
  { name:"Hoco X112 TC-IP Cable",     nameAr:"كيبل هوكو X112 TC-IP",        sku:"HOCO-X112",      cost:2800, qty:5,  slug:"cables" },
  { name:"Hoco U112 TC-TC Cable",     nameAr:"كيبل هوكو U112 TC-TC",        sku:"HOCO-U112-TT",   cost:3900, qty:5,  slug:"cables" },
  { name:"Hoco U112 Cable",           nameAr:"كيبل هوكو U112",              sku:"HOCO-U112",      cost:3750, qty:5,  slug:"cables" },
  { name:"Hoco X107 Cable",           nameAr:"كيبل هوكو X107",              sku:"HOCO-X107",      cost:900,  qty:18, slug:"cables" },
  { name:"Hoco X107 TC-TC Cable",     nameAr:"كيبل هوكو X107 TC-TC",        sku:"HOCO-X107-TT",   cost:1150, qty:6,  slug:"cables" },
  { name:"Hoco X88 Cable",            nameAr:"كيبل هوكو X88",               sku:"HOCO-X88",       cost:750,  qty:19, slug:"cables" },
  { name:"Hoco X89 Cable",            nameAr:"كيبل هوكو X89",               sku:"HOCO-X89",       cost:900,  qty:18, slug:"cables" },
  { name:"Hoco U110 Cable",           nameAr:"كيبل هوكو U110",              sku:"HOCO-U110",      cost:1600, qty:18, slug:"cables" },
  { name:"Marshal MA14 Earphone",     nameAr:"سماعة مارشال MA14",           sku:"MSHL-MA14",      cost:2000, qty:3,  slug:"earphones" },
  { name:"Voxer VX2 Earphone",        nameAr:"سماعة فوكسر VX2",             sku:"VOXR-VX2",       cost:3450, qty:3,  slug:"earphones" },
  { name:"Marshal MA13 Earphone",     nameAr:"سماعة مارشال MA13",           sku:"MSHL-MA13",      cost:1750, qty:5,  slug:"earphones" },
  { name:"Marshal ML01 Car Charger Head", nameAr:"رأس شاحن سيارة مارشال ML01", sku:"MSHL-ML01",   cost:3250, qty:3,  slug:"chargers" },
  { name:"Marshal MC01 Charger",      nameAr:"شاحن مارشال MC01",            sku:"MSHL-MC01",      cost:5000, qty:3,  slug:"chargers" },
  { name:"Marshal MH03 TC-IP Cable",  nameAr:"كيبل مارشال MH03 TC-IP",      sku:"MSHL-MH03-IP",   cost:2500, qty:1,  slug:"cables" },
  { name:"Marshal MH03 TC-TC Cable",  nameAr:"كيبل مارشال MH03 TC-TC",      sku:"MSHL-MH03-TT",   cost:2250, qty:2,  slug:"cables" },
  { name:"Marshal MA06 Earphone",     nameAr:"سماعة مارشال MA06",           sku:"MSHL-MA06-E",    cost:2750, qty:4,  slug:"earphones" },

  // ============== INVOICE 2 (032241) Items 21-44 ==============
  { name:"Voxer VH14 Earphone",       nameAr:"سماعة فوكسر VH14",            sku:"VOXR-VH14",      cost:2250, qty:3,  slug:"earphones" },
  { name:"Hoco C88A Charger",         nameAr:"شاحن هوكو C88A",              sku:"HOCO-C88A",      cost:3100, qty:3,  slug:"chargers" },
  { name:"Hoco C81A Charger",         nameAr:"شاحن هوكو C81A",              sku:"HOCO-C81A",      cost:2175, qty:10, slug:"chargers" },
  { name:"Marshal MR14 Neckband",     nameAr:"سماعة طوق مارشال MR14",       sku:"MSHL-MR14",      cost:7500, qty:2,  slug:"earphones" },
  { name:"Marshal MA05 TC-TC Cable",  nameAr:"كيبل مارشال MA05 TC-TC",      sku:"MSHL-MA05",      cost:4000, qty:3,  slug:"cables" },
  { name:"Marshal MA06 IP-TC Cable",  nameAr:"كيبل مارشال MA06 IP-TC",      sku:"MSHL-MA06-C",    cost:3250, qty:3,  slug:"cables" },
  { name:"Hoco X115 100W Cable",      nameAr:"كيبل هوكو X115 100W",         sku:"HOCO-X115-100W", cost:1450, qty:6,  slug:"cables" },
  { name:"Marshal MC20 TC-TC Charger",nameAr:"شاحن مارشال MC20 TC-TC",      sku:"MSHL-MC20-TT",   cost:7500, qty:3,  slug:"chargers" },
  { name:"Marshal MR13 Neckband",     nameAr:"سماعة طوق مارشال MR13",       sku:"MSHL-MR13",      cost:7500, qty:2,  slug:"earphones" },
  { name:"Marshal MG04 Car Charger",  nameAr:"شاحن سيارة مارشال MG04",      sku:"MSHL-MG04",      cost:4000, qty:3,  slug:"chargers" },
  { name:"Marshal MC04 Charger",      nameAr:"شاحن مارشال MC04",            sku:"MSHL-MC04",      cost:4750, qty:3,  slug:"chargers" },
  { name:"Marshal MC20 Charger",      nameAr:"شاحن مارشال MC20",            sku:"MSHL-MC20",      cost:4000, qty:3,  slug:"chargers" },
  { name:"Earphone Assorted 750",     nameAr:"سماعة منوع 750",              sku:"EAR-MIX-750",    cost:750,  qty:20, slug:"earphones" },
  { name:"Max Safe Shield",           nameAr:"درع ماكس سيف",                sku:"MAX-SAFE",       cost:1000, qty:32, slug:"phone-protection" },
  { name:"Shield Assorted 3K",        nameAr:"درع منوع A",                  sku:"SHLD-MIX-3K",    cost:3000, qty:11, slug:"phone-protection" },
  { name:"Shield Assorted 5.5K",      nameAr:"درع منوع B",                  sku:"SHLD-MIX-55",    cost:5500, qty:3,  slug:"phone-protection" },
  { name:"Marshal Shield Assorted",   nameAr:"درع مارشال منوع",             sku:"MSHL-SHLD",      cost:2500, qty:4,  slug:"phone-protection" },
  { name:"Hoco W35 MAX ANC Headphone",nameAr:"سماعة هوكو W35 MAX ANC",      sku:"HOCO-W35-ANC",   cost:17700,qty:2,  slug:"earphones" },
  { name:"Hoco W35 AIR Headphone",    nameAr:"سماعة هوكو W35 AIR",          sku:"HOCO-W35-AIR",   cost:10000,qty:2,  slug:"earphones" },
  { name:"Marshal ME01 Bluetooth",    nameAr:"سماعة بلوتوث مارشال ME01",    sku:"MSHL-ME01",      cost:11000,qty:2,  slug:"earphones" },
  { name:"Earphone Assorted 2250",    nameAr:"سماعة منوع 2250",             sku:"EAR-MIX-2250",   cost:2250, qty:6,  slug:"earphones" },
  { name:"XO C157 Stand",             nameAr:"ستاند XO C157",               sku:"XO-C157",        cost:3000, qty:3,  slug:"stands" },
  { name:"Voxer 6D Glass Sticker",    nameAr:"لاصق جام VOXER 6D",           sku:"VOXR-6D-GL",     cost:500,  qty:60, slug:"phone-protection" },
  { name:"Hoco ES71 Bluetooth",       nameAr:"سماعة بلوتوث هوكو ES71",      sku:"HOCO-ES71",      cost:10450,qty:2,  slug:"earphones" },

  // ============== INVOICE 3 (032258) Items 45-68 ==============
  { name:"Charger Head Assorted",     nameAr:"رأس شاحن منوع",               sku:"CHR-HD-MIX",     cost:500,   qty:70, slug:"chargers" },
  { name:"Marshal MU01 Charger",      nameAr:"شاحن مارشال MU01",            sku:"MSHL-MU01",      cost:3500,  qty:7,  slug:"chargers" },
  { name:"Marshal MS03 Smart Watch",  nameAr:"ساعة مارشال MS03",            sku:"MSHL-MS03",      cost:21000, qty:3,  slug:"smart-watches" },
  { name:"Marshal Watch Card",        nameAr:"كرت ساعة مارشال",             sku:"MSHL-WCARD",     cost:7500,  qty:2,  slug:"smart-watches" },
  { name:"Marshal L21 Watch",         nameAr:"ساعة مارشال L21",             sku:"MSHL-L21",       cost:9100,  qty:1,  slug:"smart-watches" },
  { name:"Marshal L21-IP Watch",      nameAr:"ساعة مارشال L21-IP",          sku:"MSHL-L21-IP",    cost:10500, qty:1,  slug:"smart-watches" },
  { name:"Marshal L20A TC+IP Watch",  nameAr:"ساعة مارشال L20A TC+IP",      sku:"MSHL-L20A",      cost:13500, qty:2,  slug:"smart-watches" },
  { name:"Marshal MS05 Watch",        nameAr:"ساعة مارشال MS05",            sku:"MSHL-MS05",      cost:3750,  qty:2,  slug:"smart-watches" },
  { name:"Marshal MT01 Mobile",       nameAr:"جوالة مارشال MT01",           sku:"MSHL-MT01",      cost:15250, qty:2,  slug:"smart-watches" },
  { name:"Marshal MS07/PD Watch",     nameAr:"ساعة مارشال MS07/PD",         sku:"MSHL-MS07",      cost:500,   qty:210,slug:"smart-watches" },
  { name:"Smart Watch Assorted 13K",  nameAr:"ساعة بلوتوث منوع 13K",        sku:"WATCH-MIX-13",   cost:13000, qty:1,  slug:"smart-watches" },
  { name:"Smart Watch Assorted 10K",  nameAr:"ساعة منوع 10K",               sku:"WATCH-MIX-10",   cost:10000, qty:1,  slug:"smart-watches" },
  { name:"Smart Watch Assorted 8.5K", nameAr:"ساعة منوع 8500",              sku:"WATCH-MIX-85",   cost:8500,  qty:4,  slug:"smart-watches" },
  { name:"Hoco DCA73 Watch",          nameAr:"ساعة هوكو DCA73",             sku:"HOCO-DCA73",     cost:3400,  qty:2,  slug:"smart-watches" },
  { name:"Hoco DH25 Watch",           nameAr:"ساعة هوكو DH25",              sku:"HOCO-DH25",      cost:15500, qty:2,  slug:"smart-watches" },
  { name:"Bluetooth Earphone Mixed 12K", nameAr:"سماعة بلوتوث منوع 12K",    sku:"EAR-MIX-12K",    cost:12000, qty:2,  slug:"earphones" },
  { name:"Speaker Assorted",          nameAr:"سبيكر منوع",                  sku:"SPK-MIX-15",     cost:1500,  qty:10, slug:"speakers" },
  { name:"Camera Sticker Assorted",   nameAr:"لاصق كامرة منوع",             sku:"CAM-STK-2K",     cost:2000,  qty:4,  slug:"phone-protection" },
  { name:"Ring Light Standard 9K",    nameAr:"رينج لايت ستاندرد 9K",        sku:"RING-STD-9K",    cost:9000,  qty:2,  slug:"ring-lights" },
  { name:"Smart Watch Brand 11K",     nameAr:"ساعة منوع 11K",               sku:"WATCH-MIX-11",   cost:11000, qty:2,  slug:"smart-watches" },
  { name:"Smart Watch Brand 5K",      nameAr:"ساعة منوع 5K",                sku:"WATCH-MIX-5K",   cost:5000,  qty:2,  slug:"smart-watches" },
  { name:"Smart Watch Brand 5K B",    nameAr:"ساعة منوع 5K B",              sku:"WATCH-MIX-5KB",  cost:5000,  qty:2,  slug:"smart-watches" },
  { name:"Camera Brand Item",         nameAr:"كامرة منوع",                  sku:"CAM-MIX-11K",    cost:11000, qty:1,  slug:"cameras" },
  { name:"Hoco H101 Sticker",         nameAr:"ستيكر هوكو H101",             sku:"HOCO-H101",      cost:7800,  qty:2,  slug:"phone-protection" },

  // ============== INVOICE 4 (032310) Items 69-92 ==============
  { name:"Hoco DCA31 PLUS Stand",     nameAr:"ستاند هوكو DCA31 PLUS",       sku:"HOCO-DCA31P",    cost:5250, qty:1,  slug:"stands" },
  { name:"Hoco EQ21 Bluetooth",       nameAr:"سماعة بلوتوث هوكو EQ21",      sku:"HOCO-EQ21",      cost:18450,qty:2,  slug:"earphones" },
  { name:"Stand Assorted",            nameAr:"ستاند منوع",                  sku:"STAND-MIX",      cost:4500, qty:2,  slug:"stands" },
  { name:"Bluetooth Speaker M3",      nameAr:"سبيكر بلوتوث M3",             sku:"SPK-M3",         cost:6500, qty:2,  slug:"speakers" },
  { name:"Hoco DI64 Camera",          nameAr:"كاميرا هوكو DI64",            sku:"HOCO-DI64",      cost:30000,qty:1,  slug:"cameras" },
  { name:"Bluetooth Speaker 1365",    nameAr:"سبيكر بلوتوث 1365",           sku:"SPK-1365",       cost:3500, qty:2,  slug:"speakers" },
  { name:"Bluetooth Speaker 1390",    nameAr:"سبيكر بلوتوث 1390",           sku:"SPK-1390",       cost:6000, qty:2,  slug:"speakers" },
  { name:"Bluetooth Speaker 1363",    nameAr:"سبيكر بلوتوث 1363",           sku:"SPK-1363",       cost:3000, qty:2,  slug:"speakers" },
  { name:"Hoco DI63 Camera",          nameAr:"كاميرا هوكو DI63",            sku:"HOCO-DI63",      cost:24450,qty:1,  slug:"cameras" },
  { name:"Anker Bluetooth Headphone", nameAr:"سماعة حاسبة بلوتوث منوع (انكر)",sku:"ANKR-BT-HP",   cost:8000, qty:2,  slug:"earphones" },
  { name:"Marshal MP10 Travel Charger",nameAr:"شاحن سفري مارشال MP10",      sku:"MSHL-MP10",      cost:17000,qty:1,  slug:"chargers" },
  { name:"Hoco HD6 Stand",            nameAr:"ستاند هوكو HD6",              sku:"HOCO-HD6",       cost:3000, qty:2,  slug:"stands" },
  { name:"Hoco H19 Stand",            nameAr:"ستاند هوكو H19",              sku:"HOCO-H19",       cost:3400, qty:2,  slug:"stands" },
  { name:"Ring Light 35cm",           nameAr:"رينج لايت 35 سم",             sku:"RING-35",        cost:13000,qty:1,  slug:"ring-lights" },
  { name:"Ring Light 38cm",           nameAr:"رينج لايت 38 سم",             sku:"RING-38",        cost:14500,qty:1,  slug:"ring-lights" },
  { name:"Ring Light Standard",       nameAr:"رينج لايت ستاندرد",           sku:"RING-STD",       cost:10000,qty:1,  slug:"ring-lights" },
  { name:"Ring Light 45cm",           nameAr:"رينج لايت 45 سم",             sku:"RING-45",        cost:18000,qty:1,  slug:"ring-lights" },
  { name:"Phone Ring Holder Sticker", nameAr:"حلقة موبايل منوع (ستيكر)",    sku:"PHONE-RING-STK", cost:500,  qty:32, slug:"phone-protection" },
  { name:"Marshal MD02 Connector",    nameAr:"توصالة مارشال MD02",          sku:"MSHL-MD02",      cost:4750, qty:2,  slug:"cables" },
  { name:"iPhone 7 Copy Earphone",    nameAr:"سماعة ايفون 7 كوبي",          sku:"IP7-EAR-CPY",    cost:3250, qty:5,  slug:"earphones" },
  { name:"TC Original Earphone",      nameAr:"سماعة اصلية TC",              sku:"TC-EAR-ORIG",    cost:3000, qty:3,  slug:"earphones" },
  { name:"Hoco DY12 Smart Watch",     nameAr:"ساعة هوكو DY12",              sku:"HOCO-DY12",      cost:25500,qty:1,  slug:"smart-watches" },
  { name:"Camera Tripod Stand",       nameAr:"ستاند كامرة",                 sku:"CAM-TRIPOD",     cost:18000,qty:2,  slug:"stands" },
  { name:"Hoco GM24 Wireless Mouse",  nameAr:"ماوس هوكو GM24 لاسلكي",       sku:"HOCO-GM24",      cost:6250, qty:1,  slug:"mouse-tech" },

  // ============== INVOICE 5 (032321) Items 93-116 - smart-watches mostly ==============
  { name:"Marshal EW78 Watch Mixed",  nameAr:"ساعة مارشال EW78 منوع",       sku:"MSHL-EW78",      cost:2000,  qty:17, slug:"smart-watches" },
  { name:"Marshal Y42 ULTRA Watch",   nameAr:"ساعة مارشال Y42 ULTRA",       sku:"MSHL-Y42-ULT",   cost:7950,  qty:2,  slug:"smart-watches" },
  { name:"Marshal DLR17 Watch",       nameAr:"ساعة مارشال DLR17",           sku:"MSHL-DLR17",     cost:20650, qty:1,  slug:"smart-watches" },
  { name:"Marshal EW68 Watch",        nameAr:"ساعة مارشال EW68",            sku:"MSHL-EW68",      cost:1350,  qty:5,  slug:"smart-watches" },
  { name:"Marshal EQ10 PLUS Watch",   nameAr:"ساعة مارشال EQ10 PLUS",       sku:"MSHL-EQ10P",     cost:14550, qty:2,  slug:"smart-watches" },
  { name:"Marshal EQ5 Watch",         nameAr:"ساعة مارشال EQ5",             sku:"MSHL-EQ5",       cost:14200, qty:2,  slug:"smart-watches" },
  { name:"Marshal PD Watch (case)",   nameAr:"ساعة مارشال PD",              sku:"MSHL-PD-CASE",   cost:17400, qty:2,  slug:"smart-watches" },
  { name:"Marshal MF01 Watch Mixed",  nameAr:"ساعة مارشال MF01 منوع",       sku:"MSHL-MF01",      cost:7500,  qty:2,  slug:"smart-watches" },
  { name:"Marshal TC-TC Watch Mixed", nameAr:"ساعة مارشال TC-TC منوع",      sku:"MSHL-TCTC-W",    cost:1600,  qty:5,  slug:"smart-watches" },
  { name:"Marshal PD Watch Mixed",    nameAr:"ساعة مارشال PD منوع",         sku:"MSHL-PD-MIX",    cost:3000,  qty:10, slug:"smart-watches" },
  { name:"Marshal PD Watch Broken",   nameAr:"ساعة مارشال PD مكسر",         sku:"MSHL-PD-BRK",    cost:10000, qty:2,  slug:"smart-watches" },
  { name:"Marshal IGD Watch Mixed",   nameAr:"ساعة مارشال ايجدي منوع",      sku:"MSHL-IGD",       cost:10000, qty:3,  slug:"smart-watches" },
  { name:"Marshal TC GO DES Watch",   nameAr:"ساعة مارشال TC GO DES",       sku:"MSHL-TCGODES",   cost:12000, qty:3,  slug:"smart-watches" },
  { name:"Marshal WA02 Camera Watch", nameAr:"ساعة جامعة WA02",             sku:"MSHL-WA02",      cost:5500,  qty:2,  slug:"smart-watches" },
  { name:"Marshal Bibber Watch",      nameAr:"ساعة بربر",                   sku:"MSHL-BIBBER",    cost:1950,  qty:2,  slug:"smart-watches" },
  { name:"Marshal Y42 Watch Mixed",   nameAr:"ساعة مارشال Y42 منوع",        sku:"MSHL-Y42-MIX",   cost:22050, qty:2,  slug:"smart-watches" },
  { name:"Marshal MRH01 Watch",       nameAr:"ساعة مارشال MRH01",           sku:"MSHL-MRH01",     cost:15000, qty:2,  slug:"smart-watches" },
  { name:"XO-C156 Watch",             nameAr:"ساعة XO-C156",                sku:"XO-C156-W",      cost:12750, qty:2,  slug:"smart-watches" },
  { name:"Watch Plain 1500",          nameAr:"ساعة سايس بحرف",              sku:"WATCH-1500",     cost:1500,  qty:10, slug:"smart-watches" },
  { name:"Y28 Watch",                 nameAr:"ساعة Y28",                    sku:"Y28-W",          cost:30700, qty:1,  slug:"smart-watches" },
  { name:"Y28 Watch Mixed",           nameAr:"ساعة Y28 منوع",               sku:"Y28-W-MIX",      cost:5000,  qty:3,  slug:"smart-watches" },
  { name:"TC Marshal TC Watch",       nameAr:"ساعة مارشال TC",              sku:"MSHL-TC-W",      cost:8000,  qty:3,  slug:"smart-watches" },
  { name:"TC-15 Marshal Watch",       nameAr:"ساعة مارشال TC-15",           sku:"MSHL-TC15",      cost:9500,  qty:2,  slug:"smart-watches" },
  { name:"TYPE-C Marshal Watch",      nameAr:"ساعة مارشال TYPE-C",          sku:"MSHL-TYPC",      cost:8000,  qty:3,  slug:"smart-watches" },

  // ============== INVOICE 6 (032330) Items 117-123 ==============
  { name:"Samsung Original Charger 25W", nameAr:"رأس شاحن اصلي سامسونغ 25W", sku:"SAM-CHR-25W",   cost:6000, qty:2,  slug:"chargers" },
  { name:"iPhone Original Charger 3pc Kit", nameAr:"شاحن ايفون اصلي ثلاثي كيس", sku:"IPHONE-CHR-KIT", cost:3000,qty:3, slug:"chargers" },
  { name:"Camera Sticker",            nameAr:"لاصق كامرة",                  sku:"CAM-STKR",       cost:2000, qty:6,  slug:"phone-protection" },
  { name:"Camera Sticker Glitter",    nameAr:"لاصق كامرة شذر",              sku:"CAM-STKR-GL",    cost:2500, qty:3,  slug:"phone-protection" },
  { name:"UPS Nano",                  nameAr:"UPS نانو",                    sku:"UPS-NANO",       cost:17000,qty:1,  slug:"ups-batteries" },
  { name:"Marshal UPS Nano 12000mAh", nameAr:"UPS نانو مارشال 12000mAh",    sku:"MSHL-UPS-12K",   cost:21000,qty:1,  slug:"ups-batteries" },
  { name:"Hoco DLR02 Battery 4PCS",   nameAr:"بطارية هوكو DLR02 4 حبات",    sku:"HOCO-DLR02",     cost:1050, qty:1,  slug:"ups-batteries" },

  // ============== INVOICE 7 (032358) Small invoice - 9 items ==============
  { name:"iPhone Case RV134",         nameAr:"درع ايفون RV134",             sku:"IP-CASE-RV134",  cost:5500, qty:7,  slug:"phone-protection" },
  { name:"iPhone Case IGC",           nameAr:"درع ايفون IGC",               sku:"IP-CASE-IGC",    cost:4500, qty:7,  slug:"phone-protection" },
  { name:"iPhone Case AJ53",          nameAr:"درع ايفون AJ53",              sku:"IP-CASE-AJ53",   cost:4000, qty:4,  slug:"phone-protection" },
  { name:"iPhone Ladies Case G2501",  nameAr:"درع ايفون نسائي G2501",       sku:"IP-CASE-G2501",  cost:8000, qty:2,  slug:"phone-protection" },
  { name:"X-Level Duke Case",         nameAr:"درع X-Level Duke",            sku:"XLVL-DUKE",      cost:5500, qty:4,  slug:"phone-protection" },
  { name:"Earldom ET-EH149 Holder",   nameAr:"هولدر Earldom ET-EH149",      sku:"ERL-ETEH149",    cost:5000, qty:3,  slug:"stands" },
  { name:"WUW-Y146 Power Bank 20000mAh", nameAr:"باور بانك WUW-Y146 20000mAh", sku:"WUW-Y146",    cost:13000,qty:2,  slug:"power-banks" },
  { name:"Oraimo OTW324 Earphone",    nameAr:"سماعة Oraimo OTW324",         sku:"ORM-OTW324",     cost:14000,qty:2,  slug:"earphones" },
  { name:"WUW-Y158 Power Bank 10000mAh 22.5W", nameAr:"باور بانك WUW-Y158 10000mAh 22.5W", sku:"WUW-Y158", cost:16000,qty:2,slug:"power-banks" },
];

const techCategories = [
  { slug:"cables",          name:"Cables",           nameAr:"كيبلات" },
  { slug:"chargers",        name:"Chargers",         nameAr:"شواحن" },
  { slug:"earphones",       name:"Earphones",        nameAr:"سماعات" },
  { slug:"smart-watches",   name:"Smart Watches",    nameAr:"ساعات ذكية" },
  { slug:"phone-protection",name:"Phone Protection", nameAr:"حماية الهاتف" },
  { slug:"stands",          name:"Stands & Holders", nameAr:"ستاندات وهولدرات" },
  { slug:"cameras",         name:"Cameras",          nameAr:"كاميرات" },
  { slug:"speakers",        name:"Speakers",         nameAr:"سبيكرات" },
  { slug:"ring-lights",     name:"Ring Lights",      nameAr:"رينج لايت" },
  { slug:"power-banks",     name:"Power Banks",      nameAr:"باور بانك" },
  { slug:"ups-batteries",   name:"UPS & Batteries",  nameAr:"يو بي اس وبطاريات" },
  { slug:"mouse-tech",      name:"Mouse & Tech",     nameAr:"ماوس وملحقات" },
];

async function main() {
  console.log("🚀 إعادة بناء بيانات المنتجات التقنية من الفواتير...\n");

  const catMap: Record<string, number> = {};
  for (const cat of techCategories) {
    const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, cat.slug));
    if (existing) {
      catMap[cat.slug] = existing.id;
    } else {
      const [created] = await db.insert(categories).values({
        slug: cat.slug, name: cat.name, nameAr: cat.nameAr, isActive: true,
      }).returning({ id: categories.id });
      catMap[cat.slug] = created.id;
    }
  }

  let inserted = 0, skipped = 0;
  const byCategory: Record<string, { count: number; qty: number }> = {};

  for (const p of items) {
    const catId = catMap[p.slug];
    if (!catId) { skipped++; continue; }

    try {
      await db.insert(products).values({
        name: p.name,
        nameAr: p.nameAr,
        price: String(p.cost),
        costPrice: String(p.cost),
        stock: p.qty,
        initialStock: p.qty,
        sku: p.sku,
        categoryId: catId,
        isActive: true,
        isFeatured: true,
        showOnJadaf: true,
        images: [],
      }).onConflictDoNothing();
      inserted++;
      if (!byCategory[p.slug]) byCategory[p.slug] = { count: 0, qty: 0 };
      byCategory[p.slug].count++;
      byCategory[p.slug].qty += p.qty;
    } catch (e: any) {
      console.error(`❌ ${p.sku}: ${e.message}`);
      skipped++;
    }
  }

  const totalQty = items.reduce((s, p) => s + p.qty, 0);
  console.log(`\n✅ تم إدراج ${inserted} منتج (تخطي ${skipped})`);
  console.log(`📊 إجمالي القطع: ${totalQty}\n`);
  console.log("📂 التوزيع حسب الفئة:");
  for (const [slug, data] of Object.entries(byCategory)) {
    console.log(`   ${slug.padEnd(20)} → ${String(data.count).padStart(3)} منتج | ${String(data.qty).padStart(4)} قطعة`);
  }

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
