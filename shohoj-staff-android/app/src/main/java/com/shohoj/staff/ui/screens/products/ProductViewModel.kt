package com.shohoj.staff.ui.screens.products

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.StaffProductItem
import com.shohoj.staff.data.model.StaffProductStats
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProductUiState(
    val isLoading: Boolean = false,
    val products: List<StaffProductItem> = emptyList(),
    val stats: StaffProductStats = StaffProductStats(),
    val searchQuery: String = "",
    val selectedFilter: String = "ALL", // ALL, IN_STUDIO, READY_FOR_RETURN, RETURNED, PENDING_RECEIPT
    val isActionLoading: Boolean = false,
    val actionMessage: String? = null,
    val errorMessage: String? = null,
    val returnModalProduct: StaffProductItem? = null
)

class ProductViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = (application as ShohojStaffApp).productRepository

    private val _uiState = MutableStateFlow(ProductUiState())
    val uiState: StateFlow<ProductUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadProducts()
    }

    fun loadProducts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val currentSearch = _uiState.value.searchQuery
            val currentFilter = _uiState.value.selectedFilter

            val result = repository.getProducts(search = currentSearch, status = currentFilter)
            result.onSuccess { response ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        products = response.products,
                        stats = response.stats ?: StaffProductStats()
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = error.localizedMessage ?: "Failed to load products"
                    )
                }
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(350L) // debounce
            loadProducts()
        }
    }

    fun onFilterSelected(filter: String) {
        if (_uiState.value.selectedFilter == filter) return
        _uiState.update { it.copy(selectedFilter = filter) }
        loadProducts()
    }

    fun openReturnModal(product: StaffProductItem) {
        _uiState.update { it.copy(returnModalProduct = product) }
    }

    fun closeReturnModal() {
        _uiState.update { it.copy(returnModalProduct = null) }
    }

    fun confirmReturn(
        projectId: String,
        returnDate: String,
        returnMethod: String,
        returnReceiver: String,
        returnNotes: String?
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, errorMessage = null) }
            val result = repository.confirmReturn(
                projectId = projectId,
                returnDate = returnDate,
                returnMethod = returnMethod,
                returnReceiver = returnReceiver,
                returnNotes = returnNotes
            )
            result.onSuccess { res ->
                _uiState.update {
                    it.copy(
                        isActionLoading = false,
                        returnModalProduct = null,
                        actionMessage = res.message ?: "📦 Product marked as returned to client!"
                    )
                }
                loadProducts()
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        isActionLoading = false,
                        errorMessage = err.localizedMessage ?: "Failed to mark return"
                    )
                }
            }
        }
    }

    fun receiveProduct(projectId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, errorMessage = null) }
            val result = repository.receiveProduct(projectId)
            result.onSuccess { res ->
                _uiState.update {
                    it.copy(
                        isActionLoading = false,
                        actionMessage = res.message ?: "✓ Product received and verified in studio!"
                    )
                }
                loadProducts()
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        isActionLoading = false,
                        errorMessage = err.localizedMessage ?: "Failed to receive product"
                    )
                }
            }
        }
    }

    fun revertReturn(projectId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, errorMessage = null) }
            val result = repository.revertReturn(projectId)
            result.onSuccess { res ->
                _uiState.update {
                    it.copy(
                        isActionLoading = false,
                        actionMessage = res.message ?: "Return status reverted."
                    )
                }
                loadProducts()
            }.onFailure { err ->
                _uiState.update {
                    it.copy(
                        isActionLoading = false,
                        errorMessage = err.localizedMessage ?: "Failed to revert return"
                    )
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(actionMessage = null, errorMessage = null) }
    }
}
