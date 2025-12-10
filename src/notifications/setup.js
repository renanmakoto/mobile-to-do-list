import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

import { NOTIFICATIONS } from '../constants'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

let initializationPromise = null

const configureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATIONS.CHANNEL_ID, {
    name: NOTIFICATIONS.CHANNEL_NAME,
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

const configureNotificationActions = async () => {
  await Notifications.setNotificationCategoryAsync(NOTIFICATIONS.CATEGORY_ID, [
    {
      identifier: NOTIFICATIONS.ACTIONS.DONE,
      buttonTitle: 'Done',
      options: { opensAppToForeground: true },
    },
    {
      identifier: NOTIFICATIONS.ACTIONS.SNOOZE,
      buttonTitle: 'Snooze 15m',
      options: { opensAppToForeground: true },
    },
  ])
}

const requestPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()

    if (existingStatus === 'granted') {
      return true
    }

    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    console.warn('Failed to resolve notification permissions:', error)
    return false
  }
}

export const ensureNotificationsReady = async () => {
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    const permissionGranted = await requestPermissions()

    try {
      await configureAndroidChannel()
      await configureNotificationActions()
    } catch (error) {
      console.warn('Failed to configure notification infrastructure:', error)
    }

    return permissionGranted
  })().catch((error) => {
    console.warn('Notification setup failed:', error)
    return false
  })

  return initializationPromise
}
