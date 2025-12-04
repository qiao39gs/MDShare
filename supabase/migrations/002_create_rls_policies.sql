-- MDShare RLS 策略
-- 请在执行 001_create_mdshare_tables.sql 后执行此文件

-- 启用 RLS
ALTER TABLE mdshare_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdshare_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdshare_post_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdshare_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdshare_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdshare_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdshare_short_links ENABLE ROW LEVEL SECURITY;

-- Profiles 策略
CREATE POLICY "公开资料可被所有人查看"
  ON mdshare_profiles FOR SELECT
  USING (true);

CREATE POLICY "用户只能更新自己的资料"
  ON mdshare_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Posts 策略
CREATE POLICY "公开文章可被所有人查看"
  ON mdshare_posts FOR SELECT
  USING (
    status = 'published' AND access_type = 'public'
    OR user_id = auth.uid()
  );

CREATE POLICY "用户可以创建自己的文章"
  ON mdshare_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的文章"
  ON mdshare_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的文章"
  ON mdshare_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Post Versions 策略
CREATE POLICY "用户可以查看自己文章的版本历史"
  ON mdshare_post_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_post_versions.post_id
      AND mdshare_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以创建自己文章的版本"
  ON mdshare_post_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_post_versions.post_id
      AND mdshare_posts.user_id = auth.uid()
    )
  );

-- Files 策略
CREATE POLICY "用户可以查看自己的文件"
  ON mdshare_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以上传文件"
  ON mdshare_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的文件"
  ON mdshare_files FOR DELETE
  USING (auth.uid() = user_id);

-- Comments 策略
CREATE POLICY "公开文章的评论可被所有人查看"
  ON mdshare_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_comments.post_id
      AND mdshare_posts.status = 'published'
      AND mdshare_posts.access_type = 'public'
    )
    OR EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_comments.post_id
      AND mdshare_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "所有人可以创建评论"
  ON mdshare_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_comments.post_id
      AND mdshare_posts.status = 'published'
    )
  );

CREATE POLICY "文章作者可以删除评论"
  ON mdshare_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_comments.post_id
      AND mdshare_posts.user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Access Logs 策略
CREATE POLICY "文章作者可以查看访问日志"
  ON mdshare_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_access_logs.post_id
      AND mdshare_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "所有人可以创建访问日志"
  ON mdshare_access_logs FOR INSERT
  WITH CHECK (true);

-- Short Links 策略
CREATE POLICY "短链可被所有人查看"
  ON mdshare_short_links FOR SELECT
  USING (true);

CREATE POLICY "用户可以创建自己文章的短链"
  ON mdshare_short_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mdshare_posts
      WHERE mdshare_posts.id = mdshare_short_links.post_id
      AND mdshare_posts.user_id = auth.uid()
    )
  );
