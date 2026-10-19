package com.shohoj.staff.util

import android.content.Context
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.ActiveBreakInfo
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*

data class BreakManagerState(
    val activeBreak: ActiveBreakInfo? = null,
    val isBreakActive: Boolean = false,
    val countdownText: String = "",
    val statusText: String = "",
    val statusColor: String = "EMERALD", // EMERALD, AMBER, ROSE
    val isTimerFinished: Boolean = false,
    val isOverstayed: Boolean = false,
    val fineAmount: Double = 50.0,
    val fineText: String? = null,
    val isPaused: Boolean = false,
    val isWifiAllowed: Boolean = false,
    val currentSsid: String? = null,
    val allowedSsids: List<String> = emptyList(),
    val isActionLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null
)

object BreakManager {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var tickerJob: Job? = null
    private var wifiJob: Job? = null

    private val _state = MutableStateFlow(BreakManagerState())
    val state: StateFlow<BreakManagerState> = _state.asStateFlow()

    private var hasNotifiedWifiFine = false

    fun syncBreak(breakInfo: ActiveBreakInfo?, context: Context) {
        if (breakInfo == null) {
            tickerJob?.cancel()
            wifiJob?.cancel()
            _state.value = BreakManagerState()
            hasNotifiedWifiFine = false
            return
        }

        val allowedSsids = breakInfo.allowedSsids.ifEmpty { _state.value.allowedSsids }

        _state.value = _state.value.copy(
            activeBreak = breakInfo,
            isBreakActive = true,
            isPaused = breakInfo.isPaused || breakInfo.status == "PAUSED",
            fineAmount = breakInfo.fineAmount,
            allowedSsids = allowedSsids
        )

        startTicker(context)
        startWifiMonitor(context)
    }

    private fun startWifiMonitor(context: Context) {
        wifiJob?.cancel()
        wifiJob = scope.launch(Dispatchers.IO) {
            while (isActive) {
                try {
                    val wifi = WifiHelper.getWifiDetails(context)
                    val rawSsid = wifi.ssid?.trim()?.replace("\"", "") ?: ""
                    val allowed = _state.value.allowedSsids

                    val isAllowed = when {
                        !wifi.isConnected -> false
                        allowed.isEmpty() -> true // If no specific SSIDs are configured on server, general Wi-Fi is accepted
                        else -> allowed.any { allowedSsid ->
                            val cleanAllowed = allowedSsid.trim().replace("\"", "")
                            cleanAllowed.equals(rawSsid, ignoreCase = true)
                        }
                    }

                    withContext(Dispatchers.Main) {
                        _state.value = _state.value.copy(
                            isWifiAllowed = isAllowed,
                            currentSsid = if (wifi.isConnected && rawSsid.isNotBlank()) rawSsid else null
                        )
                    }
                } catch (_: Exception) {}

                delay(2500L)
            }
        }
    }

