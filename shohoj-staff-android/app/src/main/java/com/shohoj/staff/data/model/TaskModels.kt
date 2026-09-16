package com.shohoj.staff.data.model

import com.google.gson.*
import com.google.gson.annotations.JsonAdapter
import com.google.gson.annotations.SerializedName
import java.lang.reflect.Type

data class TaskChecklistItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("completed") val completed: Boolean = false
)

class TaskChecklistAdapter : JsonDeserializer<TaskChecklist?>, JsonSerializer<TaskChecklist> {
    override fun serialize(
        src: TaskChecklist?,
        typeOfSrc: Type?,
        context: JsonSerializationContext?
    ): JsonElement {
        val obj = JsonObject()
        if (src != null) {
            obj.addProperty("type", src.type)
            val array = JsonArray()
            src.items.forEach { item ->
                val itemObj = JsonObject()
                itemObj.addProperty("id", item.id)
                itemObj.addProperty("title", item.title)
                itemObj.addProperty("completed", item.completed)
                array.add(itemObj)
            }
            obj.add("items", array)
        }
        return obj
    }

    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): TaskChecklist? {
        if (json == null || json.isJsonNull) return null
        return try {
            if (json.isJsonObject) {
                val obj = json.asJsonObject
                val type = if (obj.has("type") && !obj.get("type").isJsonNull) obj.get("type").asString else "CHECKLIST"
                val items = mutableListOf<TaskChecklistItem>()
                val itemsElem = when {
                    obj.has("items") -> obj.get("items")
                    obj.has("todos") -> obj.get("todos")
                    else -> null
                }
                if (itemsElem != null && itemsElem.isJsonArray) {
                    itemsElem.asJsonArray.forEach { elem ->
                        if (elem.isJsonObject) {
                            val itemObj = elem.asJsonObject
                            items.add(
                                TaskChecklistItem(
                                    id = if (itemObj.has("id") && !itemObj.get("id").isJsonNull) itemObj.get("id").asString else "",
                                    title = if (itemObj.has("title") && !itemObj.get("title").isJsonNull) itemObj.get("title").asString else "",
                                    completed = if (itemObj.has("completed") && !itemObj.get("completed").isJsonNull) itemObj.get("completed").asBoolean else false
                                )
                            )
                        }
                    }
                }
                TaskChecklist(type = type, items = items)
            } else if (json.isJsonArray) {
                val items = mutableListOf<TaskChecklistItem>()
                json.asJsonArray.forEach { elem ->
                    if (elem.isJsonObject) {
                        val itemObj = elem.asJsonObject
                        items.add(
                            TaskChecklistItem(
                                id = if (itemObj.has("id") && !itemObj.get("id").isJsonNull) itemObj.get("id").asString else "",
                                title = if (itemObj.has("title") && !itemObj.get("title").isJsonNull) itemObj.get("title").asString else "",
                                completed = if (itemObj.has("completed") && !itemObj.get("completed").isJsonNull) itemObj.get("completed").asBoolean else false
                            )
                        )
                    }
                }
                TaskChecklist(type = "CHECKLIST", items = items)
            } else if (json.isJsonPrimitive && json.asJsonPrimitive.isString) {
                val str = json.asString.trim()
                if (str.isEmpty() || str == "null") return null
                @Suppress("DEPRECATION")
                val parsed = JsonParser().parse(str)
                deserialize(parsed, typeOfT, context)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}

@JsonAdapter(TaskChecklistAdapter::class)
data class TaskChecklist(
    @SerializedName("type") val type: String = "CHECKLIST",
    @SerializedName("items") val items: List<TaskChecklistItem> = emptyList()
)

data class TaskItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("status") val status: String = "Pending", // "Pending", "In Progress", "Completed", "Blocked"
    @SerializedName("priority") val priority: String? = "Medium", // "Low", "Medium", "High", "Urgent"
    @SerializedName("dueDate") val dueDate: String? = null,
    @SerializedName("assignedToEmployeeId") val assignedToEmployeeId: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("checklist") val checklist: TaskChecklist? = null
)

data class TaskListResponse(
    @SerializedName("tasks") val tasks: List<TaskItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class TaskStatusUpdateRequest(
    @SerializedName("status") val status: String? = null,
    @SerializedName("checklist") val checklist: TaskChecklist? = null
)
