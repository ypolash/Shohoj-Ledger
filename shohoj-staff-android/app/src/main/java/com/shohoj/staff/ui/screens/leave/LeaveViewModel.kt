package com.shohoj.staff.ui.screens.leave

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.LeaveBalance
import com.shohoj.staff.data.model.LeaveItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class LeaveUiState(
    val isLoading: Boolean = false,
    val leaves: List<LeaveItem> = emptyList(),
    val balance: LeaveBalance = LeaveBalance(),
    val showApplySheet: Boolean = false,
    val isSubmitting: Boolean = false,
    val applyType: String = "CASUAL",
    val applyStartDate: String = "",
    val applyEndDate: String = "",
    val applyReason: String = "",
    val successMessage: String? = null,
    val error: String? = null
)

class LeaveViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val leaveRepo = app.leaveRepository

    private val _uiState = MutableStateFlow(LeaveUiState())
    val uiState: StateFlow<LeaveUiState> = _uiState.asStateFlow()

    init {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        _uiState.value = _uiState.value.copy(applyStartDate = todayStr, applyEndDate = todayStr)
        loadLeaves()
    }

    fun loadLeaves() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = leaveRepo.getLeaves()

            result.fold(
                onSuccess = { list ->
                    val balance = leaveRepo.calculateBalance(list)
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        leaves = list,
                        balance = balance
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch leaves"
                    )
                }
            )
        }
    }

    fun showApplySheet(show: Boolean) {
        _uiState.value = _uiState.value.copy(showApplySheet = show, error = null, successMessage = null)
    }

    fun onTypeChange(type: String) {
        _uiState.value = _uiState.value.copy(applyType = type)
    }

    fun onStartDateChange(date: String) {
        _uiState.value = _uiState.value.copy(applyStartDate = date)
    }

    fun onEndDateChange(date: String) {
        _uiState.value = _uiState.value.copy(applyEndDate = date)
    }

    fun onReasonChange(reason: String) {
        _uiState.value = _uiState.value.copy(applyReason = reason)
    }

    fun submitLeaveApplication() {
        val state = _uiState.value
        if (state.applyReason.isBlank()) {
            _uiState.value = state.copy(error = "Please provide a reason for leave")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSubmitting = true, error = null)

            val result = leaveRepo.applyLeave(
                type = state.applyType,
                startDate = state.applyStartDate,
                endDate = state.applyEndDate,
                reason = state.applyReason
            )

            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        showApplySheet = false,
                        applyReason = "",
                        successMessage = "Leave application submitted successfully!"
                    )
                    loadLeaves()
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = ex.localizedMessage ?: "Failed to submit leave request"
                    )
                }
            )
        }
    }
}
