package com.shohoj.staff.ui.screens.attendance

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.AttendanceRecord
import com.shohoj.staff.data.model.AttendanceSummary
import com.shohoj.staff.util.LocationHelper
import com.shohoj.staff.util.WifiDetails
import com.shohoj.staff.util.WifiHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AttendanceUiState(
    val isLoading: Boolean = false,
    val records: List<AttendanceRecord> = emptyList(),
    val today: AttendanceRecord? = null,
    val summary: AttendanceSummary = AttendanceSummary(),
    val isActionLoading: Boolean = false,
    val currentLocationString: String = "Detecting location...",
    val currentWifiString: String = "Detecting Wi-Fi...",
    val successMessage: String? = null,
    val error: String? = null
)

class AttendanceViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val attendanceRepo = app.attendanceRepository

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

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
            val result = attendanceRepo.getAttendanceData()

            result.fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        records = data.records,
                        today = data.today,
                        summary = data.summary ?: AttendanceSummary()
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch attendance history"
                    )
                }
            )
        }
    }

    fun clockAction(action: String) {
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
}
