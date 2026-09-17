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

    fun parseTimeToMinutes(timeStr: String?, defaultMinutes: Int = 20 * 60): Int {
        if (timeStr.isNullOrBlank()) return defaultMinutes
        return try {
            val normalized = timeStr.trim().replace('.', ':')
            val isPm = normalized.contains("PM", ignoreCase = true)
            val isAm = normalized.contains("AM", ignoreCase = true)
            val cleanStr = normalized.replace("AM", "", ignoreCase = true)
                .replace("PM", "", ignoreCase = true)
                .trim()
            val parts = cleanStr.split(":")
            var hour = parts.getOrNull(0)?.trim()?.toIntOrNull() ?: (defaultMinutes / 60)
            val minute = parts.getOrNull(1)?.trim()?.toIntOrNull() ?: 0
            if (isPm && hour < 12) hour += 12
            if (isAm && hour == 12) hour = 0
            hour * 60 + minute
        } catch (e: Exception) {
            defaultMinutes
        }
    }

    fun isCheckOutVisible(
        dutyEndTime: String?,
        isNightShift: Boolean = false,
        calendar: Calendar = Calendar.getInstance()
    ): Boolean {
        val endMinutes = parseTimeToMinutes(dutyEndTime, defaultMinutes = 20 * 60)
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val checkoutOpenMinutes = endMinutes - 60

        if (isNightShift && endMinutes < 12 * 60) {
            // Night shift ending in the morning (e.g. 06:00 AM -> open at 05:00 AM)
            return currentMinutes >= checkoutOpenMinutes && currentMinutes <= (endMinutes + 6 * 60)
        }

        // Daytime shift (e.g. 20:00 / 8:00 PM -> visible from 19:00 / 7:00 PM onwards)
        return currentMinutes >= checkoutOpenMinutes
    }

    fun getCheckOutOpenTimeString(dutyEndTime: String?): String {
        val endMinutes = parseTimeToMinutes(dutyEndTime, defaultMinutes = 20 * 60)
        var openMinutes = endMinutes - 60
        if (openMinutes < 0) openMinutes += 24 * 60
        val hour24 = openMinutes / 60
        val minute = openMinutes % 60
        val period = if (hour24 >= 12) "PM" else "AM"
        val hour12 = when {
            hour24 == 0 -> 12
            hour24 > 12 -> hour24 - 12
            else -> hour24
        }
        return String.format(Locale.getDefault(), "%02d:%02d %s", hour12, minute, period)
    }

    fun getDutyEndTimeString(dutyEndTime: String?): String {
        val endMinutes = parseTimeToMinutes(dutyEndTime, defaultMinutes = 20 * 60)
        val hour24 = endMinutes / 60
        val minute = endMinutes % 60
        val period = if (hour24 >= 12) "PM" else "AM"
        val hour12 = when {
            hour24 == 0 -> 12
            hour24 > 12 -> hour24 - 12
            else -> hour24
        }
        return String.format(Locale.getDefault(), "%02d:%02d %s", hour12, minute, period)
    }
}
