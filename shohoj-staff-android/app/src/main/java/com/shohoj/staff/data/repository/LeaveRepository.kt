package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class LeaveRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager? = null
) {
    suspend fun getLeaveData(): Result<LeaveListResponse> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager?.employeeId ?: sessionManager?.getEmployee()?.employeeId ?: sessionManager?.getEmployee()?.id
            
            // Try mobile endpoint first
            val mobileResp = apiClient.getService().getMobileLeaves(empId)
            if (mobileResp.isSuccessful && mobileResp.body() != null) {
                return@withContext Result.success(mobileResp.body()!!)
            }

            // Fallback to standard ess endpoint
            val response = apiClient.getService().getLeaves(empId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to load leaves (${response.code()})"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLeaves(): Result<List<LeaveItem>> = withContext(Dispatchers.IO) {
        getLeaveData().map { it.leaves }
    }

    suspend fun applyLeave(
        type: String,
        leaveTypeId: String? = null,
        startDate: String,
        endDate: String,
        reason: String
    ): Result<LeaveApplyResponse> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager?.employeeId ?: sessionManager?.getEmployee()?.employeeId ?: sessionManager?.getEmployee()?.id
            val request = LeaveApplyRequest(
                type = type,
                leaveTypeId = leaveTypeId,
                startDate = startDate,
                endDate = endDate,
                reason = reason,
                employeeId = empId
            )

            // 1. Try mobile dedicated leave endpoint
            val mobileResponse = apiClient.getService().applyLeaveMobile(request)
            if (mobileResponse.isSuccessful && mobileResponse.body() != null) {
                return@withContext Result.success(mobileResponse.body()!!)
            }

            // 2. Try standard ESS endpoint as fallback
            val response = apiClient.getService().applyLeave(request)
            if (response.isSuccessful && response.body() != null) {
                return@withContext Result.success(response.body()!!)
            }

            val err = mobileResponse.body()?.error
                ?: response.body()?.error
                ?: mobileResponse.errorBody()?.string()
                ?: response.errorBody()?.string()
                ?: "Failed to submit leave application"
            Result.failure(Exception(err))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun endBreak(leaveId: String? = null): Result<EndBreakResponse> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager?.employeeId ?: sessionManager?.getEmployee()?.employeeId ?: sessionManager?.getEmployee()?.id
            val request = EndBreakRequest(
                action = "END_BREAK",
                leaveId = leaveId,
                employeeId = empId
            )
            val response = apiClient.getService().endBreak(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.body()?.error ?: response.errorBody()?.string() ?: "Failed to end active break"
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
