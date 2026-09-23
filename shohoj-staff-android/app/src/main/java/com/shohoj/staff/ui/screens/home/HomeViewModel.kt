package com.shohoj.staff.ui.screens.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.*
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

data class HomeUiState(
    val isLoading: Boolean = false,
    val employee: EmployeeDto? = null,
    val todayAttendance: AttendanceRecord? = null,
    val summary: AttendanceSummary? = null,
    val announcements: List<AnnouncementItem> = emptyList(),
    val dutySchedule: DutyScheduleDto? = null,
    val activeBreak: ActiveBreakInfo? = null,
    val activeBreakCountdown: String = "",
    val activeBreakStatusText: String = "",
    val activeBreakStatusColor: String = "EMERALD",
    val activeBreakFineText: String? = null,
    val isStartingBreak: Boolean = false,
    val isEndingBreak: Boolean = false,
    val currentTimeString: String = "",
    val currentDateString: String = "",
    val isClocking: Boolean = false,
    val clockActionSuccessMessage: String? = null,
    val error: String? = null
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val authRepo = app.authRepository
    private val attendanceRepo = app.attendanceRepository
    private val announcementRepo = app.announcementRepository
    private val leaveRepo = app.leaveRepository

    private val _uiState = MutableStateFlow(
        HomeUiState(employee = authRepo.getCurrentEmployee())
    )
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private var breakTickerJob: Job? = null

    init {
        startLiveClock()
        loadDashboardData()
    }

    private fun startLiveClock() {
        viewModelScope.launch {
            val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())
            val dateFormat = SimpleDateFormat("EEEE, dd MMMM yyyy", Locale.getDefault())
            while (isActive) {
                val now = Date()
                _uiState.value = _uiState.value.copy(
                    currentTimeString = timeFormat.format(now),
                    currentDateString = dateFormat.format(now)
                )
                delay(1000)
            }
        }
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            // Refresh current employee
            val currentEmp = authRepo.getCurrentEmployee()

            // Fetch attendance, announcements & active break in parallel
            val attResult = attendanceRepo.getAttendanceData()
            val annResult = announcementRepo.getAnnouncements()
            val leaveResult = leaveRepo.getLeaveData()

            var todayRecord: AttendanceRecord? = null
            var summary: AttendanceSummary? = null
            var dutySchedule: DutyScheduleDto? = currentEmp?.dutySchedule
            var announcementsList: List<AnnouncementItem> = emptyList()
            var activeBreak: ActiveBreakInfo? = null

            attResult.onSuccess { data ->
                todayRecord = data.today
                summary = data.summary
                dutySchedule = data.dutySchedule ?: data.today?.dutySchedule ?: currentEmp?.dutySchedule
            }

            annResult.onSuccess { list ->
                announcementsList = list.take(3)
            }

            leaveResult.onSuccess { leaveData ->
                activeBreak = leaveData.activeBreak
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                employee = currentEmp,
                todayAttendance = todayRecord,
                summary = summary,
                dutySchedule = dutySchedule,
                announcements = announcementsList,
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
            _uiState.value = _uiState.value.copy(isStartingBreak = true, error = null, clockActionSuccessMessage = null)
            val result = leaveRepo.requestBreak(leaveTypeId = null, reason = reason)
            result.fold(
                onSuccess = { res ->
                    _uiState.value = _uiState.value.copy(
                        isStartingBreak = false,
                        activeBreak = res.activeBreak,
                        clockActionSuccessMessage = res.message ?: "Lunch break started successfully."
                    )
                    startBreakCountdownTicker(res.activeBreak)
                    loadDashboardData()
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
            _uiState.value = _uiState.value.copy(isEndingBreak = true, error = null, clockActionSuccessMessage = null)
            val result = leaveRepo.endBreak(breakInfo.leaveId)
            result.fold(
                onSuccess = { response ->
                    breakTickerJob?.cancel()
                    _uiState.value = _uiState.value.copy(
                        isEndingBreak = false,
                        activeBreak = null,
                        clockActionSuccessMessage = response.message ?: "Break ended successfully."
                    )
                    loadDashboardData()
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

    fun performQuickClockAction() {
        val today = _uiState.value.todayAttendance
        val isCheckedIn = today?.checkInTime != null || today?.checkIn != null
        val isCheckedOut = today?.checkOutTime != null || today?.checkOut != null

        if (isCheckedIn && isCheckedOut) {
            _uiState.value = _uiState.value.copy(error = "Already clocked out for today")
            return
        }

        val action = if (!isCheckedIn) "CLOCK_IN" else "CLOCK_OUT"

        if (action == "CLOCK_OUT") {
            val dutyEndTime = _uiState.value.dutySchedule?.endTime ?: today?.dutySchedule?.endTime ?: "20:00"
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
            _uiState.value = _uiState.value.copy(isClocking = true, error = null, clockActionSuccessMessage = null)

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
                    val optimisticToday = res.record ?: _uiState.value.todayAttendance
                    _uiState.value = _uiState.value.copy(
                        isClocking = false,
                        todayAttendance = optimisticToday,
                        clockActionSuccessMessage = res.message ?: "Successfully recorded $action"
                    )
                    loadDashboardData()
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isClocking = false,
                        error = ex.localizedMessage ?: "Failed to perform $action"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, clockActionSuccessMessage = null)
    }

    override fun onCleared() {
        super.onCleared()
        breakTickerJob?.cancel()
    }
}
