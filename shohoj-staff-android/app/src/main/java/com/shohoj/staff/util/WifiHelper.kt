package com.shohoj.staff.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager

data class WifiDetails(
    val ssid: String?,
    val bssid: String?,
    val isConnected: Boolean
)

object WifiHelper {

    fun getWifiDetails(context: Context): WifiDetails {
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val network = cm?.activeNetwork
            val capabilities = cm?.getNetworkCapabilities(network)

            val isWifi = capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true

            if (!isWifi) {
                return WifiDetails(ssid = null, bssid = null, isConnected = false)
            }

            val wm = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val connectionInfo: WifiInfo? = wm?.connectionInfo

            var ssid = connectionInfo?.ssid
            if (ssid != null) {
                // Strip surrounding quotes if present: "<unknown ssid>" or "\"Office-WiFi\""
                if (ssid.startsWith("\"") && ssid.endsWith("\"") && ssid.length > 1) {
                    ssid = ssid.substring(1, ssid.length - 1)
                }
                if (ssid == "<unknown ssid>") {
                    ssid = null
                }
            }

            val bssid = connectionInfo?.bssid?.takeIf { it != "02:00:00:00:00:00" }

            WifiDetails(
                ssid = ssid,
                bssid = bssid,
                isConnected = true
            )
        } catch (e: Exception) {
            WifiDetails(ssid = null, bssid = null, isConnected = false)
        }
    }
}
