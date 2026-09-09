package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.model.AnnouncementItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AnnouncementRepository(
    private val apiClient: ApiClient
) {
    suspend fun getAnnouncements(): Result<List<AnnouncementItem>> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().getAnnouncements()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.announcements)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to fetch announcements"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
