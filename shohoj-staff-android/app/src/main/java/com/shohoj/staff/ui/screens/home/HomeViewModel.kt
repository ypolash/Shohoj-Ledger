package com.shohoj.staff.ui.screens.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.*
import com.shohoj.staff.util.LocationHelper
import com.shohoj.staff.util.WifiHelper
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

    private val _uiState = MutableStateFlow(
        HomeUiState(employee = authRepo.getCurrentEmployee())
    )
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

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

            // Fetch attendance
            val attResult = attendanceRepo.getAttendanceData()
            val annResult = announcementRepo.getAnnouncements()

            var todayRecord: AttendanceRecord? = null
            var summary: AttendanceSummary? = null
            var announcementsList: List<AnnouncementItem> = emptyList()

            attResult.onSuccess { data ->
                todayRecord = data.today
                summary = data.summary
            }

            annResult.onSuccess { list ->
                announcementsList = list.take(3)
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                employee = currentEmp,
                todayAttendance = todayRecord,
                summary = summary,
                announcements = announcementsList
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
}
