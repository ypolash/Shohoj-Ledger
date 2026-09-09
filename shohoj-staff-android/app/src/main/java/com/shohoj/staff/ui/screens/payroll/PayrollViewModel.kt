package com.shohoj.staff.ui.screens.payroll

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.BonusItem
import com.shohoj.staff.data.model.DeductionItem
import com.shohoj.staff.data.model.PayslipItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PayrollUiState(
    val isLoading: Boolean = false,
    val payslips: List<PayslipItem> = emptyList(),
    val bonuses: List<BonusItem> = emptyList(),
    val deductions: List<DeductionItem> = emptyList(),
    val latestPayslip: PayslipItem? = null,
    val error: String? = null
)

class PayrollViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val payrollRepo = app.payrollRepository

    private val _uiState = MutableStateFlow(PayrollUiState())
    val uiState: StateFlow<PayrollUiState> = _uiState.asStateFlow()

    init {
        loadPayroll()
    }

    fun loadPayroll() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = payrollRepo.getPayroll()

            result.fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        payslips = data.payslips,
                        bonuses = data.bonuses,
                        deductions = data.deductions,
                        latestPayslip = data.payslips.firstOrNull()
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch payroll records"
                    )
                }
            )
        }
    }
}
