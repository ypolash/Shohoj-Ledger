"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Hash,
  Megaphone,
  Lock,
  Plus,
  Search,
  Send,
  Paperclip,
  Smile,
  X,
  Pin,
  MessageSquare,
  Users,
  FileText,
  Download,
  Image as ImageIcon,
  Reply,
  ChevronRight,
  ShieldAlert,
  File,
  AtSign
} from "lucide-react";
import styles from "../community.module.css";

interface Attachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface Reaction {
  id?: string;
  userId: string;
  userName: string;
  emoji: string;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderType: "ADMIN" | "STAFF" | "MEMBER";
  senderAvatar?: string | null;
  content: string;
  isPinned: boolean;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  } | null;
  attachments: Attachment[];
  reactions: Reaction[];
  createdAt: string;
}

interface ChannelMember {
  userId: string;
  userName: string;
  userRole: string;
  userAvatar?: string | null;
}

interface Channel {
  id: string;
  name: string;
  rawName: string;
  topic?: string | null;
  type: "CHANNEL" | "ANNOUNCEMENT" | "DIRECT_MESSAGE";
  isPrivate: boolean;
  memberCount: number;
  messageCount: number;
  hasUnread: boolean;
  dmParticipant?: ChannelMember | null;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  type: "ADMIN" | "STAFF" | "MEMBER";
  email?: string;
}

interface DirectoryPerson {
  id: string;
  name: string;
  role: string;
  type: "STAFF" | "MEMBER";
  email?: string;
  department?: string;
  phone?: string;
}

const COMMON_EMOJIS = ["👍", "❤️", "🎉", "🔥", "🚀", "💡", "✅"];

