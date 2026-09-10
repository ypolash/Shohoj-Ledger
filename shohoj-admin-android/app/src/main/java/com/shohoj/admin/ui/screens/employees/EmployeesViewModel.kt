package com.shohoj.admin.ui.screens.employees

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.model.EmployeeItem
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EmployeesUiState(
    val isLoading: Boolean = true,
    val searchQuery: String = "",
    val selectedStatus: String = "ALL",
    val employees: List<EmployeeItem> = emptyList(),
    val selectedEmployee: EmployeeItem? = null,
    val errorMessage: String? = null
)

class EmployeesViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(EmployeesUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadEmployees()
    }

    fun onSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadEmployees()
    }

    fun onStatusFilterChange(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadEmployees()
    }

    fun selectEmployee(employee: EmployeeItem?) {
        _uiState.value = _uiState.value.copy(selectedEmployee = employee)
    }

    fun loadEmployees() {
        val query = _uiState.value.searchQuery.ifBlank { null }
        val status = if (_uiState.value.selectedStatus == "ALL") null else _uiState.value.selectedStatus

        viewModelScope.launch {
            val result = repository.getEmployees(search = query, status = status)
            result.fold(
                onSuccess = { list ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        employees = list,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load employees."
                    )
                }
            )
        }
    }
}
