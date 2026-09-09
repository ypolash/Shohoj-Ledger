package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class PayslipItem(
    @SerializedName("id") val id: String,
    @SerializedName("month") val month: Int,
    @SerializedName("year") val year: Int,
    @SerializedName("basicSalary") val basicSalary: Double = 0.0,
    @SerializedName("houseRent") val houseRent: Double? = 0.0,
    @SerializedName("medicalAllowance") val medicalAllowance: Double? = 0.0,
    @SerializedName("transportAllowance") val transportAllowance: Double? = 0.0,
    @SerializedName("grossSalary") val grossSalary: Double = 0.0,
    @SerializedName("totalDeductions") val totalDeductions: Double = 0.0,
    @SerializedName("netSalary") val netSalary: Double = 0.0,
    @SerializedName("status") val status: String? = "PAID",
    @SerializedName("paymentMethod") val paymentMethod: String? = null,
    @SerializedName("disbursedAt") val disbursedAt: String? = null
)

data class SalaryPaymentItem(
    @SerializedName("id") val id: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("paymentDate") val paymentDate: String,
    @SerializedName("paymentMethod") val paymentMethod: String? = null,
    @SerializedName("status") val status: String? = null
)

data class BonusItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String? = null,
    @SerializedName("amount") val amount: Double,
    @SerializedName("reason") val reason: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class DeductionItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String? = null,
    @SerializedName("amount") val amount: Double,
    @SerializedName("reason") val reason: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class PayrollResponse(
    @SerializedName("payslips") val payslips: List<PayslipItem> = emptyList(),
    @SerializedName("payments") val payments: List<SalaryPaymentItem> = emptyList(),
    @SerializedName("bonuses") val bonuses: List<BonusItem> = emptyList(),
    @SerializedName("deductions") val deductions: List<DeductionItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)
