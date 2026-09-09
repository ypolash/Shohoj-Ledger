package com.shohoj.staff.util

import java.text.SimpleDateFormat
import java.util.*

object DateUtils {

    fun formatTime(dateStr: String?): String {
        if (dateStr.isNullOrBlank()) return "--:--"
        return try {
            val isoParser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val date = isoParser.parse(dateStr)
            val timeFormatter = SimpleDateFormat("hh:mm a", Locale.getDefault()).apply {
                timeZone = TimeZone.getDefault()
            }
            if (date != null) timeFormatter.format(date) else "--:--"
        } catch (e: Exception) {
            try {
                // Fallback for direct Date().toString() or simpler formats
                val fallback = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val d = fallback.parse(dateStr)
                if (d != null) SimpleDateFormat("hh:mm a", Locale.getDefault()).format(d) else dateStr
            } catch (e2: Exception) {
                dateStr
            }
        }
    }

    fun formatDate(dateStr: String?): String {
        if (dateStr.isNullOrBlank()) return "--"
        return try {
            val isoParser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = isoParser.parse(dateStr.substring(0, minOf(10, dateStr.length)))
            val displayFormatter = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault())
            if (date != null) displayFormatter.format(date) else dateStr
        } catch (e: Exception) {
            dateStr
        }
    }

    fun formatMonthYear(month: Int, year: Int): String {
        return try {
            val cal = Calendar.getInstance().apply {
                set(Calendar.MONTH, month - 1)
                set(Calendar.YEAR, year)
            }
            SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(cal.time)
        } catch (e: Exception) {
            "$month/$year"
        }
    }

    fun formatCurrency(amount: Double): String {
        return "৳" + String.format(Locale.US, "%,.2f", amount)
    }

    fun formatMinutesToHours(minutes: Int?): String {
        if (minutes == null || minutes <= 0) return "0h 0m"
        val hours = minutes / 60
        val mins = minutes % 60
        return "${hours}h ${mins}m"
    }
}
