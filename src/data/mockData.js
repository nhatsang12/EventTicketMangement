// mockData.js

export const mockCategories = [
  { id: 1, name: 'Âm nhạc', slug: 'music', icon: '🎵', color: 'bg-purple-100 text-purple-600' },
  { id: 2, name: 'Thể thao', slug: 'sports', icon: '⚽', color: 'bg-green-100 text-green-600' },
  { id: 3, name: 'Hội thảo', slug: 'conference', icon: '🎤', color: 'bg-blue-100 text-blue-600' },
  { id: 4, name: 'Nghệ thuật', slug: 'arts', icon: '🎨', color: 'bg-pink-100 text-pink-600' },
  { id: 5, name: 'Festival', slug: 'festival', icon: '🎉', color: 'bg-yellow-100 text-yellow-600' },
  { id: 6, name: 'Du lịch', slug: 'travel', icon: '✈️', color: 'bg-teal-100 text-teal-600' },
  { id: 7, name: 'Ẩm thực', slug: 'food', icon: '🍴', color: 'bg-orange-100 text-orange-600' },
  { id: 8, name: 'Hài kịch / Stand-up', slug: 'comedy', icon: '😂', color: 'bg-amber-100 text-amber-600' },
];

export const mockTicketTypes = {
  '1':  [{ _id: 'ticket-1-1', name: 'VIP', price: 500000, quantity: 50, isEnabled: true }, { _id: 'ticket-1-2', name: 'Standard', price: 250000, quantity: 100, isEnabled: true }],
  '2':  [{ _id: 'ticket-2-1', name: 'VIP', price: 300000, quantity: 100, isEnabled: true }, { _id: 'ticket-2-2', name: 'Standard', price: 100000, quantity: 400, isEnabled: true }],
  '3':  [{ _id: 'ticket-3-1', name: 'Early Bird', price: 500000, quantity: 50, isEnabled: true }, { _id: 'ticket-3-2', name: 'Regular', price: 800000, quantity: 150, isEnabled: true }],
  '4':  [{ _id: 'ticket-4-1', name: 'General Admission', price: 50000, quantity: 300, isEnabled: true }],
  '5':  [{ _id: 'ticket-5-1', name: 'Entry + 5 Tokens', price: 200000, quantity: 500, isEnabled: true }, { _id: 'ticket-5-2', name: 'Entry + 10 Tokens', price: 350000, quantity: 500, isEnabled: true }],
  '6':  [{ _id: 'ticket-6-1', name: 'VIP Front Row', price: 1200000, quantity: 30, isEnabled: true }, { _id: 'ticket-6-2', name: 'Standard', price: 500000, quantity: 50, isEnabled: true }],
  '7':  [{ _id: 'ticket-7-1', name: '5KM', price: 300000, quantity: 500, isEnabled: true }, { _id: 'ticket-7-2', name: '10KM', price: 400000, quantity: 500, isEnabled: true }, { _id: 'ticket-7-3', name: '21KM', price: 500000, quantity: 500, isEnabled: true }, { _id: 'ticket-7-4', name: '42KM', price: 600000, quantity: 500, isEnabled: true }],
  '8':  [{ _id: 'ticket-8-1', name: 'Workshop Pass', price: 350000, quantity: 50, isEnabled: true }],
  '9':  [{ _id: 'ticket-9-1', name: 'VIP Golden', price: 2000000, quantity: 100, isEnabled: true }, { _id: 'ticket-9-2', name: 'VIP Silver', price: 1200000, quantity: 200, isEnabled: true }, { _id: 'ticket-9-3', name: 'Standard', price: 800000, quantity: 200, isEnabled: true }],
  '10': [{ _id: 'ticket-10-1', name: 'VIP', price: 600000, quantity: 80, isEnabled: true }, { _id: 'ticket-10-2', name: 'Standard', price: 350000, quantity: 120, isEnabled: true }],
  '11': [{ _id: 'ticket-11-1', name: 'VIP', price: 800000, quantity: 100, isEnabled: true }, { _id: 'ticket-11-2', name: 'Standard', price: 400000, quantity: 200, isEnabled: true }],
  '12': [{ _id: 'ticket-12-1', name: 'Full Access', price: 800000, quantity: 150, isEnabled: true }],
  '13': [{ _id: 'ticket-13-1', name: 'General Entry', price: 100000, quantity: 400, isEnabled: true }],
  '14': [{ _id: 'ticket-14-1', name: 'Free Entry', price: 0, quantity: 5000, isEnabled: true }],
  '15': [{ _id: 'ticket-15-1', name: 'Standard Package', price: 4500000, quantity: 15, isEnabled: true }, { _id: 'ticket-15-2', name: 'Premium Package', price: 6500000, quantity: 15, isEnabled: true }],
  '16': [{ _id: 'ticket-16-1', name: 'Free Entry', price: 0, quantity: 9999, isEnabled: true }],
  '18': [{ _id: 'ticket-18-1', name: 'Spectator Pass', price: 800000, quantity: 50, isEnabled: true }],
  '19': [{ _id: 'ticket-19-1', name: 'Conference Pass', price: 450000, quantity: 120, isEnabled: true }],
  '20': [{ _id: 'ticket-20-1', name: 'General Entry', price: 150000, quantity: 400, isEnabled: true }],
  '21': [{ _id: 'ticket-21-1', name: 'GA', price: 500000, quantity: 400, isEnabled: true }, { _id: 'ticket-21-2', name: 'VIP', price: 1200000, quantity: 400, isEnabled: true }],
  '22': [{ _id: 'ticket-22-1', name: 'Standard', price: 3500000, quantity: 20, isEnabled: true }, { _id: 'ticket-22-2', name: 'Deluxe', price: 5000000, quantity: 20, isEnabled: true }],
  '23': [{ _id: 'ticket-23-1', name: 'Class Pass', price: 800000, quantity: 20, isEnabled: true }],
  '24': [{ _id: 'ticket-24-1', name: 'Standard', price: 200000, quantity: 150, isEnabled: true }],
  '28': [{ _id: 'ticket-28-1', name: 'Free Entry', price: 0, quantity: 9999, isEnabled: true }],
  '29': [{ _id: 'ticket-29-1', name: 'Standard', price: 2800000, quantity: 30, isEnabled: true }, { _id: 'ticket-29-2', name: 'Premium', price: 3800000, quantity: 30, isEnabled: true }],
  '30': [{ _id: 'ticket-30-1', name: 'Class Pass', price: 1200000, quantity: 15, isEnabled: true }],
};

