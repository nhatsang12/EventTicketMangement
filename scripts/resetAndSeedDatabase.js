const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const User = require('../src/models/User');
const Event = require('../src/models/Event');
const TicketType = require('../src/models/TicketType');
const Ticket = require('../src/models/Ticket');
const Order = require('../src/models/Order');
const Checkin = require('../src/models/Checkin');

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/event_ticket_management';
const UNSPLASH_ACCESS_KEY = process.env.YOUR_UNSPLASH_KEY || process.env.UNSPLASH_ACCESS_KEY || '';

const FORCE_FLAG = '--force';
const EXTRA_TICKET_NAMES = ['Fan Zone', 'Premium', 'Early Bird', 'Standing Zone', 'Sky Deck'];
const EVENT_SHOWS = [
  { title: 'Sơn Tùng M-TP: SKY WAVE 2026', artist: 'Sơn Tùng M-TP', city: 'TP.HCM', venue: 'Sân vận động Quân Khu 7', category: 'Âm nhạc' },
  { title: 'Hà Anh Tuấn: Sketch A Rose Live Concert', artist: 'Hà Anh Tuấn', city: 'Hà Nội', venue: 'Trung tâm Hội nghị Quốc gia', category: 'Âm nhạc' },
  { title: 'Mỹ Tâm: TRI ÂM Arena Live', artist: 'Mỹ Tâm', city: 'Đà Nẵng', venue: 'Cung Thể thao Tiên Sơn', category: 'Âm nhạc' },
  { title: 'Đen: Show Của Đen 2026', artist: 'Đen', city: 'Hà Nội', venue: 'Công viên Yên Sở', category: 'Âm nhạc' },
  { title: 'Noo Phước Thịnh: The One Night', artist: 'Noo Phước Thịnh', city: 'TP.HCM', venue: 'Nhà thi đấu Phú Thọ', category: 'Âm nhạc' },
  { title: 'Tóc Tiên: The New Heat Live', artist: 'Tóc Tiên', city: 'TP.HCM', venue: 'SECC Hall B', category: 'Âm nhạc' },
  { title: 'Hoàng Thùy Linh: Vietnamese Concert', artist: 'Hoàng Thùy Linh', city: 'Hà Nội', venue: 'Cung Văn hóa Hữu Nghị Việt Xô', category: 'Âm nhạc' },
  { title: 'HIEUTHUHAI: Big Team Big Dream Concert', artist: 'HIEUTHUHAI', city: 'TP.HCM', venue: 'Global City Arena', category: 'Âm nhạc' },
  { title: 'MONO: 22 Tour Live', artist: 'MONO', city: 'Hải Phòng', venue: 'Trung tâm Triển lãm Quốc tế Hải Phòng', category: 'Âm nhạc' },
  { title: 'SOOBIN: All-Rounder Live in Vietnam', artist: 'SOOBIN', city: 'Cần Thơ', venue: 'Nhà thi đấu đa năng Cần Thơ', category: 'Âm nhạc' },
  { title: 'Hoàng Dũng: 25 Acoustic Hall', artist: 'Hoàng Dũng', city: 'Đà Lạt', venue: 'Nhà hát Hòa Bình Đà Lạt', category: 'Âm nhạc' },
  { title: 'Vũ.: Dear, Ocean Live Session', artist: 'Vũ.', city: 'Nha Trang', venue: 'Ana Marina Music Deck', category: 'Âm nhạc' },
  { title: 'Chillies: Dreamland Rock Night', artist: 'Chillies', city: 'Đà Nẵng', venue: 'Sân khấu ngoài trời Helio', category: 'Âm nhạc' },
  { title: 'Wren Evans: HyperPop Night', artist: 'Wren Evans', city: 'TP.HCM', venue: 'The Global City Hall', category: 'Âm nhạc' },
  { title: 'Phương Ly: Blooming Show', artist: 'Phương Ly', city: 'Hà Nội', venue: 'Ho Guom Opera', category: 'Âm nhạc' },
  { title: 'BLACKPINK: BORN PINK Encore', artist: 'BLACKPINK', city: 'Hà Nội', venue: 'Sân vận động Mỹ Đình', category: 'K-Pop' },
  { title: 'Taylor Swift: The Eras Tour (Singapore Night)', artist: 'Taylor Swift', city: 'Singapore', venue: 'National Stadium Singapore', category: 'Pop' },
  { title: 'Coldplay: Music Of The Spheres', artist: 'Coldplay', city: 'Bangkok', venue: 'Rajamangala Stadium', category: 'Rock' },
  { title: 'Bruno Mars: Asia Live in Jakarta', artist: 'Bruno Mars', city: 'Jakarta', venue: 'Gelora Bung Karno', category: 'Pop' },
  { title: 'Charlie Puth: Asia Tour Special', artist: 'Charlie Puth', city: 'TP.HCM', venue: 'Saigon Exhibition Hall', category: 'Pop' },
  { title: 'IU: H.E.R World Tour Special Fan Night', artist: 'IU', city: 'Seoul', venue: 'KSPO Dome', category: 'K-Pop' },
  { title: 'Jay Chou: Carnival World Tour', artist: 'Jay Chou', city: 'Hong Kong', venue: 'AsiaWorld-Arena', category: 'Pop' },
  { title: 'G-Dragon: Ubermensch Live', artist: 'G-Dragon', city: 'Seoul', venue: 'Jamsil Arena', category: 'K-Pop' },
  { title: 'Maroon 5: Asia Tour 2026', artist: 'Maroon 5', city: 'Kuala Lumpur', venue: 'Axiata Arena', category: 'Pop-Rock' },
  { title: 'Dua Lipa: Radical Optimism Tour', artist: 'Dua Lipa', city: 'Bangkok', venue: 'Impact Arena', category: 'Pop' },
  { title: 'Imagine Dragons: Mercury World Tour', artist: 'Imagine Dragons', city: 'Manila', venue: 'Mall of Asia Arena', category: 'Rock' },
  { title: 'Westlife: The Wild Dreams Tour', artist: 'Westlife', city: 'TP.HCM', venue: 'Nhà thi đấu Phú Thọ', category: 'Pop' },
  { title: 'Anh Trai Say Hi: Mega Concert', artist: 'Anh Trai Say Hi All Stars', city: 'Hà Nội', venue: 'Công viên Thống Nhất', category: 'Show giải trí' },
  { title: 'Anh Trai Vượt Ngàn Chông Gai: Gala Live', artist: 'Anh Trai Vượt Ngàn Chông Gai', city: 'TP.HCM', venue: 'Phú Thọ Indoor Arena', category: 'Show giải trí' },
  { title: 'Rap Việt: All-Star Concert 2026', artist: 'Rap Việt All Stars', city: 'Đà Nẵng', venue: 'Sân vận động Hòa Xuân', category: 'Hip-hop' },
];
let qrCounter = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmountByHundredThousand(min, max) {
  const minStep = Math.ceil(min / 100000);
  const maxStep = Math.floor(max / 100000);
  return randomInt(minStep, maxStep) * 100000;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generateEventDate(index) {
  const start = new Date();
  start.setDate(start.getDate() + 5 + index * 3);
  start.setHours(19, randomInt(0, 30), 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + randomInt(2, 4), randomInt(0, 30));
  return { start, end };
}

function buildEventDescription(show, startDate, endDate) {
  const startText = startDate.toLocaleString('vi-VN');
  const endText = endDate.toLocaleString('vi-VN');
  return [
    `${show.title} là đêm diễn quy mô lớn quy tụ dàn sân khấu, âm thanh và ánh sáng chuẩn quốc tế.`,
    `Nghệ sĩ chính: ${show.artist}. Địa điểm: ${show.venue}, ${show.city}.`,
    `Khung giờ chương trình: ${startText} - ${endText}.`,
    'Nội dung chương trình gồm setlist hit, phần trình diễn concept đặc biệt và các sân khấu tương tác cùng fan.',
    'Khán giả được khuyến nghị đến sớm 60-90 phút để làm thủ tục check-in và ổn định vị trí.',
  ].join('\n');
}

function buildTicketDescription(show, tierName) {
  const base = `Áp dụng cho show "${show.title}" tại ${show.venue}, ${show.city}.`;
  if (tierName === 'VIP') {
    return [
      base,
      '- Lối check-in ưu tiên và khu vực gần sân khấu.',
      '- Tặng bộ merchandise giới hạn và dây đeo VIP.',
      '- Quầy hỗ trợ riêng trong suốt thời gian sự kiện.',
    ].join('\n');
  }
  if (tierName === 'Standard') {
    return [
      base,
      '- Khu vực tiêu chuẩn, tầm nhìn tốt đến sân khấu chính.',
      '- Tham gia đầy đủ toàn bộ chương trình biểu diễn.',
      '- Hỗ trợ check-in nhanh theo cổng quy định.',
    ].join('\n');
  }
  return [
    base,
    '- Khu vực mở rộng với số lượng giới hạn theo từng đợt bán.',
    '- Giá ưu đãi theo giai đoạn mở bán sớm.',
    '- Phù hợp cho nhóm bạn muốn tối ưu ngân sách nhưng vẫn trải nghiệm trọn vẹn.',
  ].join('\n');
}

function ticketTemplates(show) {
  const vipPrice = randomAmountByHundredThousand(700000, 2500000);
  const standardPrice = randomAmountByHundredThousand(120000, 700000);
  const extraName = pick(EXTRA_TICKET_NAMES);
  const extraPrice = randomAmountByHundredThousand(90000, 1200000);

  return [
    { name: 'VIP', price: vipPrice, quantity: randomInt(40, 180), description: buildTicketDescription(show, 'VIP') },
    { name: 'Standard', price: standardPrice, quantity: randomInt(120, 800), description: buildTicketDescription(show, 'Standard') },
    { name: extraName, price: extraPrice, quantity: randomInt(50, 400), description: buildTicketDescription(show, extraName) },
  ];
}

async function clearDatabase() {
  await mongoose.connection.db.dropDatabase();
}

async function seedUsers() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const [admin] = await User.create([
    {
      name: 'Admin Test',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'admin',
    },
  ]);

  const users = await User.create([
    { name: 'User Test 01', email: 'user1@gmail.com', password: userPassword, role: 'user' },
    { name: 'User Test 02', email: 'user2@gmail.com', password: userPassword, role: 'user' },
    { name: 'User Test 03', email: 'user3@gmail.com', password: userPassword, role: 'user' },
  ]);

  return { admin, users };
}

