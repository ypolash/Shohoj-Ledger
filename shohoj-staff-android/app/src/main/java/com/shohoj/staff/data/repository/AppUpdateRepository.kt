package com.shohoj.staff.data.repository

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast
import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.AppUpdateInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AppUpdateRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager,
    private val context: Context
) {

    data class CheckResult(
        val isUpdateAvailable: Boolean,
        val updateInfo: AppUpdateInfo?,
        val currentVersionName: String,
        val currentVersionCode: Int
    )

    fun getCurrentAppVersion(): Pair<Int, String> {
        return try {
            val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode
            }
            val versionName = pInfo.versionName ?: "1.0.0"
            Pair(versionCode, versionName)
        } catch (e: Exception) {
            Pair(1, "1.0.0")
        }
    }

    suspend fun checkForUpdate(): Result<CheckResult> = withContext(Dispatchers.IO) {
        val (currentVersionCode, currentVersionName) = getCurrentAppVersion()

        try {
            val response = apiClient.getService().getAppVersion("staff")
            if (response.isSuccessful && response.body() != null) {
                val rawInfo = response.body()!!
                val resolvedDownloadUrl = resolveUrl(rawInfo.downloadUrl)
                val updateInfo = rawInfo.copy(downloadUrl = resolvedDownloadUrl)

                val available = isNewerVersion(
                    newCode = updateInfo.versionCode,
                    newName = updateInfo.versionName,
                    currentCode = currentVersionCode,
                    currentName = currentVersionName
                )

                Result.success(
                    CheckResult(
                        isUpdateAvailable = available,
                        updateInfo = if (available) updateInfo else null,
                        currentVersionName = currentVersionName,
                        currentVersionCode = currentVersionCode
                    )
                )
            } else {
                // Server returned non-success or empty body: no update available
                Result.success(
                    CheckResult(
                        isUpdateAvailable = false,
                        updateInfo = null,
                        currentVersionName = currentVersionName,
                        currentVersionCode = currentVersionCode
                    )
                )
            }
        } catch (e: Exception) {
            // Safe fallback on network failure: do not force phantom popups
            Result.success(
                CheckResult(
                    isUpdateAvailable = false,
                    updateInfo = null,
                    currentVersionName = currentVersionName,
                    currentVersionCode = currentVersionCode
                )
            )
        }
    }

    private fun resolveUrl(url: String): String {
        return if (url.startsWith("http://") || url.startsWith("https://")) {
            url
        } else {
            val base = sessionManager.baseUrl.trimEnd('/')
            val path = if (url.startsWith("/")) url else "/$url"
            base + path
        }
    }

    private fun isNewerVersion(newCode: Int, newName: String, currentCode: Int, currentName: String): Boolean {
        if (newCode > currentCode) return true
        return compareVersionStrings(newName, currentName) > 0
    }

    private fun compareVersionStrings(v1: String, v2: String): Int {
        val parts1 = v1.replace(Regex("[^0-9.]"), "").split(".").mapNotNull { it.toIntOrNull() }
        val parts2 = v2.replace(Regex("[^0-9.]"), "").split(".").mapNotNull { it.toIntOrNull() }
        val maxLen = maxOf(parts1.size, parts2.size)

        for (i in 0 until maxLen) {
            val num1 = parts1.getOrElse(i) { 0 }
            val num2 = parts2.getOrElse(i) { 0 }
            if (num1 != num2) {
                return num1.compareTo(num2)
            }
        }
        return 0
    }

    fun downloadAndInstallApk(downloadUrl: String, fileName: String = "shohoj-staff-v1.5.9.apk") {
        val fullUrl = resolveUrl(downloadUrl)

        // Trigger system DownloadManager with status bar notification
        try {
            val uri = Uri.parse(fullUrl)
            val segment = uri.lastPathSegment
            val effectiveFileName = if (!segment.isNullOrBlank() && segment.endsWith(".apk")) segment else fileName
            val request = DownloadManager.Request(uri).apply {
                setTitle("Shohoj Staff Update")
                setDescription("Downloading Shohoj Staff application update...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, effectiveFileName)
                setMimeType("application/vnd.android.package-archive")
                setAllowedOverMetered(true)
                setAllowedOverRoaming(true)
            }
            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as? DownloadManager
            dm?.enqueue(request)
            Toast.makeText(context, "Downloading Shohoj Staff update...", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            // Fallback gracefully
        }

        // Also open directly via browser intent so user sees immediate progress
        try {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(fullUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(browserIntent)
        } catch (e: Exception) {
            Toast.makeText(context, "Could not open browser to download: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
        }
    }
}
