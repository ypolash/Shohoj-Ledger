package com.shohoj.staff.util

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object LocationHelper {

    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(context: Context): Location? {
        return try {
            val fusedClient = LocationServices.getFusedLocationProviderClient(context)
            val cts = CancellationTokenSource()

            suspendCancellableCoroutine { continuation ->
                fusedClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.token)
                    .addOnSuccessListener { loc: Location? ->
                        if (loc != null) {
                            continuation.resume(loc)
                        } else {
                            // Fallback to last known location
                            fusedClient.lastLocation.addOnSuccessListener { lastLoc ->
                                continuation.resume(lastLoc ?: fallbackToLocationManager(context))
                            }.addOnFailureListener {
                                continuation.resume(fallbackToLocationManager(context))
                            }
                        }
                    }
                    .addOnFailureListener {
                        continuation.resume(fallbackToLocationManager(context))
                    }

                continuation.invokeOnCancellation {
                    cts.cancel()
                }
            }
        } catch (e: Exception) {
            fallbackToLocationManager(context)
        }
    }

    @SuppressLint("MissingPermission")
    private fun fallbackToLocationManager(context: Context): Location? {
        return try {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            val gpsLoc = lm?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val netLoc = lm?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            gpsLoc ?: netLoc
        } catch (e: Exception) {
            null
        }
    }
}