async function seedEventsAndTicketTypes(adminId) {
  const events = [];
  const ticketTypeDocs = [];
  const imagePool = await fetchUnsplashImagePool(40);

  for (let i = 0; i < 30; i += 1) {
    const { start, end } = generateEventDate(i);
    const show = EVENT_SHOWS[i % EVENT_SHOWS.length];
    const fallbackUnsplash = `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80&sig=${i + 1}`;
    const eventImage = imagePool[i] || fallbackUnsplash;
    const event = await Event.create({
      title: show.title,
      description: buildEventDescription(show, start, end),
      category: show.category,
      location: `${show.venue}, ${show.city}`,
      startDate: start,
      endDate: end,
      image: eventImage,
      createdBy: adminId,
      ticketTypes: [],
    });

    const templates = ticketTemplates(show);
    const createdTicketTypes = await TicketType.create(
      templates.map((tpl) => ({
        event: event._id,
        name: tpl.name,
        description: tpl.description,
        price: tpl.price,
        quantity: tpl.quantity,
        remaining: tpl.quantity,
        isActive: true,
      }))
    );

    event.ticketTypes = createdTicketTypes.map((tt) => tt._id);
    await event.save();

    events.push(event);
    ticketTypeDocs.push(...createdTicketTypes);
  }

  return { events, ticketTypeDocs };
}

