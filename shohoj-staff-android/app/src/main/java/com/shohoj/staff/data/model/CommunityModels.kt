package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

// --- Channel Models ---

data class ChannelMember(
    @SerializedName("userId") val userId: String,
    @SerializedName("userName") val userName: String,
    @SerializedName("userRole") val userRole: String,
    @SerializedName("userAvatar") val userAvatar: String? = null
)

data class CommunityChannel(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("rawName") val rawName: String? = null,
    @SerializedName("topic") val topic: String? = null,
    @SerializedName("type") val type: String = "CHANNEL", // "CHANNEL", "ANNOUNCEMENT", "DIRECT_MESSAGE"
    @SerializedName("isPrivate") val isPrivate: Boolean = false,
    @SerializedName("memberCount") val memberCount: Int = 0,
    @SerializedName("messageCount") val messageCount: Int = 0,
    @SerializedName("hasUnread") val hasUnread: Boolean = false,
    @SerializedName("dmParticipant") val dmParticipant: ChannelMember? = null
)

data class ChannelListResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("channels") val channels: List<CommunityChannel> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class ChannelDetailResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("channel") val channel: CommunityChannel? = null,
    @SerializedName("error") val error: String? = null
)

// --- Message Models ---

data class CommunityAttachment(
    @SerializedName("id") val id: String? = null,
    @SerializedName("fileName") val fileName: String,
    @SerializedName("fileUrl") val fileUrl: String,
    @SerializedName("fileType") val fileType: String,
    @SerializedName("fileSize") val fileSize: Long = 0
)

data class CommunityReaction(
    @SerializedName("id") val id: String? = null,
    @SerializedName("userId") val userId: String,
    @SerializedName("userName") val userName: String,
    @SerializedName("emoji") val emoji: String
)

data class MessageReplyInfo(
    @SerializedName("id") val id: String,
    @SerializedName("senderName") val senderName: String,
    @SerializedName("content") val content: String
)

data class CommunityMessage(
    @SerializedName("id") val id: String,
    @SerializedName("channelId") val channelId: String,
    @SerializedName("senderId") val senderId: String,
    @SerializedName("senderName") val senderName: String,
    @SerializedName("senderRole") val senderRole: String = "Member",
    @SerializedName("senderType") val senderType: String = "MEMBER", // "ADMIN", "STAFF", "MEMBER"
    @SerializedName("senderAvatar") val senderAvatar: String? = null,
    @SerializedName("content") val content: String,
    @SerializedName("isPinned") val isPinned: Boolean = false,
    @SerializedName("replyToId") val replyToId: String? = null,
    @SerializedName("replyTo") val replyTo: MessageReplyInfo? = null,
    @SerializedName("attachments") val attachments: List<CommunityAttachment> = emptyList(),
    @SerializedName("reactions") val reactions: List<CommunityReaction> = emptyList(),
    @SerializedName("createdAt") val createdAt: String
)

data class MessageListResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("messages") val messages: List<CommunityMessage> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class SendMessageResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("message") val message: CommunityMessage? = null,
    @SerializedName("error") val error: String? = null
)

// --- Directory & Members Models ---

data class CurrentUserProfile(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("role") val role: String = "Member",
    @SerializedName("type") val type: String = "MEMBER",
    @SerializedName("email") val email: String? = null
)

data class DirectoryPerson(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("role") val role: String = "Member",
    @SerializedName("type") val type: String = "MEMBER", // "STAFF", "MEMBER"
    @SerializedName("email") val email: String? = null,
    @SerializedName("department") val department: String? = null,
    @SerializedName("phone") val phone: String? = null
)

data class CommunityDirectoryResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("currentUser") val currentUser: CurrentUserProfile? = null,
    @SerializedName("staff") val staff: List<DirectoryPerson> = emptyList(),
    @SerializedName("members") val members: List<DirectoryPerson> = emptyList(),
    @SerializedName("error") val error: String? = null
)

// --- Request DTOs ---

data class SendMessageRequest(
    @SerializedName("channelId") val channelId: String,
    @SerializedName("content") val content: String,
    @SerializedName("attachments") val attachments: List<CommunityAttachment> = emptyList(),
    @SerializedName("replyToId") val replyToId: String? = null
)

data class ReactionRequest(
    @SerializedName("emoji") val emoji: String
)

data class CreateChannelRequest(
    @SerializedName("name") val name: String,
    @SerializedName("topic") val topic: String? = null,
    @SerializedName("type") val type: String = "CHANNEL",
    @SerializedName("isPrivate") val isPrivate: Boolean = false
)

data class CreateDirectMessageRequest(
    @SerializedName("targetUserId") val targetUserId: String,
    @SerializedName("targetUserName") val targetUserName: String,
    @SerializedName("targetUserRole") val targetUserRole: String = "Member"
)

data class CommunityUploadResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("fileUrl") val fileUrl: String,
    @SerializedName("fileName") val fileName: String,
    @SerializedName("fileType") val fileType: String,
    @SerializedName("fileSize") val fileSize: Long,
    @SerializedName("error") val error: String? = null
)

data class SimpleActionResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("action") val action: String? = null,
    @SerializedName("isPinned") val isPinned: Boolean? = null,
    @SerializedName("error") val error: String? = null
)
