package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.TaskItem
import com.shohoj.staff.data.model.TaskStatusUpdateRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TaskRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager
) {
    suspend fun getTasks(): Result<List<TaskItem>> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            // 1. Try ESS route
            val essRes = service.getTasks()
            if (essRes.isSuccessful && essRes.body() != null) {
                return@withContext Result.success(essRes.body()!!.tasks)
            }

            // 2. Fallback to /api/mobile/tasks
            val empId = sessionManager.employeeId ?: return@withContext Result.failure(Exception("Not logged in"))
            val mobRes = service.getMobileTasks(empId)
            if (mobRes.isSuccessful && mobRes.body() != null) {
                Result.success(mobRes.body()!!)
            } else {
                val err = mobRes.errorBody()?.string() ?: "Failed to fetch tasks"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTaskStatus(taskId: String, newStatus: String): Result<TaskItem> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val request = TaskStatusUpdateRequest(status = newStatus)
            
            // 1. Try mobile status endpoint
            val response = service.updateTaskStatus(taskId = taskId, request = request)
            if (response.isSuccessful && response.body() != null) {
                return@withContext Result.success(response.body()!!)
            }

            // 2. Fallback to ESS endpoint
            val essResponse = service.updateEssTaskStatus(taskId = taskId, request = request)
            if (essResponse.isSuccessful && essResponse.body() != null) {
                return@withContext Result.success(essResponse.body()!!)
            }

            val err = response.errorBody()?.string() ?: essResponse.errorBody()?.string() ?: "Failed to update task status"
            Result.failure(Exception(err))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTaskChecklist(taskId: String, checklist: com.shohoj.staff.data.model.TaskChecklist, newStatus: String? = null): Result<TaskItem> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val request = TaskStatusUpdateRequest(status = newStatus, checklist = checklist)

            // 1. Try mobile status endpoint
            val response = service.updateTaskStatus(taskId = taskId, request = request)
            if (response.isSuccessful && response.body() != null) {
                return@withContext Result.success(response.body()!!)
            }

            // 2. Fallback to ESS endpoint
            val essResponse = service.updateEssTaskStatus(taskId = taskId, request = request)
            if (essResponse.isSuccessful && essResponse.body() != null) {
                return@withContext Result.success(essResponse.body()!!)
            }

            val err = response.errorBody()?.string() ?: essResponse.errorBody()?.string() ?: "Failed to update checklist"
            Result.failure(Exception(err))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addTaskComment(taskId: String, text: String): Result<TaskItem> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager.employeeId
            val emp = sessionManager.getEmployee()
            val author = emp?.let { "${it.firstName} ${it.lastName}".trim() }.takeIf { !it.isNullOrBlank() } ?: empId ?: "Staff"
            val response = apiClient.getService().addTaskComment(
                taskId = taskId,
                request = com.shohoj.staff.data.model.TaskCommentRequest(
                    text = text,
                    author = author,
                    employeeId = empId
                )
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to post comment"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