export function CommunityChat() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [staffDirectory, setStaffDirectory] = useState<DirectoryPerson[]>([]);
  const [memberDirectory, setMemberDirectory] = useState<DirectoryPerson[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchChannelQuery, setSearchChannelQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"members" | "files" | "pinned">("members");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New channel form
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelTopic, setNewChannelTopic] = useState("");
  const [newChannelType, setNewChannelType] = useState<"CHANNEL" | "ANNOUNCEMENT">("CHANNEL");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete state
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const lastWord = useMemo(() => {
    const lastSpace = Math.max(inputText.lastIndexOf(" "), inputText.lastIndexOf("\n"));
    return lastSpace === -1 ? inputText : inputText.substring(lastSpace + 1);
  }, [inputText]);

  const isMentioning = lastWord.startsWith("@");
  const mentionQuery = isMentioning ? lastWord.slice(1).toLowerCase() : "";

  const matchingMentionMembers = useMemo(() => {
    if (!isMentioning) return [];
    const all = [
      ...staffDirectory.map((s) => ({ ...s, isStaff: true })),
      ...memberDirectory.map((m) => ({ ...m, isStaff: false })),
    ].filter(
      (p) =>
        p.id !== currentUser?.id &&
        p.name &&
        p.name.toLowerCase() !== currentUser?.name?.toLowerCase()
    );

    if (!mentionQuery) return all.slice(0, 6);
    return all
      .filter(
        (p) =>
          p.name.toLowerCase().includes(mentionQuery) ||
          p.role.toLowerCase().includes(mentionQuery) ||
          (p.department && p.department.toLowerCase().includes(mentionQuery))
      )
      .slice(0, 6);
  }, [isMentioning, mentionQuery, staffDirectory, memberDirectory, currentUser]);

  const handleInsertMention = (person: DirectoryPerson) => {
    const lastSpace = Math.max(inputText.lastIndexOf(" "), inputText.lastIndexOf("\n"));
    const prefix = lastSpace === -1 ? "" : inputText.substring(0, lastSpace + 1);
    setInputText(`${prefix}@${person.name} `);
    setActiveMentionIndex(0);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  };

  // 1. Initial Load: Channels & Directory
  useEffect(() => {
    loadDirectoryAndChannels();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const loadDirectoryAndChannels = async () => {
    try {
      setLoading(true);
      const [chRes, memRes] = await Promise.all([
        fetch("/api/community/channels"),
        fetch("/api/community/members"),
      ]);

      if (memRes.ok) {
        const memData = await memRes.json();
        setCurrentUser(memData.currentUser);
        setStaffDirectory(memData.staff || []);
        setMemberDirectory(memData.members || []);
      }

      if (chRes.ok) {
        const chData = await chRes.json();
        const loadedChannels: Channel[] = chData.channels || [];
        setChannels(loadedChannels);

        if (loadedChannels.length > 0 && !activeChannelId) {
          const generalCh = loadedChannels.find((c) => c.rawName === "general") || loadedChannels[0];
          setActiveChannelId(generalCh.id);
        }
      }
    } catch (err) {
      console.error("Failed to load community initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch messages when active channel changes
  useEffect(() => {
    if (!activeChannelId) return;

    loadMessages(activeChannelId);
    markChannelRead(activeChannelId);

    // Heartbeat polling for live updates every 3.5s
    const interval = setInterval(() => {
      syncLatestMessages(activeChannelId);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeChannelId]);

  const loadMessages = async (channelId: string) => {
    try {
      setMessagesLoading(true);
      const res = await fetch(`/api/community/messages?channelId=${channelId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const playWebAudioChime = (isMention = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(isMention ? 880 : 587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + (isMention ? 0.35 : 0.2));
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(isMention ? 1174.66 : 880, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      // Audio chime quiet fallback
    }
  };

  const syncLatestMessages = async (channelId: string) => {
    try {
      const res = await fetch(`/api/community/messages?channelId=${channelId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const fresh: CommunityMessage[] = data.messages || [];
          if (JSON.stringify(prev) !== JSON.stringify(fresh)) {
            const prevIds = new Set(prev.map((m) => m.id));
            const newIncoming = fresh.filter((m) => !prevIds.has(m.id) && m.senderId !== currentUser?.id);
            if (newIncoming.length > 0) {
              const myName = currentUser?.name?.toLowerCase() || "";
              const hasMention = newIncoming.some(
                (m) =>
                  myName &&
                  (m.content.toLowerCase().includes(`@${myName}`) ||
                    m.content.toLowerCase().includes(`@${myName.split(" ")[0]}`))
              );
              playWebAudioChime(hasMention);

              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted" &&
                document.hidden
              ) {
                const latest = newIncoming[newIncoming.length - 1];
                const notifTitle = hasMention
                  ? `🔔 Mentioned by ${latest.senderName}`
                  : `New message from ${latest.senderName}`;
                new Notification(notifTitle, {
                  body: latest.content || "Sent an attachment",
                  icon: "/favicon.ico",
                });
              }
            }
            return fresh;
          }
          return prev;
        });
      }
    } catch (err) {
      // Quiet background sync catch
    }
  };

  const markChannelRead = async (channelId: string) => {
    try {
      await fetch(`/api/community/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead" }),
      });
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, hasUnread: false } : c))
      );
    } catch (e) {
      // ignore
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || null;
  }, [channels, activeChannelId]);

  // 3. File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/community/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPendingAttachments((prev) => [
            ...prev,
            {
              fileName: data.fileName,
              fileUrl: data.fileUrl,
              fileType: data.fileType,
              fileSize: data.fileSize,
            },
          ]);
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Error uploading attachment");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChannelId || isSending) return;
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    const payload = {
      channelId: activeChannelId,
      content: inputText.trim(),
      attachments: pendingAttachments,
      replyToId: replyingTo?.id || null,
    };

    setIsSending(true);
    try {
      const res = await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
        setPendingAttachments([]);
        setReplyingTo(null);
        scrollToBottom();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send message");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  // 5. Toggle Emoji Reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/community/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const existingIndex = msg.reactions.findIndex(
              (r) => r.userId === currentUser?.id && r.emoji === emoji
            );
            if (existingIndex > -1) {
              return {
                ...msg,
                reactions: msg.reactions.filter((_, idx) => idx !== existingIndex),
              };
            } else {
              return {
                ...msg,
                reactions: [
                  ...msg.reactions,
                  {
                    userId: currentUser?.id || "unknown",
                    userName: currentUser?.name || "You",
                    emoji,
                  },
                ],
              };
            }
          })
        );
      }
    } catch (err) {
      console.error("Failed to react:", err);
    } finally {
      setShowEmojiPicker(null);
    }
  };

  // 6. Toggle Pin
  const handleTogglePin = async (messageId: string) => {
    try {
      const res = await fetch(`/api/community/messages/${messageId}/pin`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned: data.isPinned } : m))
        );
      }
    } catch (err) {
      console.error("Toggle pin failed:", err);
    }
  };

  // 7. Create Channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch("/api/community/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChannelName,
          topic: newChannelTopic,
          type: newChannelType,
          isPrivate: newChannelPrivate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChannels((prev) => [...prev, data.channel]);
        setActiveChannelId(data.channel.id);
        setCreateModalOpen(false);
        setNewChannelName("");
        setNewChannelTopic("");
        setNewChannelType("CHANNEL");
        setNewChannelPrivate(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create channel");
      }
    } catch (err) {
      console.error("Failed to create channel:", err);
    }
  };

  // 8. Start Direct Message
  const handleStartDM = async (person: DirectoryPerson) => {
    try {
      const res = await fetch("/api/community/direct-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: person.id,
          targetUserName: person.name,
          targetUserRole: person.role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDmModalOpen(false);
        const chRes = await fetch("/api/community/channels");
        if (chRes.ok) {
          const chData = await chRes.json();
          setChannels(chData.channels || []);
        }
        setActiveChannelId(data.channelId);
      }
    } catch (err) {
      console.error("Failed to start DM:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleGradient = (type?: string, role?: string) => {
    if (type === "ADMIN" || role?.toLowerCase().includes("admin") || role?.toLowerCase().includes("owner")) {
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    }
    if (type === "STAFF" || role?.toLowerCase().includes("ceo") || role?.toLowerCase().includes("manager")) {
      return "linear-gradient(135deg, #2563eb, #1d4ed8)";
    }
    return "linear-gradient(135deg, #059669, #047857)";
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((c) =>
      c.name.toLowerCase().includes(searchChannelQuery.toLowerCase())
    );
  }, [channels, searchChannelQuery]);

  const announcementChannels = filteredChannels.filter((c) => c.type === "ANNOUNCEMENT");
  const regularChannels = filteredChannels.filter((c) => c.type === "CHANNEL");
  const dmChannels = filteredChannels.filter((c) => c.type === "DIRECT_MESSAGE");

  const filteredDirectory = useMemo(() => {
    const q = dmSearchQuery.toLowerCase();
    const all = [
      ...staffDirectory.map((s) => ({ ...s, section: "Staff" })),
      ...memberDirectory.map((m) => ({ ...m, section: "Members" })),
    ];
    return all.filter(
      (p) =>
        p.id !== currentUser?.id &&
        (p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
    );
  }, [staffDirectory, memberDirectory, dmSearchQuery, currentUser]);

  const allChannelFiles = useMemo(() => {
    const files: Attachment[] = [];
    messages.forEach((m) => {
      m.attachments.forEach((att) => files.push(att));
    });
    return files;
  }, [messages]);

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.isPinned);
  }, [messages]);

  const isCurrentMemberAllowedToPost =
    activeChannel?.type !== "ANNOUNCEMENT" || currentUser?.type !== "MEMBER";

  return (
    <div className={styles.communityContainer}>
      {/* -------------------------------------------------------------
          LEFT SIDEBAR (Channels & Direct Messages)
      ------------------------------------------------------------- */}
      <aside className={styles.channelSidebar}>
        <div className={styles.workspaceHeader}>
          <div className={styles.workspaceTitle}>
            <Users size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Community Hub</span>
          </div>
          <span className={styles.onlineBadge}>
            <span className={styles.pulseDot} />
            Live
          </span>
        </div>

        {/* Search Channels */}
        <div className={styles.searchBox}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchChannelQuery}
              onChange={(e) => setSearchChannelQuery(e.target.value)}
              className={styles.channelSearchInput}
            />
          </div>
        </div>

        {/* Channels List */}
        <div className={styles.channelList}>
          {/* Announcements Group */}
          {announcementChannels.length > 0 && (
            <div className={styles.categoryGroup}>
              <div className={styles.categoryHeader}>
                <span>Broadcasts</span>
              </div>
              {announcementChannels.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChannelId(c.id)}
                  className={`${styles.channelItem} ${
                    activeChannelId === c.id ? styles.channelItemActive : ""
                  }`}
                >
                  <div className={styles.channelItemLeft}>
                    <Megaphone size={16} className={`${styles.channelIcon} text-amber-500`} />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{c.name}</span>
                      {c.lastMessage?.content ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {c.lastMessage.senderName}: {c.lastMessage.content}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {(c.hasUnread || (c as any).unreadCount > 0) && (
                    <span className={styles.unreadBadge}>
                      {(c as any).unreadCount > 99 ? "99+" : (c as any).unreadCount > 0 ? (c as any).unreadCount : "•"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Regular Channels Group */}
          <div className={styles.categoryGroup}>
            <div className={styles.categoryHeader}>
              <span>Channels</span>
              {currentUser?.type !== "MEMBER" && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className={styles.addChannelBtn}
                  title="Create Channel"
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
            {regularChannels.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`${styles.channelItem} ${
                  activeChannelId === c.id ? styles.channelItemActive : ""
                }`}
              >
                <div className={styles.channelItemLeft}>
                  {c.isPrivate ? (
                    <Lock size={15} className={`${styles.channelIcon} text-slate-400`} />
                  ) : (
                    <Hash size={15} className={`${styles.channelIcon} text-blue-500 dark:text-blue-400`} />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{c.name}</span>
                    {c.lastMessage?.content ? (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {c.lastMessage.senderName}: {c.lastMessage.content}
                      </span>
                    ) : c.topic && c.topic.trim().toLowerCase() !== "none" ? (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{c.topic}</span>
                    ) : null}
                  </div>
                </div>
                {(c.hasUnread || (c as any).unreadCount > 0) && (
                  <span className={styles.unreadBadge}>
                    {(c as any).unreadCount > 99 ? "99+" : (c as any).unreadCount > 0 ? (c as any).unreadCount : "•"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Direct Messages Group */}
          <div className={styles.categoryGroup}>
            <div className={styles.categoryHeader}>
              <span>Direct Messages</span>
              <button
                onClick={() => setDmModalOpen(true)}
                className={styles.addChannelBtn}
                title="Start Direct Chat"
              >
                <Plus size={15} />
              </button>
            </div>
            {dmChannels.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1">No active DMs</div>
            ) : (
              dmChannels.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChannelId(c.id)}
                  className={`${styles.channelItem} ${
                    activeChannelId === c.id ? styles.channelItemActive : ""
                  }`}
                >
                  <div className={styles.channelItemLeft}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: getRoleGradient(c.dmParticipant?.userRole) }}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{c.name}</span>
                      {c.lastMessage?.content ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {c.lastMessage.content}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {(c.hasUnread || (c as any).unreadCount > 0) && (
                    <span className={styles.unreadBadge}>
                      {(c as any).unreadCount > 99 ? "99+" : (c as any).unreadCount > 0 ? (c as any).unreadCount : "•"}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current User Card */}
        {currentUser && (
          <div className={styles.userStatusCard}>
            <div
              className={styles.userAvatar}
              style={{ background: getRoleGradient(currentUser.type, currentUser.role) }}
            >
              {getInitials(currentUser.name)}
              <span className={styles.userOnlineDot} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{currentUser.name}</div>
              <span className={styles.userRoleBadge}>{currentUser.role}</span>
            </div>
          </div>
        )}
      </aside>

      {/* -------------------------------------------------------------
          MAIN CHAT FEED
      ------------------------------------------------------------- */}
      <main className={styles.chatFeed}>
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderInfo}>
            <div className={styles.chatHeaderTitle}>
              {activeChannel?.type === "ANNOUNCEMENT" ? (
                <Megaphone size={19} className="text-amber-500" />
              ) : activeChannel?.type === "DIRECT_MESSAGE" ? (
                <MessageSquare size={19} className="text-emerald-500" />
              ) : activeChannel?.isPrivate ? (
                <Lock size={19} className="text-slate-400" />
              ) : (
                <Hash size={19} className="text-blue-600 dark:text-blue-400" />
              )}
              <span>{activeChannel?.name || "Select a channel"}</span>
            </div>
            {activeChannel?.topic && (
              <div className={styles.chatHeaderTopic}>{activeChannel.topic}</div>
            )}
          </div>

          <div className={styles.chatHeaderActions}>
            <button
              onClick={() => {
                setActiveDrawerTab("pinned");
                setDrawerOpen(true);
              }}
              className={`${styles.headerBtn} ${
                pinnedMessages.length > 0 ? "text-amber-600 dark:text-amber-400 font-semibold" : ""
              }`}
              title="Pinned Messages"
            >
              <Pin size={15} />
              <span>{pinnedMessages.length}</span>
            </button>

            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className={`${styles.headerBtn} ${drawerOpen ? styles.headerBtnActive : ""}`}
              title="Toggle Info Panel"
            >
              <Users size={15} />
              <span>Directory</span>
            </button>
          </div>
        </div>

        {/* Pinned Messages Banner */}
        {pinnedMessages.length > 0 && (
          <div className={styles.pinnedBanner}>
            <div className="flex items-center gap-2">
              <Pin size={15} className="shrink-0" />
              <span className="font-semibold">{pinnedMessages.length} Pinned Notice(s)</span>
              <span className="text-xs opacity-90 hidden md:inline truncate max-w-md">
                - "{pinnedMessages[pinnedMessages.length - 1].content}"
              </span>
            </div>
            <button
              onClick={() => {
                setActiveDrawerTab("pinned");
                setDrawerOpen(true);
              }}
              className="text-xs font-semibold underline hover:opacity-80 ml-2 shrink-0"
            >
              View Pinned
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className={styles.messageStream}>
          {messagesLoading ? (
            <div className={styles.emptyState}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Welcome to #{activeChannel?.name}!
              </h3>
              <p className="text-sm max-w-md text-slate-500 dark:text-slate-400">
                This is the start of the #{activeChannel?.name} discussion. Start connecting, share updates,
                and collaborate with everyone in the organization.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const isDifferentDay =
                !prevMsg ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString();

              const reactionCounts = msg.reactions.reduce((acc: any, curr) => {
                acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                return acc;
              }, {});

              const userReactedEmojis = msg.reactions
                .filter((r) => r.userId === currentUser?.id)
                .map((r) => r.emoji);

              return (
                <React.Fragment key={msg.id}>
                  {isDifferentDay && (
                    <div className={styles.dateDivider}>
                      <span>{new Date(msg.createdAt).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}</span>
                    </div>
                  )}

                  <div className={styles.messageItem}>
                    {/* Hover Quick Actions */}
                    <div className={styles.messageActionsHover}>
                      {COMMON_EMOJIS.slice(0, 3).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className={styles.hoverActionBtn}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)
                        }
                        className={styles.hoverActionBtn}
                        title="Add Reaction"
                      >
                        <Smile size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(msg);
                          textareaRef.current?.focus();
                        }}
                        className={styles.hoverActionBtn}
                        title="Reply"
                      >
                        <Reply size={15} />
                      </button>
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className={`${styles.hoverActionBtn} ${
                          msg.isPinned ? "text-amber-500" : ""
                        }`}
                        title={msg.isPinned ? "Unpin message" : "Pin message"}
                      >
                        <Pin size={15} />
                      </button>
                    </div>

                    {/* Emoji Popover */}
                    {showEmojiPicker === msg.id && (
                      <div className="absolute right-14 top-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-xl z-20 flex gap-2">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="text-lg hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Avatar */}
                    <div
                      className={styles.messageSenderAvatar}
                      style={{
                        background: getRoleGradient(msg.senderType, msg.senderRole),
                      }}
                    >
                      {getInitials(msg.senderName)}
                    </div>

                    {/* Body */}
                    <div className={styles.messageBody}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageSenderName}>{msg.senderName}</span>
                        {msg.senderId === currentUser?.id ? (
                          <span className={styles.rolePillYou}>You</span>
                        ) : (
                          <span
                            className={
                              msg.senderType === "ADMIN" || msg.senderRole.toLowerCase().includes("owner")
                                ? styles.rolePillAdmin
                                : msg.senderType === "STAFF"
                                ? styles.rolePillStaff
                                : styles.rolePillMember
                            }
                          >
                            {msg.senderType === "ADMIN" || msg.senderRole.toLowerCase().includes("owner")
                              ? "Owner"
                              : msg.senderRole}
                          </span>
                        )}
                        <span className={styles.messageTimestamp}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {currentUser?.name && (
                          msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`) ||
                          msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase().split(" ")[0]}`)
                        ) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-full border border-sky-300 dark:border-sky-700">
                            @ Mentioned you
                          </span>
                        )}
                        {msg.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                      </div>

                      {/* Quoted Reply */}
                      {msg.replyTo && (
                        <div className={styles.replyQuote}>
                          <Reply size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {msg.replyTo.senderName}:
                          </span>
                          <span className="truncate">{msg.replyTo.content}</span>
                        </div>
                      )}

                      {/* Text */}
                      {msg.content && (
                        <div className={styles.messageText}>
                          {msg.content.split(/(@[a-zA-Z0-9_.\-]+(?:\s[a-zA-Z0-9_.\-]+)?|#\[Task:[^\]]+\]|#\w+)/g).map((part, pIdx) => {
                            if (part.startsWith("@")) {
                              return (
                                <span
                                  key={pIdx}
                                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 font-semibold text-[13px]"
                                >
                                  {part}
                                </span>
                              );
                            } else if (part.startsWith("#")) {
                              return (
                                <span
                                  key={pIdx}
                                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-semibold text-[13px]"
                                >
                                  {part}
                                </span>
                              );
                            }
                            return <span key={pIdx}>{part}</span>;
                          })}
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={styles.attachmentContainer}>
                          {msg.attachments.map((att, attIdx) => {
                            const isImage = att.fileType.startsWith("image/");
                            return isImage ? (
                              <div
                                key={attIdx}
                                onClick={() => setPreviewImage(att.fileUrl)}
                                className={styles.imageAttachmentCard}
                              >
                                <img
                                  src={att.fileUrl}
                                  alt={att.fileName}
                                  className={styles.imageAttachment}
                                />
                              </div>
                            ) : (
                              <a
                                key={attIdx}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={att.fileName}
                                className={styles.fileAttachmentCard}
                              >
                                <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className={styles.fileAttachmentInfo}>
                                  <div className={styles.fileAttachmentName}>{att.fileName}</div>
                                  <div className={styles.fileAttachmentMeta}>
                                    {(att.fileSize / 1024).toFixed(1)} KB • Download
                                  </div>
                                </div>
                                <Download size={14} className="text-slate-400 shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Reactions */}
                      {Object.keys(reactionCounts).length > 0 && (
                        <div className={styles.reactionsContainer}>
                          {Object.entries(reactionCounts).map(([emoji, count]) => {
                            const isUserReacted = userReactedEmojis.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className={`${styles.reactionPill} ${
                                  isUserReacted ? styles.reactionPillActive : ""
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{count as number}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* -------------------------------------------------------------
            MESSAGE COMPOSER
        ------------------------------------------------------------- */}
        <div className={styles.composerWrapper}>
          {/* Replying-to Preview */}
          {replyingTo && (
            <div className={styles.replyPreviewBar}>
              <div className="flex items-center gap-2 truncate">
                <Reply size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  Replying to <strong className="text-slate-800 dark:text-slate-100">{replyingTo.senderName}</strong>:{" "}
                  {replyingTo.content.slice(0, 60)}...
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Pending Uploads Preview */}
          {pendingAttachments.length > 0 && (
            <div className={styles.pendingAttachments}>
              {pendingAttachments.map((att, idx) => (
                <div key={idx} className={styles.pendingAttachmentChip}>
                  {att.fileType.startsWith("image/") ? (
                    <ImageIcon size={14} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <File size={14} className="text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="truncate max-w-[150px]">{att.fileName}</span>
                  <button
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Composer Input Box */}
          {isCurrentMemberAllowedToPost ? (
            <div className={styles.composerBox} style={{ position: "relative" }}>
              {/* Mention Autocomplete Popup */}
              {matchingMentionMembers.length > 0 && (
                <div className={styles.mentionPopup}>
                  <div className={styles.mentionPopupHeader}>
                    <span>@ Ping Team Member</span>
                  </div>
                  <div className={styles.mentionList}>
                    {matchingMentionMembers.map((person, idx) => {
                      const isOwner =
                        person.role?.toLowerCase().includes("owner") ||
                        (person as any).type === "ADMIN";
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => handleInsertMention(person)}
                          className={`${styles.mentionItem} ${
                            activeMentionIndex === idx ? styles.mentionItemActive : ""
                          }`}
                        >
                          <div
                            className={styles.mentionAvatar}
                            style={{
                              background: getRoleGradient((person as any).type, person.role),
                            }}
                          >
                            {getInitials(person.name)}
                          </div>
                          <div className={styles.mentionItemInfo}>
                            <div className={styles.mentionItemName}>{person.name}</div>
                            <div className={styles.mentionItemMeta}>
                              <span
                                className={
                                  isOwner
                                    ? styles.rolePillAdmin
                                    : person.isStaff
                                    ? styles.rolePillStaff
                                    : styles.rolePillMember
                                }
                                style={{ fontSize: "0.68rem", padding: "1px 5px" }}
                              >
                                {isOwner ? "Owner" : person.role}
                              </span>
                              {person.department && <span>• {person.department}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={styles.composerBtn}
                title="Attach Files or Images"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>

              {/* Quick @ Mention Button */}
              <button
                type="button"
                onClick={() => {
                  setInputText((prev) =>
                    prev.endsWith(" ") || prev === "" ? `${prev}@` : `${prev} @`
                  );
                  setTimeout(() => textareaRef.current?.focus(), 10);
                }}
                className={styles.composerMentionBtn}
                title="Mention colleague (@)"
              >
                @
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  activeChannel?.type === "DIRECT_MESSAGE"
                    ? `Message @${activeChannel?.name}...`
                    : `Message #${activeChannel?.name || "channel"}...`
                }
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setActiveMentionIndex(0);
                }}
                onKeyDown={(e) => {
                  if (matchingMentionMembers.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveMentionIndex((prev) => (prev + 1) % matchingMentionMembers.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveMentionIndex(
                        (prev) => (prev - 1 + matchingMentionMembers.length) % matchingMentionMembers.length
                      );
                      return;
                    }
                    if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
                      e.preventDefault();
                      handleInsertMention(matchingMentionMembers[activeMentionIndex]);
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setInputText((prev) => prev + " ");
                      return;
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={styles.composerTextarea}
              />

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setShowEmojiPicker(showEmojiPicker === "composer" ? null : "composer")
                  }
                  className={styles.composerBtn}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                {showEmojiPicker === "composer" && (
                  <div className="absolute right-0 bottom-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-xl z-20 flex gap-2">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          setShowEmojiPicker(null);
                        }}
                        className="text-lg hover:scale-125 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isSending || (!inputText.trim() && pendingAttachments.length === 0)}
                className={styles.sendBtn}
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <span>
                This is an official announcement channel. Only staff and administrators can broadcast
                messages here.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* -------------------------------------------------------------
          RIGHT DRAWER (Directory, Files & Pinned)
      ------------------------------------------------------------- */}
      {drawerOpen && (
        <aside className={styles.rightDrawer}>
          <div className={styles.drawerTabs}>
            <button
              onClick={() => setActiveDrawerTab("members")}
              className={`${styles.drawerTab} ${
                activeDrawerTab === "members" ? styles.drawerTabActive : ""
              }`}
            >
              Directory ({staffDirectory.length + memberDirectory.length})
            </button>
            <button
              onClick={() => setActiveDrawerTab("files")}
              className={`${styles.drawerTab} ${
                activeDrawerTab === "files" ? styles.drawerTabActive : ""
              }`}
            >
              Files ({allChannelFiles.length})
            </button>
            <button
              onClick={() => setActiveDrawerTab("pinned")}
              className={`${styles.drawerTab} ${
                activeDrawerTab === "pinned" ? styles.drawerTabActive : ""
              }`}
            >
              Pinned ({pinnedMessages.length})
            </button>
          </div>

          <div className={styles.drawerContent}>
            {/* TAB 1: MEMBERS DIRECTORY */}
            {activeDrawerTab === "members" && (
              <>
                <div className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1 px-1">
                  Staff & Team ({staffDirectory.length})
                </div>
                {staffDirectory.length === 0 ? (
                  <div className="text-xs text-slate-400 px-1 py-1">No staff members listed</div>
                ) : (
                  staffDirectory.map((person) => (
                    <div key={person.id} className={styles.memberCard}>
                      <div className={styles.memberCardLeft}>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: getRoleGradient("STAFF", person.role) }}
                        >
                          {getInitials(person.name)}
                        </div>
                        <div>
                          <div className={styles.memberCardName}>{person.name}</div>
                          <div className={styles.memberCardRole}>{person.role}</div>
                        </div>
                      </div>
                      {person.id !== currentUser?.id && (
                        <button
                          onClick={() => handleStartDM(person)}
                          className={styles.dmActionBtn}
                          title="Direct Message"
                        >
                          <MessageSquare size={12} />
                          <span>Chat</span>
                        </button>
                      )}
                    </div>
                  ))
                )}

                <div className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-4 mb-1 px-1">
                  Community Members ({memberDirectory.length})
                </div>
                {memberDirectory.length === 0 ? (
                  <div className="text-xs text-slate-400 px-1 py-1">No community members listed</div>
                ) : (
                  memberDirectory.map((person) => (
                    <div key={person.id} className={styles.memberCard}>
                      <div className={styles.memberCardLeft}>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: getRoleGradient("MEMBER", person.role) }}
                        >
                          {getInitials(person.name)}
                        </div>
                        <div>
                          <div className={styles.memberCardName}>{person.name}</div>
                          <div className={styles.memberCardRole}>{person.role}</div>
                        </div>
                      </div>
                      {person.id !== currentUser?.id && (
                        <button
                          onClick={() => handleStartDM(person)}
                          className={styles.dmActionBtn}
                          title="Direct Message"
                        >
                          <MessageSquare size={12} />
                          <span>Chat</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB 2: CHANNEL SHARED FILES */}
            {activeDrawerTab === "files" && (
              <>
                <div className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 px-1">
                  Files Shared in this Channel
                </div>
                {allChannelFiles.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-8">
                    No files or attachments shared in this channel yet.
                  </div>
                ) : (
                  allChannelFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={file.fileName}
                      className={styles.fileAttachmentCard}
                    >
                      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                        {file.fileType.startsWith("image/") ? (
                          <ImageIcon size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>
                      <div className={styles.fileAttachmentInfo}>
                        <div className={styles.fileAttachmentName}>{file.fileName}</div>
                        <div className={styles.fileAttachmentMeta}>
                          {(file.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <Download size={14} className="text-slate-400 shrink-0" />
                    </a>
                  ))
                )}
              </>
            )}

            {/* TAB 3: PINNED MESSAGES */}
            {activeDrawerTab === "pinned" && (
              <>
                <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2 px-1">
                  Pinned Notices & Highlights
                </div>
                {pinnedMessages.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-8">
                    No pinned messages in this channel.
                  </div>
                ) : (
                  pinnedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/40 rounded-lg space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-800 dark:text-amber-300">{msg.senderName}</span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{msg.content}</p>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </aside>
      )}

      {/* -------------------------------------------------------------
          MODAL: CREATE CHANNEL
      ------------------------------------------------------------- */}
      {createModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Create New Channel</div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateChannel}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. finance-planning or events"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Topic / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="What is this channel about?"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Channel Type</label>
                <select
                  value={newChannelType}
                  onChange={(e) =>
                    setNewChannelType(e.target.value as "CHANNEL" | "ANNOUNCEMENT")
                  }
                  className={styles.formInput}
                >
                  <option value="CHANNEL">Standard Discussion Channel</option>
                  <option value="ANNOUNCEMENT">Announcement Channel (Read-Only for Members)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="privateCheck"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="privateCheck" className="text-sm text-slate-700 dark:text-slate-300 select-none">
                  Make Private (Only invited staff & members can access)
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: DIRECT MESSAGE SELECTOR
      ------------------------------------------------------------- */}
      {dmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>New Direct Message</div>
              <button
                onClick={() => setDmModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search staff or member name / role..."
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
                className={styles.formInput}
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredDirectory.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-4">
                  No staff or members found.
                </div>
              ) : (
                filteredDirectory.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleStartDM(p)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: getRoleGradient(p.type, p.role) }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {p.section}: {p.role}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                ))
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setDmModalOpen(false)}
                className={styles.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: IMAGE LIGHTBOX
      ------------------------------------------------------------- */}
      {previewImage && (
        <div
          className={styles.modalOverlay}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/70 text-white rounded-full p-2 hover:bg-black/90 shadow-lg"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
