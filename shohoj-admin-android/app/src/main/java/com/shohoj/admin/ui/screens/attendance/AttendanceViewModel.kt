package com.shohoj.admin.ui.screens.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.model.AttendanceRosterResponse
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AttendanceUiState(
    val isLoading: Boolean = true,
    val selectedStatus: String = "ALL",
    val attendanceData: AttendanceRosterResponse? = null,
    val errorMessage: String? = null
)

class AttendanceViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadAttendance()
    }

    fun onStatusFilterChange(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadAttendance()
    }

    fun loadAttendance() {
        val status = if (_uiState.value.selectedStatus == "ALL") null else _uiState.value.selectedStatus

        viewModelScope.launch {
            val result = repository.getAttendanceRoster(status = status)
            result.fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        attendanceData = data,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load attendance roster."
                    )
                }
            )
        }
    }
}