function groupTicketTypesByEvent(ticketTypes) {
  return ticketTypes.reduce((acc, tt) => {
    const eventId = String(tt.event);
    if (!acc[eventId]) acc[eventId] = [];
    acc[eventId].push(tt);
    return acc;
  }, {});
}

function buildUniqueEventList(events, count) {
  const pool = [...events];
  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    const index = randomInt(0, pool.length - 1);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function createQrCode(prefix) {
  qrCounter += 1;
  return `QR-${prefix}-${Date.now()}-${qrCounter}-${randomInt(1000, 9999)}`;
}

async function fetchUnsplashImagePool(total) {
  if (!UNSPLASH_ACCESS_KEY || total <= 0) return [];

  const images = [];
  let remaining = total;

  while (remaining > 0) {
    const batchSize = Math.min(remaining, 30);
    const query = pick(['music event', 'concert stage', 'festival crowd', 'conference hall', 'live performance']);

    try {
      const response = await axios.get('https://api.unsplash.com/photos/random', {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        params: {
          count: batchSize,
          query,
          orientation: 'landscape',
          content_filter: 'high',
        },
        timeout: 15000,
      });

      const payload = Array.isArray(response.data) ? response.data : [response.data];
      const batchImages = payload
        .map((item) => item?.urls?.regular || item?.urls?.full || item?.urls?.raw)
        .filter(Boolean);

      images.push(...batchImages);
      remaining = total - images.length;
      if (batchImages.length === 0) break;
    } catch (error) {
      console.warn(`Khong lay duoc anh Unsplash: ${error.message}`);
      break;
    }
  }

  return images;
}

async function seedOrdersAndTickets(users, events, ticketTypeDocs) {
  const ticketTypesByEvent = groupTicketTypesByEvent(ticketTypeDocs);
  const createdOrders = [];
  const createdTickets = [];

  for (const user of users) {
    const userEvents = buildUniqueEventList(events, randomInt(4, 6));

    for (const event of userEvents) {
      const eventId = String(event._id);
      const types = ticketTypesByEvent[eventId] || [];
      if (types.length === 0) continue;

      const order = await Order.create({
        user: user._id,
        event: event._id,
        totalAmount: 0,
        tickets: [],
        status: 'paid',
      });

      let totalAmount = 0;
      const orderTicketIds = [];
      const usedTypeIndexes = new Set();
      const lineCount = randomInt(1, Math.min(2, types.length));

      for (let line = 0; line < lineCount; line += 1) {
        let typeIndex = randomInt(0, types.length - 1);
        let guard = 0;
        while (usedTypeIndexes.has(typeIndex) && guard < 10) {
          typeIndex = randomInt(0, types.length - 1);
          guard += 1;
        }
        usedTypeIndexes.add(typeIndex);

        const ticketType = types[typeIndex];
        const quantity = randomInt(1, 3);
        const creatableQty = Math.max(0, Math.min(quantity, ticketType.remaining));
        if (creatableQty === 0) continue;

        const ticketPayloads = [];
        for (let i = 0; i < creatableQty; i += 1) {
          ticketPayloads.push({
            order: order._id,
            user: user._id,
            event: event._id,
            ticketType: ticketType._id,
            price: ticketType.price,
            qrCode: createQrCode(`${order._id}-${ticketType._id}`),
            isCheckedIn: false,
          });
        }

        const tickets = await Ticket.create(ticketPayloads);
        createdTickets.push(...tickets);
        orderTicketIds.push(...tickets.map((t) => t._id));
        totalAmount += tickets.length * Number(ticketType.price || 0);

        ticketType.remaining = Math.max(0, Number(ticketType.remaining || 0) - tickets.length);
        await ticketType.save();
      }

      if (orderTicketIds.length === 0) {
        await Order.deleteOne({ _id: order._id });
        continue;
      }

      order.tickets = orderTicketIds;
      order.totalAmount = totalAmount;
      await order.save();

      createdOrders.push(order);
    }
  }

  const usedSample = createdTickets.slice(0, Math.min(8, createdTickets.length));
  for (const ticket of usedSample) {
    ticket.isCheckedIn = true;
    ticket.checkedInAt = new Date(Date.now() - randomInt(1, 3) * 3600 * 1000);
    await ticket.save();
  }

  return { createdOrders, createdTickets };
}

async function run() {
  const isForced = process.argv.includes(FORCE_FLAG);
  if (!isForced) {
    console.log('Tu choi thao tac vi script reset DB.');
    console.log(`Dung lai voi: node scripts/resetAndSeedDatabase.js ${FORCE_FLAG}`);
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Da ket noi MongoDB: ${MONGO_URI}`);

    await clearDatabase();
    console.log('Da xoa sach toan bo du lieu DB.');

    const { admin, users } = await seedUsers();
    const { events, ticketTypeDocs } = await seedEventsAndTicketTypes(admin._id);
    const { createdOrders, createdTickets } = await seedOrdersAndTickets(users, events, ticketTypeDocs);

    const counts = {
      users: await User.countDocuments(),
      events: await Event.countDocuments(),
      ticketTypes: await TicketType.countDocuments(),
      tickets: await Ticket.countDocuments(),
      orders: await Order.countDocuments(),
      checkins: await Checkin.countDocuments(),
    };

    console.log('=== SEED THANH CONG ===');
    console.log(`Admin: ${admin.email} / Admin@123`);
    console.log(`Users: ${users.map((u) => u.email).join(', ')} / User@123`);
    console.log(`Events tao: ${events.length}`);
    console.log(`Ticket types tao: ${ticketTypeDocs.length}`);
    console.log(`Orders tao: ${createdOrders.length}`);
    console.log(`Tickets tao: ${createdTickets.length}`);
    console.log('So luong collection sau seed:', counts);
  } catch (error) {
    console.error('Seed that bai:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();
