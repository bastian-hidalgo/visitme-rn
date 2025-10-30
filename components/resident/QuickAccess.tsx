import { LinearGradient } from 'expo-linear-gradient'
import { Bell, Calendar, Package, Users } from 'lucide-react-native'
import { AnimatePresence, MotiText, MotiView } from 'moti'
import { MotiPressable } from 'moti/interactions'
import { useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Easing } from 'react-native-reanimated'

const QUICK_ACTIONS = [
  { id: 'news', label: 'Noticias', icon: Bell },
  { id: 'reservations', label: 'Reservas', icon: Calendar },
  { id: 'invited', label: 'Invitados', icon: Users },
  { id: 'packages', label: 'Encomiendas', icon: Package },
] as const

interface Props {
  onNavigate: (id: string) => void
}

export default function QuickAccessBottom({ onNavigate }: Props) {
  const [active, setActive] = useState('news')

  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.95)', 'rgba(245,240,255,0.88)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, Platform.OS === 'android' && styles.containerAndroid]}
    >
      {QUICK_ACTIONS.map(action => {
        const Icon = action.icon
        const isActive = active === action.id

        return (
          <MotiPressable
            key={action.id}
            onPress={() => {
              setActive(action.id)
              onNavigate(action.id)
            }}
            animate={({ pressed }) => {
              'worklet'

              return {
                scale: pressed ? 0.96 : 1,
                opacity: pressed ? 0.8 : 1,
              }
            }}
          >
            {/* 🔹 Contenedor principal con retraso al cerrar */}
            <MotiView
              from={{ width: 46 }}
              animate={{
                width: isActive ? 110 : 46,
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                borderRadius: isActive ? 50 : 20,
              }}
              transition={{
                type: 'timing',
                duration: 200,
                delay: isActive ? 0 : 80, // espera un poco antes de cerrar
              }}
              style={styles.itemWrapper}
            >
              <View style={styles.iconContainer}>
                <Icon size={18} color={isActive ? '#6d28d9' : '#4338ca'} />
              </View>

              {/* 🔹 Texto con salida fluida antes del cierre */}
              <AnimatePresence>
                {isActive && (
                  <MotiText
                    from={{ opacity: 0, translateX: -6 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    exit={{ opacity: 0, translateX: -6 }}
                    transition={{
                      type: 'timing',
                      duration: 100,         // 🔹 un poco más largo = más smooth
                      delay: 60,             // 🔹 espera un poquito tras expandirse
                      easing: Easing.out(Easing.cubic), // 🔹 entrada y salida suaves
                    }}
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {action.label}
                  </MotiText>
                )}
              </AnimatePresence>
            </MotiView>
          </MotiPressable>
        )
      })}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    shadowColor: 'rgba(17, 24, 39, 0.15)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    backgroundColor: 'rgba(141, 100, 196, 1)',
    borderWidth: 1,
    borderColor: 'rgba(202,161,255,1)',
  },
  containerAndroid: {
    backgroundColor: 'rgba(141, 100, 196, 1)',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 38,
    paddingHorizontal: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '700',
    marginLeft: 6,
    maxWidth: 60,
  },
})
