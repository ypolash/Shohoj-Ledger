package com.shohoj.staff.ui.screens.leave

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class LeaveUiState(
    val isLoading: Boolean = false,
    val leaves: List<LeaveItem> = emptyList(),
    val balance: LeaveBalance = LeaveBalance(),
    val balances: List<LeaveCategoryBalance> = emptyList(),
    val leaveTypes: List<LeaveTypeItem> = emptyList(),
    val activeBreak: ActiveBreakInfo? = null,
    val hasActiveBreak: Boolean = false,
    val activeBreakCountdown: String = "",
    val activeBreakStatusText: String = "",
    val activeBreakStatusColor: String = "EMERALD", // "EMERALD", "AMBER", "ROSE"
    val activeBreakFineText: String? = null,
    val isEndingBreak: Boolean = false,
    val showApplySheet: Boolean = false,
    val isSubmitting: Boolean = false,
    val applyType: String = "CASUAL",
    val applyLeaveTypeId: String? = null,
    val selectedLeaveTypeItem: LeaveTypeItem? = null,
    val isShortBreakSelected: Boolean = false,
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

    private var timerJob: Job? = null

    init {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        _uiState.value = _uiState.value.copy(applyStartDate = todayStr, applyEndDate = todayStr)
        loadLeaves()
    }

    fun loadLeaves() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = leaveRepo.getLeaveData()

            result.fold(
                onSuccess = { response: LeaveListResponse ->
                    val leavesList = response.leaves
                    val balance = leaveRepo.calculateBalance(leavesList)
                    val dynamicBalances = response.balances
                    val dynamicTypes = response.leaveTypes
                    val activeBreak = response.activeBreak

                    val defaultType = if (dynamicTypes.isNotEmpty()) {
                        dynamicTypes.first().name
                    } else if (dynamicBalances.isNotEmpty()) {
                        dynamicBalances.first().name
                    } else {
                        _uiState.value.applyType
                    }

                    val defaultItem = dynamicTypes.firstOrNull { it.name.equals(defaultType, ignoreCase = true) }
                    val isShort = defaultItem?.isShortBreak == true ||
                            defaultItem?.quotaModel == "SHORT_BREAK" ||
                            defaultType.contains("Break", ignoreCase = true)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        leaves = leavesList,
                        balance = balance,
                        balances = dynamicBalances,
                        leaveTypes = dynamicTypes,
                        activeBreak = activeBreak,
                        hasActiveBreak = activeBreak != null,
                        applyType = defaultType,
                        applyLeaveTypeId = defaultItem?.id,
                        selectedLeaveTypeItem = defaultItem,
                        isShortBreakSelected = isShort
                    )

                    startBreakCountdownTicker(activeBreak)
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

    private fun startBreakCountdownTicker(breakInfo: ActiveBreakInfo?) {
        timerJob?.cancel()
        if (breakInfo == null) {
            _uiState.value = _uiState.value.copy(
                activeBreakCountdown = "",
                activeBreakStatusText = "",
                activeBreakFineText = null
            )
            return
        }

        timerJob = viewModelScope.launch {
            while (isActive) {
                val now = System.currentTimeMillis()
                val targetEnd = parseIsoDate(breakInfo.targetEndTime)
                    ?: (parseIsoDate(breakInfo.startTime)?.plus(breakInfo.durationMinutes * 60 * 1000L))
                    ?: (now + (breakInfo.remainingSeconds * 1000L))

                val graceEnd = parseIsoDate(breakInfo.graceEndTime)
                    ?: (targetEnd + (breakInfo.gracePeriodMinutes * 60 * 1000L))

                if (now < targetEnd) {
                    val remSec = maxOf(0L, (targetEnd - now) / 1000L)
                    val mins = remSec / 60
                    val secs = remSec % 60
                    _uiState.value = _uiState.value.copy(
                        activeBreakCountdown = String.format("%02d:%02d", mins, secs),
                        activeBreakStatusText = "Break in Progress",
                        activeBreakStatusColor = "EMERALD",
                        activeBreakFineText = null
                    )
                } else if (now <= graceEnd) {
                    val graceRemSec = maxOf(0L, (graceEnd - now) / 1000L)
                    val mins = graceRemSec / 60
                    val secs = graceRemSec % 60
                    _uiState.value = _uiState.value.copy(
                        activeBreakCountdown = String.format("%02d:%02d", mins, secs),
                        activeBreakStatusText = "Grace Period Tolerance",
                        activeBreakStatusColor = "AMBER",
                        activeBreakFineText = "Return soon to avoid ৳${breakInfo.fineAmount.toInt()} fine"
                    )
                } else {
                    val overstaySec = (now - graceEnd) / 1000L
                    val mins = overstaySec / 60
                    val secs = overstaySec % 60
                    val overstayMins = Math.ceil(overstaySec / 60.0).toInt().coerceAtLeast(1)
                    val fine = if (breakInfo.fineType == "PER_MINUTE") {
                        breakInfo.fineAmount * overstayMins
                    } else {
                        breakInfo.fineAmount
                    }
                    _uiState.value = _uiState.value.copy(
                        activeBreakCountdown = String.format("+%02d:%02d", mins, secs),
                        activeBreakStatusText = "OVERSTAYED by ${overstayMins}m",
                        activeBreakStatusColor = "ROSE",
                        activeBreakFineText = "Penalty Fine: ৳${fine.toInt()}"
                    )
                }

                delay(1000L)
            }
        }
    }

    private fun parseIsoDate(iso: String?): Long? {
        if (iso.isNullOrBlank()) return null
        return try {
            val clean = iso.replace("Z", "+0000").replace("+00:00", "+0000")
            val formats = listOf(
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS", Locale.US),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US),
                SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
            )
            for (f in formats) {
                try {
                    val d = f.parse(clean)
                    if (d != null) return d.time
                } catch (_: Exception) {}
            }
            null
        } catch (e: Exception) {
            null
        }
    }

    fun showApplySheet(show: Boolean) {
        _uiState.value = _uiState.value.copy(showApplySheet = show, error = null, successMessage = null)
    }

    fun onTypeChange(type: String) {
        val selectedItem = _uiState.value.leaveTypes.firstOrNull { it.name.equals(type, ignoreCase = true) }
        val isShort = selectedItem?.isShortBreak == true ||
                selectedItem?.quotaModel == "SHORT_BREAK" ||
                type.contains("Break", ignoreCase = true)

        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        _uiState.value = _uiState.value.copy(
            applyType = type,
            applyLeaveTypeId = selectedItem?.id,
            selectedLeaveTypeItem = selectedItem,
            isShortBreakSelected = isShort,
            applyStartDate = todayStr,
            applyEndDate = todayStr,
            applyReason = if (isShort && _uiState.value.applyReason.isBlank()) "Short Break Request" else _uiState.value.applyReason
        )
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
        val reasonToSubmit = if (state.applyReason.isBlank()) {
            if (state.isShortBreakSelected) "Short Break Request" else ""
        } else {
            state.applyReason
        }

        if (reasonToSubmit.isBlank()) {
            _uiState.value = state.copy(error = "Please provide a reason for leave")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSubmitting = true, error = null)

            val result = leaveRepo.applyLeave(
                type = state.applyType,
                leaveTypeId = state.applyLeaveTypeId,
                startDate = state.applyStartDate,
                endDate = state.applyEndDate,
                reason = reasonToSubmit
            )

            result.fold(
                onSuccess = { response ->
                    val isAutoApproved = response.autoApproved || state.isShortBreakSelected
                    val msg = if (isAutoApproved) {
                        "Short Break auto-approved! Timer is running now."
                    } else {
                        "Leave application submitted successfully!"
                    }

                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        showApplySheet = false,
                        applyReason = "",
                        successMessage = msg
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

    fun endActiveBreak() {
        val breakInfo = _uiState.value.activeBreak ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isEndingBreak = true, error = null, successMessage = null)
            val result = leaveRepo.endBreak(breakInfo.leaveId)
            result.fold(
                onSuccess = { response ->
                    timerJob?.cancel()
                    _uiState.value = _uiState.value.copy(
                        isEndingBreak = false,
                        activeBreak = null,
                        hasActiveBreak = false,
                        successMessage = response.message ?: "Break ended successfully."
                    )
                    loadLeaves()
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isEndingBreak = false,
                        error = ex.localizedMessage ?: "Failed to end active break"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
    }
}
