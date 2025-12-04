-- MDShare 数据库表结构
-- 请在 Supabase Dashboard SQL Editor 中执行此迁移

-- 用户资料表
CREATE TABLE mdshare_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  custom_domain TEXT UNIQUE,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 524288000, -- 500MB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文章表
CREATE TABLE mdshare_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mdshare_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  short_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  is_pinned BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  access_type TEXT DEFAULT 'public' CHECK (access_type IN ('public', 'password', 'email', 'private')),
  access_password TEXT,
  allowed_emails TEXT[],
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 版本历史表
CREATE TABLE mdshare_post_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mdshare_posts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, version_number)
);

-- 文件记录表
CREATE TABLE mdshare_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mdshare_profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES mdshare_posts(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  cos_key TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表
CREATE TABLE mdshare_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mdshare_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES mdshare_profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 访问日志表
CREATE TABLE mdshare_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mdshare_posts(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 短链映射表
CREATE TABLE mdshare_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT UNIQUE NOT NULL,
  post_id UUID NOT NULL REFERENCES mdshare_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_mdshare_posts_user_id ON mdshare_posts(user_id);
CREATE INDEX idx_mdshare_posts_short_code ON mdshare_posts(short_code);
CREATE INDEX idx_mdshare_posts_status ON mdshare_posts(status);
CREATE INDEX idx_mdshare_files_user_id ON mdshare_files(user_id);
CREATE INDEX idx_mdshare_files_post_id ON mdshare_files(post_id);
CREATE INDEX idx_mdshare_comments_post_id ON mdshare_comments(post_id);
CREATE INDEX idx_mdshare_access_logs_post_id ON mdshare_access_logs(post_id);
CREATE INDEX idx_mdshare_short_links_short_code ON mdshare_short_links(short_code);

-- 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION mdshare_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 和 posts 表添加触发器
CREATE TRIGGER mdshare_profiles_updated_at
  BEFORE UPDATE ON mdshare_profiles
  FOR EACH ROW EXECUTE FUNCTION mdshare_update_updated_at();

CREATE TRIGGER mdshare_posts_updated_at
  BEFORE UPDATE ON mdshare_posts
  FOR EACH ROW EXECUTE FUNCTION mdshare_update_updated_at();

-- 创建触发器函数：注册时自动创建 profile
CREATE OR REPLACE FUNCTION mdshare_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO mdshare_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为 auth.users 添加触发器
CREATE TRIGGER on_auth_user_created_mdshare
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION mdshare_handle_new_user();
