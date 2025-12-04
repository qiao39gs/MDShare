export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  custom_domain: string | null
  storage_used: number
  storage_limit: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  short_code: string
  status: 'draft' | 'published' | 'archived' | 'deleted'
  is_pinned: boolean
  view_count: number
  access_type: 'public' | 'password' | 'email' | 'private'
  access_password: string | null
  allowed_emails: string[] | null
  expires_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PostVersion {
  id: string
  post_id: string
  version_number: number
  title: string
  content: string
  created_at: string
}

export interface File {
  id: string
  user_id: string
  post_id: string | null
  filename: string
  original_name: string
  cos_key: string
  file_size: number
  mime_type: string
  width: number | null
  height: number | null
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  content: string
  is_approved: boolean
  created_at: string
}

export interface AccessLog {
  id: string
  post_id: string
  ip_address: string | null
  user_agent: string | null
  referer: string | null
  country: string | null
  city: string | null
  accessed_at: string
}

export interface ShortLink {
  id: string
  short_code: string
  post_id: string
  created_at: string
}

// 带关联数据的类型
export interface PostWithProfile extends Post {
  mdshare_profiles: Profile | null
}

export interface PostWithVersions extends Post {
  mdshare_post_versions: PostVersion[]
}
