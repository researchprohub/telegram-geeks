// Type definitions for the frontend.

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: 'admin' | 'operator' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface Account {
  id: number;
  phone_number: string;
  status: 'active' | 'suspended' | 'banned' | 'deleted' | 'warming';
  proxy_config: Record<string, any>;
  trust_score: number;
  daily_message_count: number;
  created_at: string;
}

export interface Persona {
  id: number;
  name: string;
  personality_traits: Record<string, any>;
  writing_style: Record<string, any>;
  response_time_min: number;
  response_time_max: number;
  tone: string;
  energy_level: number;
  humor_level: number;
  formality_level: number;
  niche_tags: string[];
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  campaign_type: 'engagement' | 'invite' | 'messaging' | 'social_proof';
  status: 'draft' | 'running' | 'paused' | 'stopped';
  config: Record<string, any>;
  target_groups: number[];
  allowed_hours: number[];
  timezone: string;
  persona_ids: number[];
  created_at: string;
  started_at: string | null;
}

export interface TelegramGroup {
  id: number;
  chat_id: number;
  title: string;
  group_type: 'group' | 'channel' | 'supergroup';
  member_count: number;
  niche_tags: string[];
  language: string | null;
  safety_score: number;
  created_at: string;
}

export interface AnalyticsSummary {
  campaign_id: number;
  engagement_score: number;
  conversion_rate: number;
  roi: number;
  account_health_index: number;
  funnel: {
    impressions: number;
    engagements: number;
    clicks: number;
    joins: number;
    active_members: number;
  };
}

export interface Conversation {
  id: number;
  campaign_id: number;
  group_id: number | null;
  message_id: number | null;
  status: 'pending' | 'active' | 'completed' | 'failed';
  persona_id: number | null;
  account_id: number | null;
  response_text: string | null;
  ai_model_used: string | null;
  quality_score: number | null;
  created_at: string;
}
