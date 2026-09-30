package com.shohoj.staff.data.model

data class StaffProductsResponse(
    val success: Boolean = false,
    val products: List<StaffProductItem> = emptyList(),
    val stats: StaffProductStats? = null,
    val error: String? = null
)

data class StaffProductStats(
    val total: Int = 0,
    val inStudio: Int = 0,
    val readyForReturn: Int = 0,
    val returned: Int = 0,
    val pendingReceipt: Int = 0
)

data class StaffProductItem(
    val projectId: String = "",
    val projectName: String = "",
    val projectCode: String = "",
    val clientName: String = "",
    val clientPhone: String = "",
    val currentStage: Int = 1,
    val projectStatus: String = "",
    val projectType: String = "product",
    val productsList: List<ProductDetailItem> = emptyList(),
    val totalItemsCount: Int = 0,
    val received: Boolean = false,
    val productReturned: Boolean = false,
    val productReturnDate: String? = null,
    val productReturnMethod: String? = null,
    val productReturnReceiver: String? = null,
    val productReturnNotes: String? = null,
    val productStatus: String = "IN_STUDIO"
)

data class ProductDetailItem(
    val id: String = "",
    val name: String = "",
    val quantity: String = "1",
    val condition: String = "Good",
    val notes: String = ""
)

data class UpdateProductRequest(
    val projectId: String,
    val action: String, // 'RETURN', 'RECEIVE', 'REVERT_RETURN'
    val managerId: String? = null,
    val managerName: String? = null,
    val returnData: ProductReturnData? = null
)

data class ProductReturnData(
    val returnDate: String,
    val returnMethod: String,
    val returnReceiver: String,
    val returnNotes: String? = null
)

data class UpdateProductResponse(
    val success: Boolean = false,
    val message: String? = null,
    val error: String? = null
)
