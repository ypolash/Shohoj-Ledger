package com.shohoj.admin.data.local

import android.content.Context
import android.content.SharedPreferences
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

class SessionCookieJar(context: Context) : CookieJar {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("shohoj_admin_cookies", Context.MODE_PRIVATE)

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val editor = prefs.edit()
        for (cookie in cookies) {
            val key = "${url.host}_${cookie.name}"
            editor.putString(key, "${cookie.value};${cookie.domain};${cookie.path}")
        }
        editor.apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val result = mutableListOf<Cookie>()
        val allEntries = prefs.all
        for ((key, value) in allEntries) {
            if (key.startsWith(url.host)) {
                val cookieName = key.removePrefix("${url.host}_")
                val parts = (value as? String)?.split(";") ?: continue
                if (parts.isNotEmpty()) {
                    val cookieValue = parts[0]
                    val domain = if (parts.size > 1) parts[1] else url.host
                    val path = if (parts.size > 2) parts[2] else "/"

                    try {
                        val cookie = Cookie.Builder()
                            .name(cookieName)
                            .value(cookieValue)
                            .domain(domain)
                            .path(path)
                            .build()
                        result.add(cookie)
                    } catch (e: Exception) {
                        // Ignore malformed cookie
                    }
                }
            }
        }
        return result
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}
