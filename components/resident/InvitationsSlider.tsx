import { useResidentContext } from '@/components/contexts/ResidentContext'
import ActionButton from '@/components/resident/ActionButton'
import InvitedCard from '@/components/resident/InvitedCard'
import EmptyActionCard from '@/components/ui/EmptyActionCard'
import type { Database } from '@/types/supabase'
import { UserPlus } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { FlatList, StyleSheet, Text, View, useColorScheme } from 'react-native'

type Visit = Database['public']['Tables']['visits']['Row']
type VisitItem = Visit | { id: 'new' }

export default function InvitedSlider() {
  const { visits, openInvitationPanel } = useResidentContext()
  const colorScheme = useColorScheme()

  const data: VisitItem[] = [
    ...visits,
    { id: 'new' },
  ]

  // 👇 type guard: asegura que item es Visit
  const isVisit = (item: VisitItem): item is Visit => item.id !== 'new'

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, colorScheme === 'dark' && styles.headerTitleDark]}>
          Tus Invitados
        </Text>

        <ActionButton
          text="Invitar"
          icon={UserPlus}
          onPress={openInvitationPanel}
        />
      </View>

      {/* 🔹 Lista horizontal */}
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          if (!isVisit(item)) {
            return (
              <EmptyActionCard
                onCreate={openInvitationPanel}
                width={140}
                height={200}
              >
                Realizar una{'\n'}invitación
              </EmptyActionCard>
            )
          }

          return (
            <InvitedCard
              scheduled_at={item.scheduled_at}
              visitor_name={item.visitor_name}
              license_plate={item.license_plate}
              guests={item.guests}
              code={item.code}
              secret_code={item.secret_code}
              onPress={() => {
                // abrir detalles del invitado
              }}
            />
          )
        }}
      />
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerTitleDark: {
    color: '#ffffff',
  },
  separator: {
    width: 16,
  },
})
