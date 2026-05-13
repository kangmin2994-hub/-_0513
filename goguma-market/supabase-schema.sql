-- 고구마마켓 DB 스키마

-- 카테고리
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL
);

INSERT INTO categories (name, icon) VALUES
  ('디지털/가전', '📱'),
  ('의류/패션', '👕'),
  ('가구/인테리어', '🛋️'),
  ('도서', '📚'),
  ('스포츠/레저', '⚽'),
  ('식물', '🌿'),
  ('유아동', '🧸'),
  ('생활/가공식품', '🍳'),
  ('뷰티/미용', '💄'),
  ('기타', '📦')
ON CONFLICT DO NOTHING;

-- 프로필 (auth.users 확장)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL DEFAULT '고구마회원',
  avatar_url TEXT,
  location VARCHAR(100) DEFAULT '위치 미설정',
  manner_temperature DECIMAL(3,1) DEFAULT 36.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로필 자동생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', '고구마회원'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 상품
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  price INTEGER NOT NULL CHECK (price >= 0),
  description TEXT,
  condition VARCHAR(20) DEFAULT '사용감있음' CHECK (condition IN ('미사용', '거의새것', '사용감있음')),
  trade_type VARCHAR(20) DEFAULT '직거래' CHECK (trade_type IN ('직거래', '택배', '모두가능')),
  allow_price_offer BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT '판매중' CHECK (status IN ('판매중', '예약중', '거래완료')),
  location VARCHAR(100) DEFAULT '위치 미설정',
  views INTEGER DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 찜하기
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 채팅방
CREATE TABLE IF NOT EXISTS chat_rooms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, buyer_id)
);

-- 메시지
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 후기
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating IN (1, 2, 3)),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- profiles 정책
CREATE POLICY "프로필 공개 조회" ON profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정" ON profiles FOR UPDATE USING (auth.uid() = id);

-- products 정책
CREATE POLICY "상품 공개 조회" ON products FOR SELECT USING (true);
CREATE POLICY "인증 사용자 상품 등록" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "판매자 상품 수정" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "판매자 상품 삭제" ON products FOR DELETE USING (auth.uid() = seller_id);

-- likes 정책
CREATE POLICY "찜 공개 조회" ON likes FOR SELECT USING (true);
CREATE POLICY "본인 찜 추가" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 찜 삭제" ON likes FOR DELETE USING (auth.uid() = user_id);

-- chat_rooms 정책
CREATE POLICY "채팅방 참여자 조회" ON chat_rooms FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "채팅방 생성" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- messages 정책
CREATE POLICY "메시지 참여자 조회" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "메시지 전송" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- reviews 정책
CREATE POLICY "후기 공개 조회" ON reviews FOR SELECT USING (true);
CREATE POLICY "후기 작성" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 샘플 데이터 (테스트용)
-- 실제 auth 사용자 없이는 삽입 불가, 앱에서 가입 후 사용
