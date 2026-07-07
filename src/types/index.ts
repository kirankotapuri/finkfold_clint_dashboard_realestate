export interface Lead {
  id: string;
  client_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  property_type_interest: string | null;
  preferred_areas: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  purpose: string | null;
  timeline: string | null;
  lead_score: 'hot' | 'warm' | 'cold' | null;
  source: string | null;
  stage: 'new' | 'qualifying' | 'visit_booked' | 'won' | 'lost' | null;
  language: string | null;
  created_at: string;
  last_inbound_at: string | null;
  last_contacted_at: string | null;
  agent_id: string | null;
  bot_paused: boolean;
  opted_out: boolean;
  drip_step: number | null;
  // Joined fields
  agent_name?: string;
}

export interface Conversation {
  lead_id: string;
  client_id: string;
  context: ChatMessage[];
  last_message_at: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SiteVisit {
  id: string;
  client_id: string;
  lead_id: string;
  property_id: string | null;
  agent_id: string | null;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  feedback: string | null;
  // Joined
  lead_name?: string;
  property_title?: string;
  agent_name?: string;
}

export interface Client {
  id: string;
  name: string;
  city: string | null;
  active: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  client_id: string;
}

export interface Property {
  id: string;
  title: string;
  area: string | null;
  bhk_config: string | null;
  client_id: string;
}

// RPC return types
export interface DashSummary {
  leads_in_period: number;
  hot_leads: number;
  qualified_leads: number;
  upcoming_visits: number;
  total_leads: number;
  best_source: string | null;
}

export interface LeadsOverTime {
  day: string;
  leads: number;
  qualified: number;
}

export interface ScoreSplit {
  score: string;
  count: number;
}

export interface SourcePerformance {
  source: string;
  leads: number;
  qualified: number;
  hot: number;
}

export interface FunnelStage {
  stage_label: string;
  count: number;
  ord: number;
}

export interface VisitsOverTime {
  day: string;
  booked: number;
  completed: number;
}
