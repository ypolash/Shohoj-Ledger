package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class RefName(
    @SerializedName("name") val name: String? = null
)

data class ManagerRef(
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null
) {
    val fullName: String
        get() = "${firstName ?: ""} ${lastName ?: ""}".trim()
}

data class DetailedEmployeeProfile(
    @SerializedName("id") val id: String,
    @SerializedName("employeeId") val employeeId: String,
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("designation") val designation: String? = null,
    @SerializedName("department") val department: String? = null,
    @SerializedName("joinDate") val joinDate: String? = null,
    @SerializedName("basicSalary") val basicSalary: Double? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("departmentRef") val departmentRef: RefName? = null,
    @SerializedName("designationRef") val designationRef: RefName? = null,
    @SerializedName("reportingManager") val reportingManager: ManagerRef? = null
) {
    val fullName: String
        get() = "${firstName ?: ""} ${lastName ?: ""}".trim().ifEmpty { employeeId }

    val effectiveDepartment: String
        get() = departmentRef?.name ?: department ?: "N/A"

    val effectiveDesignation: String
        get() = designationRef?.name ?: designation ?: "Employee"
}

data class ProfileResponse(
    @SerializedName("employee") val employee: DetailedEmployeeProfile? = null,
    @SerializedName("error") val error: String? = null
)
