import { Platform } from "react-native"
import * as Notifications from "expo-notifications"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

let ensurePromise

const configureAndroidChannel = async () => {
  if (Platform.OS !== "android") {
    return
  }

  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

const configureActions = async () => {
  await Notifications.setNotificationCategoryAsync("task-reminder-actions", [
    {
      identifier: "DONE_ACTION",
      buttonTitle: "Done",
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: "SNOOZE_ACTION",
      buttonTitle: "Snooze 15m",
      options: {
        opensAppToForeground: true,
      },
    },
  ])
}

export const ensureNotificationsReady = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      let permissionGranted = false
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        permissionGranted = finalStatus === "granted"
      } catch (error) {
        console.warn("Failed to resolve notification permissions", error)
      }

      try {
        await configureAndroidChannel()
        await configureActions()
      } catch (error) {
        console.warn("Failed to configure notification infrastructure", error)
      }

      return permissionGranted
    })()
      .catch((error) => {
        console.warn("Notification setup failed", error)
        return false
      })
  }

  return ensurePromise
}
