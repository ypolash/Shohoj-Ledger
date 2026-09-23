package com.shohoj.staff.data.repository

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
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
            var mimeType = contentResolver.getType(uri)

            var fileName = "attachment_${System.currentTimeMillis()}"
            try {
                contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (nameIndex != -1) {
                            val queriedName = cursor.getString(nameIndex)
                            if (!queriedName.isNullOrBlank()) {
                                fileName = queriedName
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                // Fallback to default name if cursor query fails
            }

            // Infer or complete MIME type and file extension
            if (mimeType.isNullOrBlank() || mimeType == "application/octet-stream") {
                val ext = fileName.substringAfterLast('.', "").lowercase()
                if (ext.isNotBlank()) {
                    val guessedMime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext)
                    if (!guessedMime.isNullOrBlank()) {
                        mimeType = guessedMime
                    }
                }
            }

            if (!fileName.contains(".")) {
                val derivedExt = when {
                    mimeType?.startsWith("image/png") == true -> ".png"
                    mimeType?.startsWith("image/jpeg") == true || mimeType?.startsWith("image/jpg") == true -> ".jpg"
                    mimeType?.startsWith("image/webp") == true -> ".webp"
                    mimeType?.startsWith("image/gif") == true -> ".gif"
                    mimeType?.startsWith("application/pdf") == true -> ".pdf"
                    else -> ".jpg" // Default media to jpg if image
                }
                fileName += derivedExt
            }

            val finalMime = mimeType?.takeIf { it.isNotBlank() } ?: "application/octet-stream"

            val inputStream = contentResolver.openInputStream(uri)
                ?: return@withContext Result.failure(Exception("Cannot open file stream for selected item"))
            val bytes = inputStream.use { it.readBytes() }

            if (bytes.isEmpty()) {
                return@withContext Result.failure(Exception("Selected file is empty"))
            }

            val requestBody = bytes.toRequestBody(finalMime.toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("file", fileName, requestBody)

            val response = apiClient.getService().uploadCommunityAttachment(part)
            if (response.isSuccessful && response.body() != null) {
                val uploadBody = response.body()!!
                if (uploadBody.success) {
                    Result.success(uploadBody)
                } else {
                    Result.failure(Exception(uploadBody.error ?: "Upload returned failure"))
                }
            } else {
                val err = response.errorBody()?.string() ?: "Failed to upload file (HTTP ${response.code()})"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
