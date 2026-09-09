package com.shohoj.staff.data.local

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.shohoj.staff.data.model.EmployeeDto

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("shohoj_session_pref", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val KEY_BASE_URL = "key_base_url"
        private const val KEY_TOKEN = "key_token"
        private const val KEY_EMPLOYEE_JSON = "key_employee_json"
        private const val KEY_EMPLOYEE_ID = "key_employee_id"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"

        private const val KEY_URL_MIGRATED_V2 = "key_url_migrated_v2"

        // Preset URLs
        const val LIVE_BASE_URL = "https://team.shohojsolution.com/"
        const val EMULATOR_BASE_URL = "http://10.0.2.2:3000/"

        // Default to live production server
        const val DEFAULT_BASE_URL = LIVE_BASE_URL
    }

    init {
        // Upgrade legacy default URL (emulator 10.0.2.2) to Live Server on first run with this build
        if (!prefs.getBoolean(KEY_URL_MIGRATED_V2, false)) {
            val currentUrl = prefs.getString(KEY_BASE_URL, null)
            if (currentUrl == null ||
                currentUrl == "http://10.0.2.2:3000/" ||
                currentUrl == "http://10.0.2.2:3000" ||
                currentUrl == "http://localhost:3000/" ||
                currentUrl == "http://localhost:3000"
            ) {
                prefs.edit()
                    .putString(KEY_BASE_URL, LIVE_BASE_URL)
                    .putBoolean(KEY_URL_MIGRATED_V2, true)
                    .apply()
            } else {
                prefs.edit().putBoolean(KEY_URL_MIGRATED_V2, true).apply()
            }
        }
    }

    var baseUrl: String
        get() {
            var url = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
            if (!url.endsWith("/")) {
                url += "/"
            }
            return url
        }
        set(value) {
            var url = value.trim()
            if (url.isNotBlank()) {
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = if (url.startsWith("10.0.2.2") ||
                        url.startsWith("localhost") ||
                        url.startsWith("127.0.0.1") ||
                        url.startsWith("192.168.") ||
                        url.startsWith("172.") ||
                        url.startsWith("10.")
                    ) {
                        "http://$url"
                    } else {
                        "https://$url"
                    }
                }
                if (!url.endsWith("/")) {
                    url += "/"
                }
                prefs.edit().putString(KEY_BASE_URL, url).apply()
            }
        }

    val isLiveServer: Boolean
        get() = baseUrl.trimEnd('/') == LIVE_BASE_URL.trimEnd('/')

    val isEmulatorLocalhost: Boolean
        get() = baseUrl.trimEnd('/') == EMULATOR_BASE_URL.trimEnd('/')

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var employeeId: String?
        get() = prefs.getString(KEY_EMPLOYEE_ID, null)
        set(value) = prefs.edit().putString(KEY_EMPLOYEE_ID, value).apply()

    var isLoggedIn: Boolean
        get() = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_LOGGED_IN, value).apply()

    fun saveEmployee(employee: EmployeeDto) {
        val json = gson.toJson(employee)
        prefs.edit()
            .putString(KEY_EMPLOYEE_JSON, json)
            .putString(KEY_EMPLOYEE_ID, employee.employeeId)
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply()
    }

    fun getEmployee(): EmployeeDto? {
        val json = prefs.getString(KEY_EMPLOYEE_JSON, null) ?: return null
        return try {
            gson.fromJson(json, EmployeeDto::class.java)
        } catch (e: Exception) {
            null
        }
    }

    fun clearSession() {
        val savedBaseUrl = baseUrl // Keep base URL
        prefs.edit().clear().apply()
        prefs.edit().putBoolean(KEY_URL_MIGRATED_V2, true).apply()
        baseUrl = savedBaseUrl
    }
}
