import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Inbox, Loader2, LogOut, MessageCircle, Search, Send } from "lucide-react";
import {
  categories,
  Conversation,
  ConversationFilters,
  createConversation,
  fetchConversations,
  fetchMessages,
  getSignedInUser,
  fetchProfile,
  InquiryCategory,
  InquiryStatus,
  markMessagesRead,
  Message,
  sendMessage,
  signInWithEmail,
  signOut,
  statuses,
  updateConversationStatus,
} from "./inquiryService";
import { isSupabaseConfigured } from "./supabaseClient";

const MESSAGE_LIMIT = 2000;
const SIGN_IN_COOLDOWN_MS = 60_000;

type Mode = "customer" | "admin";

export function InquiryMessaging() {
  const [email, setEmail] = useState("");
  const [profileRole, setProfileRole] = useState<Mode>("customer");
  const [mode, setMode] = useState<Mode>("customer");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [authCooldownUntil, setAuthCooldownUntil] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filters, setFilters] = useState<ConversationFilters>({
    status: "All",
    category: "All",
    sort: "newest",
  });
  const [newInquiry, setNewInquiry] = useState({
    subject: "",
    category: "General Reservation Inquiry" as InquiryCategory,
    reservationId: "",
    message: "",
  });
  const [reply, setReply] = useState("");

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const unreadAdminCount = conversations.reduce(
    (total, conversation) => total + (conversation.unread_count ?? 0),
    0,
  );

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      void loadConversations(mode);
    }
  }, [isSignedIn, mode, filters.status, filters.category, filters.search, filters.sort, filters.unreadOnly]);

  useEffect(() => {
    if (selectedConversationId) {
      void loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, mode]);

  async function initialize() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const authRedirectError = readAuthRedirectError();
      if (authRedirectError) {
        setAuthError(authRedirectError);
      }

      const user = await getSignedInUser();
      const profile = await fetchProfile();
      setIsSignedIn(Boolean(user));
      const role = profile?.role === "admin" ? "admin" : "customer";
      setProfileRole(role);
      setMode(role);
    } catch (caught) {
      setAuthError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations(nextMode = mode) {
    setError("");
    setLoading(true);
    try {
      const data = await fetchConversations(nextMode, filters);
      setConversations(data);
      setSelectedConversationId((current) => current ?? data[0]?.id ?? null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setError("");
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data);
      await markMessagesRead(conversationId, mode);
      await loadConversations(mode);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");

    if (Date.now() < authCooldownUntil) {
      setAuthError("Please wait a minute before requesting another sign-in email.");
      return;
    }

    if (!email.trim()) {
      setAuthError("Enter your email address first.");
      return;
    }

    try {
      await signInWithEmail(email.trim());
      setAuthCooldownUntil(Date.now() + SIGN_IN_COOLDOWN_MS);
      setAuthNotice("Check your email for the private sign-in link.");
    } catch (caught) {
      const message = getErrorMessage(caught);
      if (message.toLowerCase().includes("rate limit")) {
        setAuthCooldownUntil(Date.now() + SIGN_IN_COOLDOWN_MS);
        setAuthError("Supabase is temporarily rate limiting sign-in emails. Wait a few minutes before trying again, or use a different email.");
      } else {
        setAuthError(message);
      }
    }
  }

  async function handleSignOut() {
    await signOut();
    setIsSignedIn(false);
    setConversations([]);
    setMessages([]);
    setSelectedConversationId(null);
  }

  async function handleCreateInquiry(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!newInquiry.subject.trim() || !newInquiry.message.trim()) {
      setError("Add a subject and message before sending.");
      return;
    }

    if (newInquiry.message.trim().length > MESSAGE_LIMIT) {
      setError(`Messages must be ${MESSAGE_LIMIT} characters or fewer.`);
      return;
    }

    setSending(true);
    try {
      const conversation = await createConversation(newInquiry);
      setNewInquiry({
        subject: "",
        category: "General Reservation Inquiry",
        reservationId: "",
        message: "",
      });
      setSuccess("Inquiry sent. The Quick Escape team can now reply privately.");
      await loadConversations(mode);
      setSelectedConversationId(conversation.id);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  async function handleReply(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedConversation || !reply.trim()) {
      setError("Type a message before sending.");
      return;
    }

    if (reply.trim().length > MESSAGE_LIMIT) {
      setError(`Messages must be ${MESSAGE_LIMIT} characters or fewer.`);
      return;
    }

    setSending(true);
    try {
      await sendMessage(selectedConversation.id, mode, reply);
      setReply("");
      setSuccess("Message sent.");
      await loadMessages(selectedConversation.id);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: InquiryStatus) {
    if (!selectedConversation) return;
    setError("");
    try {
      await updateConversationStatus(selectedConversation.id, status);
      await loadConversations(mode);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="inquirySetupState">
        <AlertCircle aria-hidden="true" />
        <h2>Supabase setup required</h2>
        <p>
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run the included migration to enable private reservation inquiries.
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="inquiryAuthPanel">
        <div>
          <p className="sectionLabel">Private Reservation Inquiry</p>
          <h2>Sign in to message Quick Escape privately.</h2>
          <p>
            A secure email link keeps reservation conversations visible only to the customer and authorized admins.
          </p>
        </div>
        <form className="authForm" onSubmit={handleSignIn}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button className="solidButton" type="submit">
            <Send aria-hidden="true" />
            Send sign-in link
          </button>
          {authNotice && <p className="successText">{authNotice}</p>}
          {(authError || error) && <p className="errorText">{authError || error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="inquiryWorkspace">
      <div className="inquiryToolbar">
        <div>
          <p className="sectionLabel">Reservation Messages</p>
          <h2>Private inquiry center</h2>
        </div>
        <div className="inquiryToolbarActions">
          {profileRole === "admin" && (
            <div className="modeSwitch" role="tablist" aria-label="Message mode">
              <button className={mode === "admin" ? "active" : ""} type="button" onClick={() => setMode("admin")}>
                Admin
                {unreadAdminCount > 0 && <span>{unreadAdminCount}</span>}
              </button>
              <button className={mode === "customer" ? "active" : ""} type="button" onClick={() => setMode("customer")}>
                Customer
              </button>
            </div>
          )}
          <button className="ghostButton darkText" type="button" onClick={handleSignOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>

      {mode === "customer" && (
        <form className="newInquiryForm" onSubmit={handleCreateInquiry}>
          <div className="formRow">
            <label>
              Subject
              <input
                maxLength={160}
                value={newInquiry.subject}
                onChange={(event) => setNewInquiry((current) => ({ ...current, subject: event.target.value }))}
                placeholder="ATV availability for Saturday"
              />
            </label>
            <label>
              Category
              <select
                value={newInquiry.category}
                onChange={(event) =>
                  setNewInquiry((current) => ({ ...current, category: event.target.value as InquiryCategory }))
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Reservation ID
              <input
                value={newInquiry.reservationId}
                onChange={(event) => setNewInquiry((current) => ({ ...current, reservationId: event.target.value }))}
                placeholder="Optional"
              />
            </label>
          </div>
          <label>
            Message
            <textarea
              maxLength={MESSAGE_LIMIT}
              value={newInquiry.message}
              onChange={(event) => setNewInquiry((current) => ({ ...current, message: event.target.value }))}
              placeholder="Tell us your preferred date, group size, and question."
            />
          </label>
          <div className="formFooter">
            <span>{newInquiry.message.trim().length}/{MESSAGE_LIMIT}</span>
            <button className="solidButton" type="submit" disabled={sending || !newInquiry.message.trim()}>
              {sending ? <Loader2 className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              Send inquiry
            </button>
          </div>
        </form>
      )}

      {mode === "admin" && (
        <div className="adminFilters">
          <label className="searchBox">
            <Search aria-hidden="true" />
            <input
              value={filters.search ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search name, email, reservation ID, or subject"
            />
          </label>
          <select
            value={filters.status ?? "All"}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ConversationFilters["status"] }))}
          >
            <option>All</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            value={filters.category ?? "All"}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as ConversationFilters["category"] }))}
          >
            <option>All</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.sort ?? "newest"}
            onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as "newest" | "oldest" }))}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <label className="checkFilter">
            <input
              type="checkbox"
              checked={Boolean(filters.unreadOnly)}
              onChange={(event) => setFilters((current) => ({ ...current, unreadOnly: event.target.checked }))}
            />
            Unread
          </label>
        </div>
      )}

      {(error || success) && (
        <div className={error ? "messageNotice error" : "messageNotice success"}>
          {error ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {error || success}
        </div>
      )}

      <div className="conversationGrid">
        <aside className="conversationList" aria-label="Conversation list">
          {loading ? (
            <div className="emptyMessages"><Loader2 className="spin" aria-hidden="true" /> Loading inquiries...</div>
          ) : conversations.length === 0 ? (
            <div className="emptyMessages">
              <Inbox aria-hidden="true" />
              No inquiries yet.
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={conversation.id === selectedConversationId ? "conversationItem active" : "conversationItem"}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <span className="conversationMeta">
                  <strong>{conversation.subject}</strong>
                  <small>{mode === "admin" ? conversation.customer_email : conversation.category}</small>
                </span>
                <span className="conversationPreview">{conversation.latest_message_text ?? "No messages yet"}</span>
                <span className="conversationFooter">
                  <small>{formatDate(conversation.last_message_at)}</small>
                  <em>{conversation.status}</em>
                  {(conversation.unread_count ?? 0) > 0 && <b>{conversation.unread_count}</b>}
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="messagePanel" aria-label="Message history">
          {!selectedConversation ? (
            <div className="emptyMessages">
              <MessageCircle aria-hidden="true" />
              Select a conversation to read and reply.
            </div>
          ) : (
            <>
              <header className="messageHeader">
                <div>
                  <h3>{selectedConversation.subject}</h3>
                  <p>
                    {selectedConversation.category}
                    {selectedConversation.reservation_id ? ` · Reservation ${selectedConversation.reservation_id}` : ""}
                  </p>
                  {mode === "admin" && (
                    <p>{selectedConversation.customer_name ?? "Customer"} · {selectedConversation.customer_email}</p>
                  )}
                </div>
                {mode === "admin" && (
                  <select
                    value={selectedConversation.status}
                    onChange={(event) => void handleStatusChange(event.target.value as InquiryStatus)}
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                )}
              </header>

              <div className="messageHistory">
                {messages.length === 0 ? (
                  <div className="emptyMessages">No messages in this conversation yet.</div>
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={message.sender_role === mode ? "chatBubble mine" : "chatBubble theirs"}
                    >
                      <p>{message.message_text}</p>
                      <span>
                        <Clock aria-hidden="true" />
                        {formatDate(message.created_at)}
                        {message.sender_role === mode ? ` · ${message.is_read ? "Read" : "Delivered"}` : ""}
                      </span>
                    </article>
                  ))
                )}
              </div>

              <form className="replyForm" onSubmit={handleReply}>
                <textarea
                  maxLength={MESSAGE_LIMIT}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder={mode === "admin" ? "Reply to the customer" : "Send a follow-up message"}
                />
                <button className="solidButton" type="submit" disabled={sending || !reply.trim()}>
                  {sending ? <Loader2 className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function readAuthRedirectError() {
  const hash = window.location.hash;
  if (!hash.includes("error")) return "";

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const errorCode = params.get("error_code");
  const description = params.get("error_description")?.replace(/\+/g, " ");

  window.history.replaceState(null, document.title, window.location.pathname + window.location.search);

  if (errorCode === "otp_expired") {
    return "That email sign-in link is invalid or expired. Request one fresh link and use the newest email only.";
  }

  return description || "The sign-in link could not be used. Please request a fresh link.";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
