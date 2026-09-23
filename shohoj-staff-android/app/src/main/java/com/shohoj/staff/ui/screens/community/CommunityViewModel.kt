package com.shohoj.staff.ui.screens.community

import android.app.Application
import android.content.Context
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.*
import com.shohoj.staff.util.SoundNotificationHelper
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class CommunityUiState(
    val isLoadingChannels: Boolean = false,
    val isLoadingMessages: Boolean = false,
    val channels: List<CommunityChannel> = emptyList(),
    val activeChannel: CommunityChannel? = null,
    val messages: List<CommunityMessage> = emptyList(),
    val staffDirectory: List<DirectoryPerson> = emptyList(),
    val memberDirectory: List<DirectoryPerson> = emptyList(),
    val tasks: List<TaskItem> = emptyList(),
    val replyingTo: CommunityMessage? = null,
    val isSending: Boolean = false,
    val isUploading: Boolean = false,
    val uploadProgressName: String? = null,
    val currentUserId: String = "",
    val currentUserName: String = "",
    val currentUserEmail: String = "",
    val error: String? = null
)

class CommunityViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val repo = app.communityRepository
    private val sessionManager = app.sessionManager

    private val _uiState = MutableStateFlow(
        CommunityUiState(
            currentUserId = sessionManager.getEmployee()?.id ?: sessionManager.employeeId ?: "",
            currentUserName = sessionManager.getEmployee()?.displayName ?: "Me",
            currentUserEmail = sessionManager.getEmployee()?.email ?: ""
        )
    )
    val uiState: StateFlow<CommunityUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null

    init {
        loadChannels()
        loadMembers()
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            val result = app.taskRepository.getTasks()
            result.onSuccess { taskList ->
                _uiState.value = _uiState.value.copy(tasks = taskList)
            }
        }
    }

    fun loadChannels(selectChannelId: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingChannels = true, error = null)
            val result = repo.getChannels()
            result.onSuccess { channels ->
                val active = if (selectChannelId != null) {
                    channels.find { it.id == selectChannelId } ?: channels.firstOrNull()
                } else {
                    _uiState.value.activeChannel ?: channels.firstOrNull()
                }
                _uiState.value = _uiState.value.copy(
                    isLoadingChannels = false,
                    channels = channels,
                    activeChannel = active
                )
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoadingChannels = false,
                    error = err.localizedMessage ?: "Failed to load channels"
                )
            }
        }
    }

    fun loadChannelsSilently() {
        viewModelScope.launch {
            val result = repo.getChannels()
            result.onSuccess { freshChannels ->
                val prevChannels = _uiState.value.channels
                val prevTotal = prevChannels.sumOf { it.unreadCount }
                val newTotal = freshChannels.sumOf { it.unreadCount }
                if (newTotal > prevTotal) {
                    val unreadChannel = freshChannels.find { it.unreadCount > 0 && it.unreadCount > (prevChannels.find { p -> p.id == it.id }?.unreadCount ?: 0) }
                    val lastMsg = unreadChannel?.lastMessage
                    val body = lastMsg?.content?.ifBlank { "You have new unread messages" } ?: "You have new unread messages"
                    unreadChannel?.let { ch ->
                        SoundNotificationHelper.showChatNotification(
                            context = app,
                            channel = ch,
                            messageContent = body,
                            senderName = lastMsg?.senderName,
                            isMention = false
                        )
                    }
                }
                _uiState.value = _uiState.value.copy(channels = freshChannels)
            }
        }
    }

    fun markChannelAsRead(channelId: String) {
        // Optimistically zero out unread in UI state
        _uiState.value = _uiState.value.copy(
            channels = _uiState.value.channels.map { ch ->
                if (ch.id == channelId) ch.copy(unreadCount = 0, hasUnread = false) else ch
            }
        )
        viewModelScope.launch {
            repo.markChannelRead(channelId)
        }
    }

    fun loadMembers() {
        viewModelScope.launch {
            val result = repo.getMembers()
            result.onSuccess { dir ->
                _uiState.value = _uiState.value.copy(
                    staffDirectory = dir.staff,
                    memberDirectory = dir.members,
                    currentUserId = dir.currentUser?.id ?: _uiState.value.currentUserId,
                    currentUserName = dir.currentUser?.name ?: _uiState.value.currentUserName,
                    currentUserEmail = dir.currentUser?.email ?: _uiState.value.currentUserEmail
                )
            }
        }
    }

    fun setActiveChannel(channel: CommunityChannel) {
        _uiState.value = _uiState.value.copy(
            activeChannel = channel,
            messages = emptyList(),
            replyingTo = null
        )
        markChannelAsRead(channel.id)
        loadMessages(channel.id)
    }

    fun loadMessages(channelId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingMessages = true, error = null)
            val result = repo.getMessages(channelId)
            result.onSuccess { msgs ->
                _uiState.value = _uiState.value.copy(
                    isLoadingMessages = false,
                    messages = msgs
                )
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoadingMessages = false,
                    error = err.localizedMessage ?: "Failed to load messages"
                )
            }
        }
    }

    /**
     * Start background polling when chat screen is in foreground.
     * Polls every 3.5 seconds. Automatically cancels previous job.
     */
    fun startPolling(channelId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(3500)
                val result = repo.getMessages(channelId)
                result.onSuccess { fresh ->
                    val oldMessages = _uiState.value.messages
                    if (fresh != oldMessages) {
                        val oldIds = oldMessages.map { it.id }.toSet()
                        val myId = _uiState.value.currentUserId
                        val myName = _uiState.value.currentUserName.trim().lowercase()
                        val newIncoming = fresh.filter { it.id !in oldIds && it.senderId != myId }

                        if (newIncoming.isNotEmpty()) {
                            val hasMention = newIncoming.any { msg ->
                                val text = msg.content.lowercase()
                                myName.isNotBlank() && (
                                    text.contains("@$myName") ||
                                    text.contains("@${myName.split(" ").first()}")
                                )
                            }

                            SoundNotificationHelper.playNotificationSound(app, isMention = hasMention)

                            val channelTitle = _uiState.value.activeChannel?.name ?: "Chat"
                            val latestMsg = newIncoming.last()
                            val isLatestMention = hasMention && (
                                latestMsg.content.lowercase().contains("@$myName") ||
                                (myName.isNotBlank() && latestMsg.content.lowercase().contains("@${myName.split(" ").first()}"))
                            )

                            val notifTitle = if (isLatestMention) {
                                "Mentioned by ${latestMsg.senderName} in #$channelTitle"
                            } else if (_uiState.value.activeChannel?.type == "DIRECT_MESSAGE") {
                                latestMsg.senderName
                            } else {
                                "${latestMsg.senderName} in #$channelTitle"
                            }

                            val notifBody = latestMsg.content.ifBlank {
                                if (latestMsg.attachments.isNotEmpty()) "Sent an attachment" else "New message"
                            }

                            SoundNotificationHelper.showNotification(
                                context = app,
                                title = notifTitle,
                                message = notifBody,
                                isMention = isLatestMention
                            )
                        }

                        _uiState.value = _uiState.value.copy(messages = fresh)
                    }
                }
            }
        }
    }

    /**
     * Stop background polling when chat screen is paused or popped.
     */
    fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    fun setReplyingTo(message: CommunityMessage?) {
        _uiState.value = _uiState.value.copy(replyingTo = message)
    }

    fun sendMessage(channelId: String, text: String, attachments: List<CommunityAttachment> = emptyList()) {
        if (text.isBlank() && attachments.isEmpty()) return

        val replyToId = _uiState.value.replyingTo?.id

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true)
            val result = repo.sendMessage(
                channelId = channelId,
                content = text.trim(),
                attachments = attachments,
                replyToId = replyToId
            )
            result.onSuccess { newMsg ->
                _uiState.value = _uiState.value.copy(
                    isSending = false,
                    replyingTo = null,
                    messages = _uiState.value.messages + newMsg
                )
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isSending = false,
                    error = err.localizedMessage ?: "Failed to send message"
                )
            }
        }
    }

    fun uploadAndSendAttachment(context: Context, channelId: String, uri: Uri, caption: String = "") {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isUploading = true,
                uploadProgressName = "Uploading attachment..."
            )
            val uploadRes = repo.uploadAttachment(context, uri)
            uploadRes.onSuccess { data ->
                val attachment = CommunityAttachment(
                    fileName = data.fileName,
                    fileUrl = data.fileUrl,
                    fileType = data.fileType,
                    fileSize = data.fileSize
                )
                _uiState.value = _uiState.value.copy(isUploading = false, uploadProgressName = null)
                sendMessage(channelId, caption, listOf(attachment))
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isUploading = false,
                    uploadProgressName = null,
                    error = "Upload failed: ${err.localizedMessage}"
                )
            }
        }
    }

    fun toggleReaction(messageId: String, emoji: String) {
        viewModelScope.launch {
            val result = repo.toggleReaction(messageId, emoji)
            result.onSuccess {
                // Refresh messages to show updated reactions
                _uiState.value.activeChannel?.id?.let { channelId ->
                    val refreshRes = repo.getMessages(channelId)
                    refreshRes.onSuccess { msgs ->
                        _uiState.value = _uiState.value.copy(messages = msgs)
                    }
                }
            }
        }
    }

    fun togglePin(messageId: String) {
        viewModelScope.launch {
            val result = repo.togglePin(messageId)
            result.onSuccess {
                _uiState.value.activeChannel?.id?.let { channelId ->
                    val refreshRes = repo.getMessages(channelId)
                    refreshRes.onSuccess { msgs ->
                        _uiState.value = _uiState.value.copy(messages = msgs)
                    }
                }
            }
        }
    }

    fun startDirectMessage(
        person: DirectoryPerson,
        onSuccess: (CommunityChannel) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingChannels = true)
            val result = repo.createOrGetDirectMessage(
                targetUserId = person.id,
                targetUserName = person.name,
                targetUserRole = person.role
            )
            result.onSuccess { ch ->
                _uiState.value = _uiState.value.copy(isLoadingChannels = false)
                loadChannels(ch.id)
                onSuccess(ch)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoadingChannels = false,
                    error = err.localizedMessage ?: "Failed to start direct message"
                )
            }
        }
    }

    fun createChannel(
        name: String,
        topic: String?,
        type: String,
        isPrivate: Boolean,
        onSuccess: (CommunityChannel) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingChannels = true)
            val result = repo.createChannel(name, topic, type, isPrivate)
            result.onSuccess { ch ->
                _uiState.value = _uiState.value.copy(isLoadingChannels = false)
                loadChannels(ch.id)
                onSuccess(ch)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoadingChannels = false,
                    error = err.localizedMessage ?: "Failed to create channel"
                )
            }
        }
    }

    val baseUrl: String
        get() = sessionManager.baseUrl

    fun getEmployeeId(): String? = sessionManager.employeeId ?: sessionManager.getEmployee()?.employeeId
    fun getEmployeeDbId(): String? = sessionManager.getEmployee()?.id
    fun getSessionEmail(): String? = sessionManager.getEmployee()?.email

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    override fun onCleared() {
        super.onCleared()
        stopPolling()
    }
}