    private fun startTicker(context: Context) {
        tickerJob?.cancel()
        tickerJob = scope.launch {
            while (isActive) {
                val current = _state.value.activeBreak ?: break
                if (current.isPaused || current.status == "PAUSED") {
                    val remSec = if (current.remainingSeconds > 0) current.remainingSeconds else current.durationMinutes * 60L
                    val mins = remSec / 60
                    val secs = remSec % 60
                    _state.value = _state.value.copy(
                        countdownText = String.format("%02d:%02d", mins, secs),
                        statusText = "Break Paused",
                        statusColor = "AMBER",
                        fineText = "Timer is paused. Reconnect to office Wi-Fi and resume when ready.",
                        isTimerFinished = false,
                        isPaused = true
                    )
                    delay(1000L)
                    continue
                }

                val now = System.currentTimeMillis()
                val targetEnd = parseIsoDate(current.targetEndTime)
                    ?: (parseIsoDate(current.startTime)?.plus(current.durationMinutes * 60 * 1000L))
                    ?: (now + (if (current.remainingSeconds > 0) current.remainingSeconds * 1000L else current.durationMinutes * 60 * 1000L))

                val graceEnd = parseIsoDate(current.graceEndTime)
                    ?: (targetEnd + (current.gracePeriodMinutes * 60 * 1000L))

                val isWifiOk = _state.value.isWifiAllowed

                if (now < targetEnd) {
                    val remSec = maxOf(0L, (targetEnd - now) / 1000L)
                    val mins = remSec / 60
                    val secs = remSec % 60
                    val fineWarning = if (!isWifiOk) {
                        "Return & connect to office Wi-Fi before timer finishes to avoid ৳${current.fineAmount.toInt()} fine"
                    } else null

                    _state.value = _state.value.copy(
                        countdownText = String.format("%02d:%02d", mins, secs),
                        statusText = if (isWifiOk) "Break in Progress (Wi-Fi Connected)" else "Break in Progress (Outside Wi-Fi)",
                        statusColor = if (isWifiOk) "EMERALD" else "AMBER",
                        fineText = fineWarning,
                        isTimerFinished = false,
                        isOverstayed = false,
                        isPaused = false
                    )
                } else if (now <= graceEnd) {
                    val graceRemSec = maxOf(0L, (graceEnd - now) / 1000L)
                    val mins = graceRemSec / 60
                    val secs = graceRemSec % 60
                    val fineWarning = if (!isWifiOk) {
                        "URGENT: Reconnect to office Wi-Fi now! Overstay fine applies in ${mins}m ${secs}s."
                    } else {
                        "Grace period ending. Tap End Break before ৳${current.fineAmount.toInt()} fine applies."
                    }

                    _state.value = _state.value.copy(
                        countdownText = String.format("%02d:%02d", mins, secs),
                        statusText = "Grace Period Tolerance",
                        statusColor = "AMBER",
                        fineText = fineWarning,
                        isTimerFinished = true,
                        isOverstayed = false,
                        isPaused = false
                    )
                } else {
                    val overstaySec = (now - graceEnd) / 1000L
                    val mins = overstaySec / 60
                    val secs = overstaySec % 60
                    val overstayMins = Math.ceil(overstaySec / 60.0).toInt().coerceAtLeast(1)
                    val fine = if (current.fineType == "PER_MINUTE") {
                        current.fineAmount * overstayMins
                    } else {
                        current.fineAmount
                    }

                    val fineDesc = if (!isWifiOk) {
                        "৳${fine.toInt()} Fine Applied: Not connected to office Wi-Fi within break time!"
                    } else {
                        "৳${fine.toInt()} Overstay Penalty Fine registered"
                    }

                    _state.value = _state.value.copy(
                        countdownText = String.format("+%02d:%02d", mins, secs),
                        statusText = "OVERSTAYED by ${overstayMins}m",
                        statusColor = "ROSE",
                        fineText = fineDesc,
                        isTimerFinished = true,
                        isOverstayed = true,
                        isPaused = false
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
        } catch (_: Exception) {
            null
        }
    }

    fun endBreak(
        context: Context,
        onSuccess: (String) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        val current = _state.value.activeBreak ?: return
        val app = context.applicationContext as? ShohojStaffApp ?: return

        scope.launch {
            _state.value = _state.value.copy(isActionLoading = true, error = null, successMessage = null)

            val location = LocationHelper.getCurrentLocation(context)
            val wifi = WifiHelper.getWifiDetails(context)

            if (location == null) {
                val err = "GPS / Location is required to verify your office location and end break."
                _state.value = _state.value.copy(isActionLoading = false, error = err)
                onError(err)
                return@launch
            }

            if (!wifi.isConnected || (wifi.ssid.isNullOrBlank() && wifi.bssid.isNullOrBlank())) {
                val err = "Cannot End Break: You must connect to authorized company office Wi-Fi to end your break."
                _state.value = _state.value.copy(isActionLoading = false, error = err)
                onError(err)
                return@launch
            }

            val result = app.leaveRepository.endBreak(
                leaveId = current.leaveId,
                latitude = location.latitude,
                longitude = location.longitude,
                ssid = wifi.ssid,
                bssid = wifi.bssid
            )

            result.fold(
                onSuccess = { res ->
                    syncBreak(null, context)
                    val msg = res.message ?: "Break completed successfully."
                    _state.value = _state.value.copy(isActionLoading = false, successMessage = msg)
                    onSuccess(msg)
                },
                onFailure = { ex ->
                    val err = ex.localizedMessage ?: "Failed to end active break"
                    _state.value = _state.value.copy(isActionLoading = false, error = err)
                    onError(err)
                }
            )
        }
    }

    fun pauseBreak(
        context: Context,
        onSuccess: (String) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        val current = _state.value.activeBreak ?: return
        val app = context.applicationContext as? ShohojStaffApp ?: return

        scope.launch {
            _state.value = _state.value.copy(isActionLoading = true, error = null, successMessage = null)

            val location = LocationHelper.getCurrentLocation(context)
            val wifi = WifiHelper.getWifiDetails(context)

            if (location == null || !wifi.isConnected) {
                val err = "Location and company Wi-Fi are required for break pause operations."
                _state.value = _state.value.copy(isActionLoading = false, error = err)
                onError(err)
                return@launch
            }

            val result = app.leaveRepository.pauseBreak(
                leaveId = current.leaveId,
                latitude = location.latitude,
                longitude = location.longitude,
                ssid = wifi.ssid,
                bssid = wifi.bssid
            )

            result.fold(
                onSuccess = { res ->
                    syncBreak(res.activeBreak, context)
                    val msg = res.message ?: "Break paused successfully."
                    _state.value = _state.value.copy(isActionLoading = false, successMessage = msg)
                    onSuccess(msg)
                },
                onFailure = { ex ->
                    val err = ex.localizedMessage ?: "Failed to pause break"
                    _state.value = _state.value.copy(isActionLoading = false, error = err)
                    onError(err)
                }
            )
        }
    }

    fun resumeBreak(
        context: Context,
        onSuccess: (String) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        val current = _state.value.activeBreak ?: return
        val app = context.applicationContext as? ShohojStaffApp ?: return

        scope.launch {
            _state.value = _state.value.copy(isActionLoading = true, error = null, successMessage = null)

            val location = LocationHelper.getCurrentLocation(context)
            val wifi = WifiHelper.getWifiDetails(context)

            if (location == null || !wifi.isConnected) {
                val err = "Location and company Wi-Fi are required for break resume operations."
                _state.value = _state.value.copy(isActionLoading = false, error = err)
                onError(err)
                return@launch
            }

            val result = app.leaveRepository.resumeBreak(
                leaveId = current.leaveId,
                latitude = location.latitude,
                longitude = location.longitude,
                ssid = wifi.ssid,
                bssid = wifi.bssid
            )

            result.fold(
                onSuccess = { res ->
                    syncBreak(res.activeBreak, context)
                    val msg = res.message ?: "Break resumed successfully."
                    _state.value = _state.value.copy(isActionLoading = false, successMessage = msg)
                    onSuccess(msg)
                },
                onFailure = { ex ->
                    val err = ex.localizedMessage ?: "Failed to resume break"
                    _state.value = _state.value.copy(isActionLoading = false, error = err)
                    onError(err)
                }
            )
        }
    }

    fun clearFeedback() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
