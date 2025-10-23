import type { LucideIcon } from 'lucide-react-native'
import { MotiPressable, MotiPressableInteractionState } from 'moti/interactions'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface ActionButtonProps {
  text: string
  icon?: LucideIcon
  onPress?: () => void
  disabled?: boolean
  size?: 'base' | 'sm'
}

export default function ActionButton({
  text,
  icon: Icon,
  onPress,
  disabled = false,
  size = 'base',
}: ActionButtonProps) {
  const paddingStyle = size === 'base' ? styles.buttonBase : styles.buttonSmall
  const textStyle = size === 'base' ? styles.buttonText : styles.buttonTextSmall

  return (
    <MotiPressable
      disabled={disabled}
      onPress={onPress}
      animate={({ pressed }: MotiPressableInteractionState) => {
        'worklet'
        return {
          scale: pressed ? 0.95 : 1,
          opacity: disabled ? 0.6 : 1,
        }
      }}
      transition={{ type: 'timing', duration: 100 }}
    >
      <View
        style={[
          styles.button,
          paddingStyle,
          disabled && styles.buttonDisabled,
        ]}
      >
        {Icon && <Icon size={16} color="#fff" />}
        <Text
          style={[
            textStyle,
            styles.buttonLabel,
          ]}
        >
          {text}
        </Text>
      </View>
    </MotiPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f97316',
  },
  buttonBase: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 14,
  },
  buttonTextSmall: {
    fontSize: 12,
  },
})
