package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class TaskItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("status") val status: String = "Pending", // "Pending", "In Progress", "Completed", "Blocked"
    @SerializedName("priority") val priority: String? = "Medium", // "Low", "Medium", "High", "Urgent"
    @SerializedName("dueDate") val dueDate: String? = null,
    @SerializedName("assignedToEmployeeId") val assignedToEmployeeId: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class TaskListResponse(
    @SerializedName("tasks") val tasks: List<TaskItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class TaskStatusUpdateRequest(
    @SerializedName("status") val status: String
)
