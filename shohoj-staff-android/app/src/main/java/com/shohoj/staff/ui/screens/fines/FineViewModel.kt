package com.shohoj.staff.ui.screens.fines

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.FineItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

import java.text.SimpleDateFormat
import java.util.*

data class CalendarDay(
    val dateKey: String,
    val dayOfWeek: String,
    val dayNumber: Int,
    val isToday: Boolean,
    val fineCount: Int = 0,
    val totalFineAmount: Double = 0.0
)

data class FineUiState(
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val fines: List<FineItem> = emptyList(),
    val selectedFineForConsideration: FineItem? = null,
    val selectedDate: String? = null, // null means "All Dates"
    val selectedMonthCal: Calendar = Calendar.getInstance(),
    val error: String? = null,
    val successMessage: String? = null
)

class FineViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val fineRepo = app.fineRepository

    private val _uiState = MutableStateFlow(FineUiState())
    val uiState: StateFlow<FineUiState> = _uiState.asStateFlow()

    init {
        loadFines()
    }

    fun loadFines() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = fineRepo.getFines()

            result.fold(
                onSuccess = { finesList ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        fines = finesList
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch fine records"
                    )
                }
            )
        }
    }

    fun selectDate(dateKey: String?) {
        if (_uiState.value.selectedDate == dateKey) {
            _uiState.value = _uiState.value.copy(selectedDate = null)
        } else {
            _uiState.value = _uiState.value.copy(selectedDate = dateKey)
        }
    }

    fun clearDateFilter() {
        _uiState.value = _uiState.value.copy(selectedDate = null)
    }

    fun previousMonth() {
        val newCal = (_uiState.value.selectedMonthCal.clone() as Calendar).apply {
            add(Calendar.MONTH, -1)
        }
        _uiState.value = _uiState.value.copy(selectedMonthCal = newCal)
    }

    fun nextMonth() {
        val newCal = (_uiState.value.selectedMonthCal.clone() as Calendar).apply {
            add(Calendar.MONTH, 1)
        }
        _uiState.value = _uiState.value.copy(selectedMonthCal = newCal)
    }

    fun jumpToToday() {
        val todayCal = Calendar.getInstance()
        val todayKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(todayCal.time)
        _uiState.value = _uiState.value.copy(
            selectedMonthCal = todayCal,
            selectedDate = todayKey
        )
    }

    fun getCalendarDays(): List<CalendarDay> {
        val days = mutableListOf<CalendarDay>()
        val cal = _uiState.value.selectedMonthCal.clone() as Calendar
        cal.set(Calendar.DAY_OF_MONTH, 1)
        val maxDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

        val todayCal = Calendar.getInstance()
        val isCurrentYearMonth = cal.get(Calendar.YEAR) == todayCal.get(Calendar.YEAR) &&
                cal.get(Calendar.MONTH) == todayCal.get(Calendar.MONTH)
        val todayDayNumber = if (isCurrentYearMonth) todayCal.get(Calendar.DAY_OF_MONTH) else -1

        val keyFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val dayOfWeekFormat = SimpleDateFormat("EEE", Locale.getDefault())

        val finesByDate = _uiState.value.fines.groupBy { fine ->
            val raw = fine.date ?: fine.createdAt ?: ""
            if (raw.length >= 10) raw.substring(0, 10) else ""
        }

        for (day in 1..maxDays) {
            cal.set(Calendar.DAY_OF_MONTH, day)
            val dateKey = keyFormat.format(cal.time)
            val dayOfWeek = dayOfWeekFormat.format(cal.time)
            val dayFines = finesByDate[dateKey] ?: emptyList()

            days.add(
                CalendarDay(
                    dateKey = dateKey,
                    dayOfWeek = dayOfWeek,
                    dayNumber = day,
                    isToday = day == todayDayNumber,
                    fineCount = dayFines.size,
                    totalFineAmount = dayFines.sumOf { it.amount }
                )
            )
        }
        return days
    }

    fun getFilteredFines(): List<FineItem> {
        val selectedDate = _uiState.value.selectedDate
        val all = _uiState.value.fines
        return if (selectedDate == null) {
            all
        } else {
            all.filter { fine ->
                val raw = fine.date ?: fine.createdAt ?: ""
                val key = if (raw.length >= 10) raw.substring(0, 10) else ""
                key == selectedDate
            }
        }
    }

    fun getGroupedFines(): Map<String, List<FineItem>> {
        val fines = getFilteredFines()
        return fines.groupBy { fine ->
            val raw = fine.date ?: fine.createdAt ?: ""
            if (raw.length >= 10) raw.substring(0, 10) else "Other"
        }
    }

    fun selectFineForConsideration(fine: FineItem?) {
        _uiState.value = _uiState.value.copy(selectedFineForConsideration = fine)
    }

    fun submitConsiderationRequest(fineId: String, reason: String) {
        if (reason.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Please provide a reason for consideration")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val result = fineRepo.requestConsideration(fineId, reason.trim())

            result.fold(
                onSuccess = { updatedFine ->
                    val updatedList = _uiState.value.fines.map {
                        if (it.id == updatedFine.id) updatedFine else it
                    }
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        fines = updatedList,
                        selectedFineForConsideration = null,
                        successMessage = "Consideration request submitted successfully"
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = ex.localizedMessage ?: "Failed to submit consideration request"
                    )
                }
            )
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}
