type ImagePickerModule = typeof import('expo-image-picker')
type PermissionStatusValue = string | undefined

type PermissionCheckOptions = {
  ImagePicker: ImagePickerModule
  onDenied: () => void
}

const isGrantedStatus = (
  status: PermissionStatusValue,
  ExpoPermissionStatus: ImagePickerModule['PermissionStatus'] | undefined
) => {
  if (!status) return false

  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : undefined
  const grantedStatuses = ['granted', 'limited']

  if (ExpoPermissionStatus) {
    if (
      status === ExpoPermissionStatus.GRANTED ||
      status === 'granted' ||
      normalizedStatus === 'granted'
    ) {
      return true
    }

    if (
      'LIMITED' in ExpoPermissionStatus &&
      (status === ExpoPermissionStatus.LIMITED || normalizedStatus === 'limited')
    ) {
      return true
    }
  }

  return normalizedStatus ? grantedStatuses.includes(normalizedStatus) : false
}

export const ensureMediaLibraryPermission = async ({
  ImagePicker,
  onDenied,
}: PermissionCheckOptions) => {
  const {
    getMediaLibraryPermissionsAsync,
    requestMediaLibraryPermissionsAsync,
    PermissionStatus: ExpoPermissionStatus,
  } = ImagePicker

  const currentPermission = await getMediaLibraryPermissionsAsync?.()

  if (
    currentPermission?.granted ||
    isGrantedStatus(currentPermission?.status, ExpoPermissionStatus)
  ) {
    return true
  }

  if (currentPermission && currentPermission.canAskAgain === false) {
    onDenied()
    return false
  }

  if (!requestMediaLibraryPermissionsAsync) {
    onDenied()
    return false
  }

  const requestedPermission = await requestMediaLibraryPermissionsAsync()

  if (requestedPermission.granted) {
    return true
  }

  if (isGrantedStatus(requestedPermission.status, ExpoPermissionStatus)) {
    return true
  }

  onDenied()
  return false
}
