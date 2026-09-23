package com.shohoj.staff.ui.screens.attendance

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.ActiveBreakInfo
import com.shohoj.staff.data.model.AttendanceRecord
import com.shohoj.staff.data.model.AttendanceSummary
import com.shohoj.staff.data.model.DutyScheduleDto
import com.shohoj.staff.util.DateUtils
import com.shohoj.staff.util.LocationHelper
import com.shohoj.staff.util.WifiHelper
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class AttendanceUiState(
    val isLoading: Boolean = false,
    val records: List<AttendanceRecord> = emptyList(),
    val today: AttendanceRecord? = null,
    val summary: AttendanceSummary = AttendanceSummary(),
    val dutySchedule: DutyScheduleDto? = null,
    val isActionLoading: Boolean = false,
    val currentLocationString: String = "Detecting location...",
    val currentWifiString: String = "Detecting Wi-Fi...",
    val activeBreak: ActiveBreakInfo? = null,
    val activeBreakCountdown: String = "",
    val activeBreakStatusText: String = "",
    val activeBreakStatusColor: String = "EMERALD",
    val activeBreakFineText: String? = null,
    val isStartingBreak: Boolean = false,
    val isEndingBreak: Boolean = false,
    val successMessage: String? = null,
    val error: String? = null
)

class AttendanceViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val attendanceRepo = app.attendanceRepository
    private val leaveRepo = app.leaveRepository

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    private var breakTickerJob: Job? = null

    init {
        refreshData()
        detectEnvironment()
    }

    fun detectEnvironment() {
        viewModelScope.launch {
            val location = LocationHelper.getCurrentLocation(getApplication())
            val wifi = WifiHelper.getWifiDetails(getApplication())

            val locStr = if (location != null) {
                String.format("%.4f, %.4f", location.latitude, location.longitude)
            } else {
                "GPS unavailable"
            }

            val wifiStr = if (wifi.isConnected && wifi.ssid != null) {
                wifi.ssid
            } else {
                "Not connected to Wi-Fi"
            }

            _uiState.value = _uiState.value.copy(
                currentLocationString = locStr,
                currentWifiString = wifiStr
            )
        }
    }

    fun refreshData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val attResult = attendanceRepo.getAttendanceData()
            val leaveResult = leaveRepo.getLeaveData()

            var todayRecord: AttendanceRecord? = null
            var summary = AttendanceSummary()
            var dutySchedule: DutyScheduleDto? = null
            var activeBreak: ActiveBreakInfo? = null

            attResult.fold(
                onSuccess = { data ->
                    todayRecord = data.today
                    summary = data.summary ?: AttendanceSummary()
                    dutySchedule = data.dutySchedule ?: data.today?.dutySchedule
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch attendance history"
                    )
                }
            )

            leaveResult.onSuccess { leaveData ->
                activeBreak = leaveData.activeBreak
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                records = attResult.getOrNull()?.records ?: _uiState.value.records,
                today = todayRecord,
                summary = summary,
                dutySchedule = dutySchedule,
                activeBreak = activeBreak
            )

            startBreakCountdownTicker(activeBreak)
        }
    }

    private fun startBreakCountdownTicker(breakInfo: ActiveBreakInfo?) {
        breakTickerJob?.cancel()
        if (breakInfo == null) {
            _uiState.value = _uiState.value.copy(
                activeBreakCountdown = "",
                activeBreakStatusText = "",
                activeBreakFineText = null
            )
            return
        }

        breakTickerJob = viewModelScope.launch {
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

    fun requestLunchBreak(reason: String = "Lunch Break") {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isStartingBreak = true, error = null, successMessage = null)
            val result = leaveRepo.requestBreak(leaveTypeId = null, reason = reason)
            result.fold(
                onSuccess = { res ->
                    _uiState.value = _uiState.value.copy(
                        isStartingBreak = false,
                        activeBreak = res.activeBreak,
                        successMessage = res.message ?: "Lunch break started successfully."
                    )
                    startBreakCountdownTicker(res.activeBreak)
                    refreshData()
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isStartingBreak = false,
                        error = ex.localizedMessage ?: "Failed to start lunch break"
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
                    breakTickerJob?.cancel()
                    _uiState.value = _uiState.value.copy(
                        isEndingBreak = false,
                        activeBreak = null,
                        successMessage = response.message ?: "Break ended successfully."
                    )
                    refreshData()
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

    fun clockAction(action: String) {
        if (action == "CLOCK_OUT") {
            val dutyEndTime = _uiState.value.dutySchedule?.endTime ?: _uiState.value.today?.dutySchedule?.endTime ?: "20:00"
            val isNightShift = _uiState.value.dutySchedule?.nightShift == true
            if (!DateUtils.isCheckOutVisible(dutyEndTime, isNightShift)) {
                val openTime = DateUtils.getCheckOutOpenTimeString(dutyEndTime)
                val dutyEndFormatted = DateUtils.getDutyEndTimeString(dutyEndTime)
                _uiState.value = _uiState.value.copy(
                    error = "Check-out is available from $openTime (1 hour before duty end at $dutyEndFormatted)"
                )
                return
            }
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isActionLoading = true, error = null, successMessage = null)

            val location = LocationHelper.getCurrentLocation(getApplication())
            val wifi = WifiHelper.getWifiDetails(getApplication())

            val result = attendanceRepo.clockAction(
                action = action,
                latitude = location?.latitude,
                longitude = location?.longitude,
                ssid = wifi.ssid,
                bssid = wifi.bssid
            )

            result.fold(
                onSuccess = { res ->
                    val optimisticToday = res.record ?: _uiState.value.today
                    _uiState.value = _uiState.value.copy(
                        isActionLoading = false,
                        today = optimisticToday,
                        successMessage = res.message ?: "$action recorded successfully"
                    )
                    refreshData()
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isActionLoading = false,
                        error = ex.localizedMessage ?: "Action failed"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(successMessage = null, error = null)
    }

    override fun onCleared() {
        super.onCleared()
        breakTickerJob?.cancel()
    }
}
