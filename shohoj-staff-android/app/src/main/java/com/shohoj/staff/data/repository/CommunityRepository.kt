package com.shohoj.staff.data.repository

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class CommunityRepository(
    private val apiClient: ApiClient
) {
    suspend fun getChannels(): Result<List<CommunityChannel>> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().getCommunityChannels()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.channels)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to fetch channels"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createChannel(
        name: String,
        topic: String?,
        type: String,
        isPrivate: Boolean
    ): Result<CommunityChannel> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().createCommunityChannel(
                CreateChannelRequest(name, topic, type, isPrivate)
            )
            if (response.isSuccessful && response.body()?.channel != null) {
                Result.success(response.body()!!.channel!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to create channel"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markChannelRead(channelId: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().markChannelRead(channelId)
            Result.success(response.isSuccessful)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMembers(): Result<CommunityDirectoryResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().getCommunityMembers()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to fetch members"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMessages(
        channelId: String,
        since: String? = null
    ): Result<List<CommunityMessage>> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().getCommunityMessages(channelId, since)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.messages)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to fetch messages"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendMessage(
        channelId: String,
        content: String,
        attachments: List<CommunityAttachment> = emptyList(),
        replyToId: String? = null
    ): Result<CommunityMessage> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().sendCommunityMessage(
                SendMessageRequest(channelId, content, attachments, replyToId)
            )
            if (response.isSuccessful && response.body()?.message != null) {
                Result.success(response.body()!!.message!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to send message"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createOrGetDirectMessage(
        targetUserId: String,
        targetUserName: String,
        targetUserRole: String
    ): Result<CommunityChannel> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().createOrGetDirectMessage(
                CreateDirectMessageRequest(targetUserId, targetUserName, targetUserRole)
            )
            if (response.isSuccessful && response.body()?.channel != null) {
                Result.success(response.body()!!.channel!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to start direct message"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleReaction(
        messageId: String,
        emoji: String
    ): Result<SimpleActionResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().toggleMessageReaction(messageId, ReactionRequest(emoji))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to toggle reaction"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun togglePin(
        messageId: String
    ): Result<SimpleActionResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().toggleMessagePin(messageId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to toggle pin"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadAttachment(
        context: Context,
        uri: Uri
    ): Result<CommunityUploadResponse> = withContext(Dispatchers.IO) {
        try {
            val contentResolver = context.contentResolver
            val mimeType = contentResolver.getType(uri) ?: "application/octet-stream"

            var fileName = "attachment_${System.currentTimeMillis()}"
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (nameIndex != -1) {
                        fileName = cursor.getString(nameIndex)
                    }
                }
            }

            val inputStream = contentResolver.openInputStream(uri)
                ?: return@withContext Result.failure(Exception("Cannot open file stream"))
            val bytes = inputStream.use { it.readBytes() }

            val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("file", fileName, requestBody)

            val response = apiClient.getService().uploadCommunityAttachment(part)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to upload file"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
