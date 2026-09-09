package com.shohoj.staff.data.local

import android.content.Context
import android.content.SharedPreferences
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

class SessionCookieJar(context: Context) : CookieJar {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("shohoj_cookies_pref", Context.MODE_PRIVATE)

    private val cookieStore: MutableMap<String, MutableList<Cookie>> = mutableMapOf()

    init {
        // Restore cookies from SharedPreferences
        val allEntries = prefs.all
        for ((host, serializedCookies) in allEntries) {
            if (serializedCookies is String) {
                val list = mutableListOf<Cookie>()
                val httpsUrl = HttpUrl.Builder().scheme("https").host(host).build()
                val httpUrl = HttpUrl.Builder().scheme("http").host(host).build()
                val rawCookies = serializedCookies.split("|||")
                for (raw in rawCookies) {
                    // Try parsing as HTTPS first (to support Secure cookies), fallback to HTTP
                    val parsed = Cookie.parse(httpsUrl, raw) ?: Cookie.parse(httpUrl, raw)
                    if (parsed != null) {
                        list.add(parsed)
                    }
                }
                if (list.isNotEmpty()) {
                    cookieStore[host] = list
                }
            }
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val currentList = cookieStore[host] ?: mutableListOf()

        for (newCookie in cookies) {
            // Remove existing cookie with same name
            currentList.removeAll { it.name == newCookie.name }
            currentList.add(newCookie)
        }
        cookieStore[host] = currentList

        // Persist to SharedPreferences
        val serialized = currentList.joinToString("|||") { it.toString() }
        prefs.edit().putString(host, serialized).apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val host = url.host
        val cookies = cookieStore[host] ?: emptyList()
        val now = System.currentTimeMillis()
        // Filter out expired cookies
        return cookies.filter { it.expiresAt > now }
    }

    fun clear() {
        cookieStore.clear()
        prefs.edit().clear().apply()
    }
}