export const mockEvents = [
  // ── Âm nhạc ──────────────────────────────────────────────────────
  {
    _id: '1',
    name: 'Đêm nhạc Indie - The Playah',
    description: 'Đêm nhạc indie với những giai điệu bất hủ cùng The Playah và các nghệ sĩ khách mời đặc biệt. Không gian ấm cúng, âm nhạc sâu lắng và đầy cảm xúc.',
    date: '2025-03-15T19:00:00', time: '19:00',
    location: 'The Opera TPHCM, Quận 1, TP.HCM',
    category: 'Âm nhạc',
    // Concert crowd, colorful lights — stable Unsplash photo
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80',
    minPrice: 250000, availableTickets: 150, status: 'active',
  },
  {
    _id: '6',
    name: 'Đen Vâu Live Concert',
    description: 'Live concert hoành tráng của Đen Vâu với những ca khúc hit bất hủ.',
    date: '2025-04-10T20:00:00', time: '20:00',
    location: 'Nhà thi đấu Phú Thọ, TP.HCM',
    category: 'Âm nhạc',
    // Live concert stage with dramatic lighting
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
    minPrice: 500000, availableTickets: 80, status: 'active',
  },
  {
    _id: '9',
    name: 'Sơn Tùng M-TP World Tour 2025',
    description: 'Tour diễn lớn nhất của Sơn Tùng M-TP với sân khấu hiện đại, âm thanh ánh sáng đỉnh cao.',
    date: '2025-05-20T19:30:00', time: '19:30',
    location: 'Sân vận động Mỹ Đình, Hà Nội',
    category: 'Âm nhạc',
    // Large outdoor concert / stadium show
    imageUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80',
    minPrice: 800000, availableTickets: 500, status: 'active',
  },
  {
    _id: '10',
    name: 'Bích Phương Acoustic Night',
    description: 'Buổi biểu diễn acoustic ấm áp của Bích Phương với những ca khúc nhẹ nhàng, sâu lắng.',
    date: '2025-06-05T20:00:00', time: '20:00',
    location: 'Nhà hát Hòa Bình, TP.HCM',
    category: 'Âm nhạc',
    // Intimate acoustic performance, soft light
    imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop&q=80',
    minPrice: 350000, availableTickets: 200, status: 'active',
  },

  // ── Thể thao ──────────────────────────────────────────────────────
  {
    _id: '2',
    name: 'V.League 2024: SLNA vs Hà Nội FC',
    description: 'Trận cầu đỉnh cao giữa hai đội bóng hàng đầu V.League.',
    date: '2025-03-20T18:30:00', time: '18:30',
    location: 'Sân vận động Vinh, Nghệ An',
    category: 'Thể thao',
    // Football match, stadium crowd
    imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80',
    minPrice: 100000, availableTickets: 500, status: 'active',
  },
  {
    _id: '7',
    name: 'Marathon TP.HCM 2025',
    description: 'Giải marathon quốc tế với các cự ly 5km, 10km, 21km và 42km.',
    date: '2025-04-15T05:00:00', time: '05:00',
    location: 'Khởi đầu từ Nhà Hát Thành Phố, TP.HCM',
    category: 'Thể thao',
    // Runners in a road marathon race
    imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&auto=format&fit=crop&q=80',
    minPrice: 300000, availableTickets: 2000, status: 'active',
  },
  {
    _id: '11',
    name: 'AFF Cup 2025: Việt Nam vs Thái Lan',
    description: 'Trận đấu giao hữu quốc tế giữa hai đội tuyển Đông Nam Á.',
    date: '2025-07-10T19:30:00', time: '19:30',
    location: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    category: 'Thể thao',
    // Soccer/football players on pitch
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
    minPrice: 400000, availableTickets: 300, status: 'active',
  },
  {
    _id: '18',
    name: 'Giải Golf Quốc tế',
    description: 'Giải golf chuyên nghiệp quốc tế với sự tham gia của các golfer hàng đầu thế giới.',
    date: '2025-06-10T07:00:00', time: '07:00',
    location: 'Đà Nẵng Golf Club, Đà Nẵng',
    category: 'Thể thao',
    // Golf course green, player swinging
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&auto=format&fit=crop&q=80',
    minPrice: 800000, availableTickets: 50, status: 'active',
  },

  // ── Hội thảo ──────────────────────────────────────────────────────
  {
    _id: '3',
    name: 'Tech Summit Vietnam 2025',
    description: 'Hội thảo công nghệ lớn nhất năm với các diễn giả hàng đầu trong ngành.',
    date: '2025-03-25T09:00:00', time: '09:00',
    location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    category: 'Hội thảo',
    // Conference hall, audience listening
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    minPrice: 500000, availableTickets: 200, status: 'active',
  },
  {
    _id: '8',
    name: 'Workshop: Digital Marketing 2025',
    description: 'Workshop chuyên sâu về Digital Marketing với các chuyên gia hàng đầu.',
    date: '2025-04-18T14:00:00', time: '14:00',
    location: 'Coworking Space The Hive, Quận 2, TP.HCM',
    category: 'Hội thảo',
    // Team working around laptop, workshop setting
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    minPrice: 350000, availableTickets: 50, status: 'active',
  },
  {
    _id: '12',
    name: 'AI & Future Tech Conference',
    description: 'Hội nghị về trí tuệ nhân tạo và công nghệ tương lai.',
    date: '2025-08-05T08:30:00', time: '08:30',
    location: 'Gem Center, Quận 1, TP.HCM',
    category: 'Hội thảo',
    // Futuristic tech / AI visualization
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    minPrice: 800000, availableTickets: 150, status: 'active',
  },
  {
    _id: '19',
    name: 'Hội thảo Blockchain',
    description: 'Hội thảo về công nghệ blockchain và crypto.',
    date: '2025-08-01T09:00:00', time: '09:00',
    location: 'Vincom Center, Hà Nội',
    category: 'Hội thảo',
    // Tech speaker on stage with screen
    imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop&q=80',
    minPrice: 450000, availableTickets: 120, status: 'active',
  },

  // ── Nghệ thuật ────────────────────────────────────────────────────
  {
    _id: '4',
    name: 'Triển lãm Tranh Đương Đại',
    description: 'Triển lãm tranh đương đại của các họa sĩ nổi tiếng Việt Nam.',
    date: '2025-04-01T10:00:00', time: '10:00',
    location: 'Bảo tàng Mỹ thuật TP.HCM',
    category: 'Nghệ thuật',
    // Art gallery with paintings on white walls
    imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&auto=format&fit=crop&q=80',
    minPrice: 50000, availableTickets: 300, status: 'active',
  },
  {
    _id: '13',
    name: 'Triển lãm Ảnh Street Photography',
    description: 'Ảnh đường phố Việt Nam qua ống kính các nhiếp ảnh gia trẻ.',
    date: '2025-05-10T09:00:00', time: '09:00',
    location: 'Nhà văn hóa Thanh niên, TP.HCM',
    category: 'Nghệ thuật',
    // Camera / photography exhibit
    imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&auto=format&fit=crop&q=80',
    minPrice: 100000, availableTickets: 400, status: 'active',
  },
  {
    _id: '20',
    name: 'Triển lãm Thời trang',
    description: 'Triển lãm thời trang cao cấp với các bộ sưu tập mới nhất.',
    date: '2025-05-25T10:00:00', time: '10:00',
    location: 'Saigon Exhibition and Convention Center, TP.HCM',
    category: 'Nghệ thuật',
    // Fashion show runway
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
    minPrice: 150000, availableTickets: 400, status: 'active',
  },

  // ── Festival ──────────────────────────────────────────────────────
  {
    _id: '5',
    name: 'Lễ hội Bia Craft Beer Fest',
    description: 'Lễ hội bia thủ công với hơn 50 loại bia từ khắp nơi trên thế giới.',
    date: '2025-04-05T16:00:00', time: '16:00',
    location: 'Công viên Tao Đàn, Quận 1, TP.HCM',
    category: 'Festival',
    // Beer festival, glasses clinking outdoor
    imageUrl: 'https://images.unsplash.com/photo-1530126483408-aa533e55bdb2?w=800&auto=format&fit=crop&q=80',
    minPrice: 200000, availableTickets: 1000, status: 'active',
  },
  {
    _id: '14',
    name: 'Festival Pháo Hoa Đà Nẵng 2025',
    description: 'Lễ hội pháo hoa quốc tế lớn nhất Việt Nam.',
    date: '2025-06-30T20:00:00', time: '20:00',
    location: 'Cầu Rồng, Đà Nẵng',
    category: 'Festival',
    // Fireworks over water at night
    imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&auto=format&fit=crop&q=80',
    minPrice: 0, availableTickets: 5000, status: 'active',
  },
  {
    _id: '21',
    name: 'Lễ hội Âm nhạc Điện tử',
    description: 'Lễ hội EDM lớn nhất năm với sự tham gia của các DJ hàng đầu thế giới.',
    date: '2025-09-05T18:00:00', time: '18:00',
    location: 'Công viên Biển Đông, Đà Nẵng',
    category: 'Festival',
    // EDM festival, crowd with lights and fog
    imageUrl: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=800&auto=format&fit=crop&q=80',
    minPrice: 500000, availableTickets: 800, status: 'active',
  },
  {
    _id: '28',
    name: 'Lễ hội Hoa Đà Lạt 2025',
    description: 'Lễ hội hoa lớn nhất Đà Lạt với hàng triệu bông hoa rực rỡ.',
    date: '2025-12-20T09:00:00', time: '09:00',
    location: 'Vườn hoa thành phố Đà Lạt',
    category: 'Festival',
    // Colorful flower garden / festival
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc18?w=800&auto=format&fit=crop&q=80',
    minPrice: 0, availableTickets: 9999, status: 'active',
  },

  // ── Du lịch ───────────────────────────────────────────────────────
  {
    _id: '15',
    name: 'Tour Phú Quốc 3N2Đ',
    description: 'Tour du lịch nghỉ dưỡng cao cấp tại Phú Quốc. Khám phá đảo ngọc với các hoạt động lặn biển.',
    date: '2025-05-01T08:00:00', time: '08:00',
    location: 'Phú Quốc',
    category: 'Du lịch',
    // Tropical beach, turquoise water
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    minPrice: 4500000, availableTickets: 30, status: 'active',
  },
  {
    _id: '22',
    name: 'Tour Đà Lạt 4N3Đ',
    description: 'Tour nghỉ dưỡng Đà Lạt mùa hoa. Tham quan các địa điểm nổi tiếng.',
    date: '2025-04-25T07:00:00', time: '07:00',
    location: 'Đà Lạt',
    category: 'Du lịch',
    // Misty mountain landscape, Da Lat style
    imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop&q=80',
    minPrice: 3500000, availableTickets: 40, status: 'active',
  },
  {
    _id: '29',
    name: 'Tour Miền Tây 3N2Đ',
    description: 'Tour khám phá miền Tây sông nước. Trải nghiệm cuộc sống miệt vườn, chợ nổi.',
    date: '2025-05-10T07:00:00', time: '07:00',
    location: 'Cần Thơ',
    category: 'Du lịch',
    // River delta, boats on water
    imageUrl: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&auto=format&fit=crop&q=80',
    minPrice: 2800000, availableTickets: 60, status: 'active',
  },

  // ── Ẩm thực ───────────────────────────────────────────────────────
  {
    _id: '16',
    name: 'Lễ hội Ẩm thực đường phố Sài Gòn',
    description: 'Hơn 100 gian hàng ẩm thực đường phố nổi tiếng.',
    date: '2025-04-20T17:00:00', time: '17:00',
    location: 'Phố đi bộ Nguyễn Huệ, TP.HCM',
    category: 'Ẩm thực',
    // Street food market, colorful stalls at night
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    minPrice: 0, availableTickets: 9999, status: 'active',
  },
  {
    _id: '23',
    name: 'Lớp học nấu ăn Việt Nam',
    description: 'Học nấu các món Việt truyền thống từ đầu bếp chuyên nghiệp.',
    date: '2025-05-15T18:00:00', time: '18:00',
    location: 'Vietnam Cookery Center, TP.HCM',
    category: 'Ẩm thực',
    // Cooking class, chef plating dish
    imageUrl: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&auto=format&fit=crop&q=80',
    minPrice: 800000, availableTickets: 20, status: 'active',
  },
  {
    _id: '30',
    name: 'Lớp học Làm bánh Pháp',
    description: 'Học làm bánh Pháp truyền thống: croissant, macaron, éclair.',
    date: '2025-06-05T09:00:00', time: '09:00',
    location: 'Le Cordon Bleu Saigon, TP.HCM',
    category: 'Ẩm thực',
    // French pastry, macarons and croissants
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80',
    minPrice: 1200000, availableTickets: 15, status: 'active',
  },

  // ── Hài kịch / Stand-up ───────────────────────────────────────────
  {
    _id: '24',
    name: 'Stand-up Comedy Night',
    description: 'Buổi biểu diễn hài kịch stand-up với các diễn viên hài hàng đầu Việt Nam.',
    date: '2025-06-20T20:00:00', time: '20:00',
    location: 'Comedy Club Hanoi, Hà Nội',
    category: 'Hài kịch / Stand-up',
    // Comedian on stage with microphone, spotlight
    imageUrl: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800&auto=format&fit=crop&q=80',
    minPrice: 200000, availableTickets: 150, status: 'active',
  },
];

export const mockLocations = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ',
  'Hải Phòng', 'Nha Trang', 'Huế', 'Vũng Tàu', 'Đà Lạt', 'Phú Quốc',
];

export const sortOptions = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'date-asc', label: 'Ngày gần nhất' },
];