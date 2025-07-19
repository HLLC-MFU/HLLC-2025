import { VersionSetting } from "@/types/version-setting"
import { apiRequest } from "@/utils/api"
import { addToast } from "@heroui/react"
import { useEffect, useState } from "react"

export function useVersionSetting() {
  const [versionSetting, setVersionSetting] = useState<VersionSetting | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVersionSetting = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest<VersionSetting>("/version-setting")

      setVersionSetting(res.data ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch version setting"
      setError(message)

      addToast({
        title: "Failed to fetch version setting",
        description: message,
        color: "danger",
      })

    } finally {
      setLoading(false)
    }
  }

  const updateVersionSetting = async (data: { appVersion: string; buildNumber: number }) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest<{ data: VersionSetting }>("/version-setting", "POST", data)

      if (res.statusCode !== 200 && res.statusCode !== 201) {
        throw new Error(res.message || "Failed to update version setting.")
      }

      setVersionSetting(res.data?.data ?? null)

      addToast({
        title: "Version setting updated",
        color: "success",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update version setting"
      setError(message)

      addToast({
        title: "Failed to update version setting",
        description: message,
        color: "danger",
      })

    } finally {
      setLoading(false)
    }
  }

  const deleteVersionSetting = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest("/version-setting", "DELETE")
			console.log(res);
			

      if (res.statusCode !== 200 && res.statusCode !== 204) {
        throw new Error(res.message || "Failed to delete version setting.")
      }

      setVersionSetting(null)

      addToast({
        title: "Version setting deleted",
        color: "success",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete version setting"
      setError(message)
      addToast({
        title: "Failed to delete version setting",
        description: message,
        color: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVersionSetting()
  }, [])

  return {
    versionSetting,
    loading,
    error,
    fetchVersionSetting,
    updateVersionSetting,
    deleteVersionSetting,
  }
}