package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.model.LeaveApplyRequest
import com.shohoj.staff.data.model.LeaveBalance
import com.shohoj.staff.data.model.LeaveItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class LeaveRepository(
    private val apiClient: ApiClient
) {
    suspend fun getLeaves(): Result<List<LeaveItem>> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().getLeaves()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.leaves)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to load leaves (${response.code()})"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun applyLeave(
        type: String,
        startDate: String,
        endDate: String,
        reason: String
    ): Result<LeaveItem> = withContext(Dispatchers.IO) {
        try {
            val request = LeaveApplyRequest(
                type = type,
                startDate = startDate,
                endDate = endDate,
                reason = reason
            )
            val response = apiClient.getService().applyLeave(request)
            if (response.isSuccessful && response.body()?.leave != null) {
                Result.success(response.body()!!.leave!!)
            } else {
                val err = response.body()?.error ?: response.errorBody()?.string() ?: "Failed to submit leave"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun calculateBalance(leaves: List<LeaveItem>): LeaveBalance {
        val approvedLeaves = leaves.filter { it.status == "APPROVED" }
        var casualUsed = 0
        var sickUsed = 0
        var annualUsed = 0

        for (leave in approvedLeaves) {
            when (leave.type.uppercase()) {
                "CASUAL" -> casualUsed += 1
                "SICK" -> sickUsed += 1
                "ANNUAL" -> annualUsed += 1
            }
        }

        return LeaveBalance(
            casualTotal = 14,
            casualUsed = casualUsed,
            sickTotal = 14,
            sickUsed = sickUsed,
            annualTotal = 15,
            annualUsed = annualUsed
        )
    }
}
