package com.shohoj.admin.data.local

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.shohoj.admin.data.model.AdminCompany
import com.shohoj.admin.data.model.AdminUser

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val PREF_NAME = "shohoj_admin_prefs"
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_USER = "admin_user"
        private const val KEY_COMPANY = "admin_company"

        // Default production server
        const val DEFAULT_BASE_URL = "https://team.shohojsolution.com/"
        const val EMULATOR_BASE_URL = "http://10.0.2.2:3000/"
    }

    var baseUrl: String
        get() {
            var url = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
            if (!url.endsWith("/")) url += "/"
            return url
        }
        set(value) {
            var formatted = value.trim()
            if (!formatted.endsWith("/")) formatted += "/"
            prefs.edit().putString(KEY_BASE_URL, formatted).apply()
        }

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    fun saveSession(token: String, user: AdminUser, company: AdminCompany) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER, gson.toJson(user))
            .putString(KEY_COMPANY, gson.toJson(company))
            .apply()
    }

    fun getUser(): AdminUser? {
        val json = prefs.getString(KEY_USER, null) ?: return null
        return try {
            gson.fromJson(json, AdminUser::class.java)
        } catch (e: Exception) {
            null
        }
    }

    fun getCompany(): AdminCompany? {
        val json = prefs.getString(KEY_COMPANY, null) ?: return null
        return try {
            gson.fromJson(json, AdminCompany::class.java)
        } catch (e: Exception) {
            null
        }
    }

    val isLoggedIn: Boolean
        get() = !token.isNullOrBlank()

    fun clearSession() {
        val preservedBaseUrl = baseUrl
        prefs.edit().clear().apply()
        baseUrl = preservedBaseUrl
    }
}
