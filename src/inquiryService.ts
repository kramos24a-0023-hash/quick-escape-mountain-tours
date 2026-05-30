import { supabase } from "./supabaseClient";

export type InquiryCategory =
  | "General Reservation Inquiry"
  | "Availability"
  | "Pricing"
  | "Special Request"
  | "Event or Group Booking"
  | "Existing Reservation";

export type InquiryStatus = "Open" | "Pending" | "Resolved" | "Closed";
export type SenderRole = "customer" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  role: SenderRole;
};

export type Conversation = {
  id: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  reservation_id: string | null;
  subject: string;
  category: InquiryCategory;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  latest_message_text?: string | null;
  unread_count?: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: SenderRole;
  message_text: string;
  is_read: boolean;
  created_at: string;
};

export type ConversationFilters = {
  search?: string;
  status?: InquiryStatus | "All";
  category?: InquiryCategory | "All";
  unreadOnly?: boolean;
  sort?: "newest" | "oldest";
};

export const categories: InquiryCategory[] = [
  "General Reservation Inquiry",
  "Availability",
  "Pricing",
  "Special Request",
  "Event or Group Booking",
  "Existing Reservation",
];

export const statuses: InquiryStatus[] = ["Open", "Pending", "Resolved", "Closed"];

function requireClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export async function getSignedInUser() {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email: string) {
  const client = requireClient();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function fetchProfile(): Promise<Profile | null> {
  const user = await getSignedInUser();
  if (!user) return null;

  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchConversations(
  mode: "customer" | "admin",
  filters: ConversationFilters = {},
): Promise<Conversation[]> {
  const client = requireClient();
  let query = client
    .from("conversation_summaries")
    .select("*")
    .order("last_message_at", { ascending: filters.sort === "oldest" });

  if (mode === "customer") {
    const user = await getSignedInUser();
    if (!user) return [];
    query = query.eq("customer_id", user.id);
  }

  if (filters.status && filters.status !== "All") {
    query = query.eq("status", filters.status);
  }

  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }

  if (filters.unreadOnly) {
    query = query.gt("unread_count", 0);
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `customer_name.ilike.${term},customer_email.ilike.${term},reservation_id.ilike.${term},subject.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createConversation(input: {
  subject: string;
  category: InquiryCategory;
  reservationId?: string;
  message: string;
}) {
  const client = requireClient();
  const user = await getSignedInUser();
  if (!user) throw new Error("Please sign in before starting an inquiry.");

  const customerName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  const { data: conversation, error: conversationError } = await client
    .from("conversations")
    .insert({
      customer_id: user.id,
      customer_name: customerName,
      customer_email: user.email,
      reservation_id: input.reservationId?.trim() || null,
      subject: input.subject.trim(),
      category: input.category,
    })
    .select("*")
    .single();

  if (conversationError) throw conversationError;

  const { error: messageError } = await client.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_role: "customer",
    message_text: input.message.trim(),
  });

  if (messageError) throw messageError;
  return conversation as Conversation;
}

export async function sendMessage(conversationId: string, senderRole: SenderRole, messageText: string) {
  const client = requireClient();
  const user = await getSignedInUser();
  if (!user) throw new Error("Please sign in before sending a message.");

  const { error } = await client.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: senderRole,
    message_text: messageText.trim(),
  });

  if (error) throw error;
}

export async function markMessagesRead(conversationId: string, readerRole: SenderRole) {
  const client = requireClient();
  const oppositeRole: SenderRole = readerRole === "admin" ? "customer" : "admin";
  const { error } = await client
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("sender_role", oppositeRole)
    .eq("is_read", false);

  if (error) throw error;
}

export async function updateConversationStatus(conversationId: string, status: InquiryStatus) {
  const client = requireClient();
  const { error } = await client
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) throw error;
}
