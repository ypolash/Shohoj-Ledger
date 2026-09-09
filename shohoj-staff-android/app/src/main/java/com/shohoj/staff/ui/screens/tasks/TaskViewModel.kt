package com.shohoj.staff.ui.screens.tasks

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.TaskItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TaskUiState(
    val isLoading: Boolean = false,
    val tasks: List<TaskItem> = emptyList(),
    val filterStatus: String = "ALL", // "ALL", "Pending", "In Progress", "Completed"
    val updatingTaskId: String? = null,
    val successMessage: String? = null,
    val error: String? = null
)

class TaskViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val taskRepo = app.taskRepository

    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    init {
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = taskRepo.getTasks()

            result.fold(
                onSuccess = { list ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        tasks = list
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch tasks"
                    )
                }
            )
        }
    }

    fun setFilter(status: String) {
        _uiState.value = _uiState.value.copy(filterStatus = status)
    }

    fun updateStatus(taskId: String, newStatus: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(updatingTaskId = taskId, error = null)
            val result = taskRepo.updateTaskStatus(taskId, newStatus)

            result.fold(
                onSuccess = { updated ->
                    val newList = _uiState.value.tasks.map { if (it.id == taskId) updated else it }
                    _uiState.value = _uiState.value.copy(
                        updatingTaskId = null,
                        tasks = newList,
                        successMessage = "Task updated to $newStatus"
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        updatingTaskId = null,
                        error = ex.localizedMessage ?: "Failed to update status"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(successMessage = null, error = null)
    }
}
