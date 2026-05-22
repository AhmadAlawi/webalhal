export interface SupportTicket {
  ticketId: number;
  subject?: string;
  title?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
}

export interface TicketMessage {
  messageId?: number;
  ticketId?: number;
  content: string;
  senderUserId?: number;
  senderName?: string;
  isStaff?: boolean;
  createdAt?: string;
}
