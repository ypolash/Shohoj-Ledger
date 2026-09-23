package com.shohoj.staff.util

import com.shohoj.staff.data.model.CommunityAttachment

object MediaUtils {

    /**
     * Resolves a media or file URL against the server baseUrl.
     * If the URL is relative (e.g., "/uploads/community/xyz.jpg" or "uploads/xyz.jpg"),
     * it prepends the configured server base URL.
     */
    fun resolveMediaUrl(url: String?, baseUrl: String): String? {
        if (url.isNullOrBlank()) return null
        val trimmed = url.trim()
        if (trimmed.startsWith("http://", ignoreCase = true) ||
            trimmed.startsWith("https://", ignoreCase = true) ||
            trimmed.startsWith("content://", ignoreCase = true) ||
            trimmed.startsWith("file://", ignoreCase = true)
        ) {
            return trimmed
        }

        val cleanBase = baseUrl.trim().trimEnd('/')
        val cleanPath = trimmed.trimStart('/')
        return "$cleanBase/$cleanPath"
    }

    /**
     * Determines if a chat attachment is an image based on its MIME type, fileName extension, or fileUrl extension.
     */
    fun isImageAttachment(attachment: CommunityAttachment?): Boolean {
        if (attachment == null) return false
        return isImageMimeOrExt(
            mimeType = attachment.fileType,
            fileName = attachment.fileName,
            fileUrl = attachment.fileUrl
        )
    }

    /**
     * Checks if the combination of MIME type, filename, or fileUrl corresponds to an image format.
     */
    fun isImageMimeOrExt(mimeType: String?, fileName: String?, fileUrl: String?): Boolean {
        val type = (mimeType ?: "").trim().lowercase()
        if (type.startsWith("image/")) return true

        val nameOrUrl = (fileName?.takeIf { it.isNotBlank() } ?: fileUrl ?: "").trim().lowercase()
        val clean = nameOrUrl.substringBefore('?').substringBefore('#')
        val ext = clean.substringAfterLast('.', "")

        return ext in listOf("jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "ico", "avif", "heic")
    }
}
