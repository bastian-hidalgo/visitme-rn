import { useResidentContext } from '@/components/contexts/ResidentContext'
import ActionButton from '@/components/resident/ActionButton'
import InvitedCard from '@/components/resident/InvitedCard'
import EmptyActionCard from '@/components/ui/EmptyActionCard'
import { useUser } from '@/providers/user-provider'
import type { Database } from '@/types/supabase'
import { useRouter } from 'expo-router'
import { UserPlus } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useCallback } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'

type Visit = Database['public']['Tables']['visits']['Row']
type VisitItem = Visit | { id: 'new' }

export default function InvitedSlider() {
  const { visits } = useResidentContext()
  const { communitySlug } = useUser()
  const router = useRouter()

  const handleNavigateToWizard = useCallback(() => {
    if (communitySlug) {
      router.push({ pathname: '/invitations/new', params: { community: communitySlug } })
    } else {
      router.push('/invitations/new')
    }
  }, [communitySlug, router])

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
        <View>
          <Text style={styles.headerEyebrow}>Hora de las visitas</Text>
          <Text style={styles.headerTitle}>Tus Invitados</Text>
        </View>

        <ActionButton
          text="Invitar"
          icon={UserPlus}
          onPress={handleNavigateToWizard}
        />
      </View>

      {/* 🔹 Lista horizontal */}
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          if (!isVisit(item)) {
            return (
              <EmptyActionCard
                onCreate={handleNavigateToWizard}
                width={220}
                height={220}
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerEyebrow: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  separator: {
    width: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
})
