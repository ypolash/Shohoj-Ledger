package com.shohoj.staff.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.Cyan400
import java.util.regex.Pattern

object UrlUtils {

    // Matches markdown links [Label](https://url) or plain URLs
    private val COMBINED_LINK_PATTERN: Pattern = Pattern.compile(
        "(\\[([^\\]]+)\\]\\(((?:https?://|www\\.)[^\\s)]+)\\))|((?:https?://|www\\.)[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|])",
        Pattern.CASE_INSENSITIVE
    )

    fun containsUrl(text: String?): Boolean {
        if (text.isNullOrBlank()) return false
        return COMBINED_LINK_PATTERN.matcher(text).find()
    }

    fun extractFirstUrl(text: String?): String? {
        if (text.isNullOrBlank()) return null
        val matcher = COMBINED_LINK_PATTERN.matcher(text)
        if (matcher.find()) {
            val mdUrl = matcher.group(3)
            if (!mdUrl.isNullOrBlank()) return mdUrl
            val plainUrl = matcher.group(4)
            if (!plainUrl.isNullOrBlank()) return plainUrl
        }
        return null
    }

    fun formatUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim()
        return when {
            trimmed.startsWith("http://", ignoreCase = true) -> trimmed
            trimmed.startsWith("https://", ignoreCase = true) -> trimmed
            trimmed.startsWith("www.", ignoreCase = true) -> "https://$trimmed"
            else -> "https://$trimmed"
        }
    }

    fun openBrowser(context: Context, rawUrl: String) {
        try {
            val formatted = formatUrl(rawUrl)
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(formatted)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(
                context,
                "Could not open browser: ${e.localizedMessage ?: "Invalid link"}",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    fun buildAnnotatedStringWithUrls(
        text: String,
        normalColor: Color,
        linkColor: Color,
        baseDecoration: TextDecoration
    ): AnnotatedString {
        if (text.isBlank()) return AnnotatedString("")

        val matcher = COMBINED_LINK_PATTERN.matcher(text)
        if (!matcher.find()) {
            return buildAnnotatedString {
                append(text)
                addStyle(
                    SpanStyle(color = normalColor, textDecoration = baseDecoration),
                    0,
                    text.length
                )
            }
        }

        matcher.reset()
        return buildAnnotatedString {
            var lastIndex = 0
            while (matcher.find()) {
                val start = matcher.start()
                val end = matcher.end()

                // Normal text before match
                if (start > lastIndex) {
                    val normalPart = text.substring(lastIndex, start)
                    val normalStart = length
                    append(normalPart)
                    addStyle(
                        SpanStyle(color = normalColor, textDecoration = baseDecoration),
                        normalStart,
                        length
                    )
                }

                val mdLabel = matcher.group(2)
                val mdUrl = matcher.group(3)
                val plainUrl = matcher.group(4)

                val displayText = if (!mdLabel.isNullOrBlank()) mdLabel else plainUrl ?: ""
                val targetUrl = if (!mdUrl.isNullOrBlank()) mdUrl else plainUrl ?: ""

                val linkStart = length
                append(displayText)
                val linkEnd = length

                // Style for clickable link
                addStyle(
                    SpanStyle(
                        color = linkColor,
                        textDecoration = TextDecoration.Underline,
                        fontWeight = FontWeight.SemiBold
                    ),
                    linkStart,
                    linkEnd
                )
                addStringAnnotation(
                    tag = "URL",
                    annotation = targetUrl,
                    start = linkStart,
                    end = linkEnd
                )

                lastIndex = end
            }

            // Trailing text
            if (lastIndex < text.length) {
                val normalPart = text.substring(lastIndex)
                val normalStart = length
                append(normalPart)
                addStyle(
                    SpanStyle(color = normalColor, textDecoration = baseDecoration),
                    normalStart,
                    length
                )
            }
        }
    }
}

/**
 * Renders text containing URLs (plain or markdown links), automatically linkifying
 * matching web addresses so tapping on them opens the external web browser directly.
 */
@Composable
fun ClickableUrlText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
    normalColor: Color = Color.Unspecified,
    linkColor: Color = Cyan400,
    textDecoration: TextDecoration = TextDecoration.None,
    onTextClick: (() -> Unit)? = null,
    onUrlClick: ((String) -> Unit)? = null
) {
    val context = LocalContext.current
    val effectiveUrlClick = onUrlClick ?: { url -> UrlUtils.openBrowser(context, url) }

    val annotatedString = remember(text, normalColor, linkColor, textDecoration) {
        UrlUtils.buildAnnotatedStringWithUrls(text, normalColor, linkColor, textDecoration)
    }

    ClickableText(
        text = annotatedString,
        modifier = modifier,
        style = style,
        onClick = { offset ->
            val annotations = annotatedString.getStringAnnotations(
                tag = "URL",
                start = offset,
                end = offset
            )
            if (annotations.isNotEmpty()) {
                val targetUrl = annotations.first().item
                effectiveUrlClick(targetUrl)
            } else {
                onTextClick?.invoke()
            }
        }
    )
}
