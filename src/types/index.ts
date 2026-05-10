export interface HtyUser {
  hty_id: string
  real_name?: string
  union_id?: string
  enabled: boolean
  infos: HtyUserApp[]
  tags?: HtyTag[]
  unread_tongzhi_count?: number
}

export interface HtyUserApp {
  id: string
  app_id?: string
  hty_id: string
  is_registered: boolean
  username?: string
  roles: HtyRole[]
}

export interface HtyRole {
  hty_role_id: string
  role_key: string
  role_desc?: string
}

export interface HtyTag {
  tag_id: string
  tag_name: string
}

export interface Ticket {
  number: number
  title: string
  body: string
  state: string
  labels: TicketLabel[]
  created_at: string
  updated_at: string
  user?: { login: string }
  assignee?: { login: string }
}

export interface TicketLabel {
  id: number
  name: string
  color: string
}

export interface TicketComment {
  id: number
  body: string
  user: { login: string }
  created_at: string
  updated_at: string
}

export interface TicketDetail {
  issue: Ticket
  comments: TicketComment[]
  claude_prompt_prefix?: string
}

export interface Project {
  id: string
  name: string
  repo_url?: string
  memory_doc?: string
  created_at: string
  updated_at: string
}
