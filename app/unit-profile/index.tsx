import { useResidentContext } from '@/components/contexts/ResidentContext';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { usePets } from '@/hooks/usePets';
import { useRecurrentVisits } from '@/hooks/useRecurrentVisits';
import { useVehicles } from '@/hooks/useVehicles';
import type { HouseholdMember, HouseholdMemberInput, Pet, PetInput, RecurrentVisit, RecurrentVisitInput, Vehicle, VehicleInput } from '@/types/unit-profile';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { CalendarClock, Car, ChevronDown, Home, PawPrint, Plus, Users } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HouseholdMemberCard } from '@/components/resident/unit-profile/HouseholdMemberCard';
import { HouseholdMemberFormModal } from '@/components/resident/unit-profile/HouseholdMemberFormModal';
import { PetCard } from '@/components/resident/unit-profile/PetCard';
import { PetFormModal } from '@/components/resident/unit-profile/PetFormModal';
import { RecurrentVisitCard } from '@/components/resident/unit-profile/RecurrentVisitCard';
import { RecurrentVisitFormModal } from '@/components/resident/unit-profile/RecurrentVisitFormModal';
import { VehicleCard } from '@/components/resident/unit-profile/VehicleCard';
import { VehicleFormModal } from '@/components/resident/unit-profile/VehicleFormModal';

type SectionKey = 'pets' | 'household' | 'vehicles' | 'visits';

interface SectionState {
  key: SectionKey;
  title: string;
  icon: React.ElementType;
  color: string;
  expanded: boolean;
}

const INITIAL_SECTIONS: SectionState[] = [
  { key: 'pets', title: 'Mascotas', icon: PawPrint, color: '#f59e0b', expanded: false },
  { key: 'household', title: 'Cargas Familiares', icon: Users, color: '#8b5cf6', expanded: false },
  { key: 'vehicles', title: 'Vehículos', icon: Car, color: '#3b82f6', expanded: false },
  { key: 'visits', title: 'Visitas Recurrentes', icon: CalendarClock, color: '#10b981', expanded: false },
];

const SINGULAR_TITLES: Record<SectionKey, string> = {
  pets: 'mascota',
  household: 'carga familiar',
  vehicles: 'vehículo',
  visits: 'visita recurrente',
};

const sectionLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180)
  .mass(0.9);

export default function UnitProfileScreen() {
  const { residentDepartments } = useResidentContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Obtener el primer department_id del residente
  const departmentId = residentDepartments.length > 0 ? residentDepartments[0].department_id : null;

  // Hooks para cada entidad
  const { pets, loading: loadingPets, createPet, updatePet, confirmDelete: confirmDeletePet, refresh: refreshPets } = usePets(departmentId);
  const { members, loading: loadingMembers, createMember, updateMember, confirmDelete: confirmDeleteMember, refresh: refreshMembers } = useHouseholdMembers(departmentId);
  const { vehicles, loading: loadingVehicles, createVehicle, updateVehicle, confirmDelete: confirmDeleteVehicle, refresh: refreshVehicles } = useVehicles(departmentId);
  const { visits, loading: loadingVisits, createVisit, updateVisit, confirmDelete: confirmDeleteVisit, refresh: refreshVisits } = useRecurrentVisits(departmentId);

  // Estado de secciones expandibles
  const [sections, setSections] = useState<SectionState[]>(INITIAL_SECTIONS);

  // Estado de modales
  const [activeModal, setActiveModal] = useState<SectionKey | null>(null);
  const [editingItem, setEditingItem] = useState<Pet | HouseholdMember | Vehicle | RecurrentVisit | null>(null);

  // Estado de refreshing
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const openAddModal = useCallback((key: SectionKey) => {
    setEditingItem(null);
    setActiveModal(key);
  }, []);

  const openEditModal = useCallback((key: SectionKey, item: any) => {
    setEditingItem(item);
    setActiveModal(key);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditingItem(null);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshPets(), refreshMembers(), refreshVehicles(), refreshVisits()]);
    setRefreshing(false);
  }, [refreshPets, refreshMembers, refreshVehicles, refreshVisits]);

  // Handlers para guardar
  const handleSavePet = useCallback(async (input: PetInput): Promise<boolean> => {
    if (editingItem) {
      return updatePet((editingItem as Pet).id, input);
    }
    return createPet(input);
  }, [editingItem, createPet, updatePet]);

  const handleSaveMember = useCallback(async (input: HouseholdMemberInput): Promise<boolean> => {
    if (editingItem) {
      return updateMember((editingItem as HouseholdMember).id, input);
    }
    return createMember(input);
  }, [editingItem, createMember, updateMember]);

  const handleSaveVehicle = useCallback(async (input: VehicleInput): Promise<boolean> => {
    if (editingItem) {
      return updateVehicle((editingItem as Vehicle).id, input);
    }
    return createVehicle(input);
  }, [editingItem, createVehicle, updateVehicle]);

  const handleSaveVisit = useCallback(async (input: RecurrentVisitInput): Promise<boolean> => {
    if (editingItem) {
      return updateVisit((editingItem as RecurrentVisit).id, input as Partial<RecurrentVisitInput>);
    }
    return createVisit(input);
  }, [editingItem, createVisit, updateVisit]);

  const isLoading = loadingPets || loadingMembers || loadingVehicles || loadingVisits;

  const departmentLabel = residentDepartments.length > 0
    ? residentDepartments.map(d => d.label).join(', ')
    : 'Sin departamento asignado';

  const getCount = useCallback((key: SectionKey) => {
    switch (key) {
      case 'pets': return pets.length;
      case 'household': return members.length;
      case 'vehicles': return vehicles.length;
      case 'visits': return visits.length;
    }
  }, [pets.length, members.length, vehicles.length, visits.length]);

  const toggleSection = useCallback((key: SectionKey) => {
    setSections((prev) => {
      const currentSection = prev.find((s) => s.key === key);
      const isExpanding = !currentSection?.expanded;

      if (!isExpanding) {
        return prev.map((s) => (s.key === key ? { ...s, expanded: false } : s));
      }

      return prev.map((s) => ({ ...s, expanded: s.key === key }));
    });
  }, []);

  const renderSection = useCallback((section: SectionState) => {
    const count = getCount(section.key);
    const isEmpty = count === 0;
    const Icon = section.icon;

    return (
      <Animated.View
        key={section.key}
        layout={sectionLayoutTransition}
        style={styles.section}
      >
        <Pressable
          style={[
            styles.sectionHeader,
            section.expanded && styles.sectionHeaderExpanded
          ]}
          onPress={() => toggleSection(section.key)}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: section.color + '20' }]}>
              <Icon size={22} color={section.color} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>
                {count} registrado{count !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.sectionHeaderRight}>
            {!isEmpty && (
              <Pressable
                style={[styles.addButtonSmall, { backgroundColor: section.color }]}
                onPress={(e) => {
                  e.stopPropagation();
                  openAddModal(section.key);
                }}
                hitSlop={8}
              >
                <Plus size={14} color="#fff" />
              </Pressable>
            )}
            <View style={styles.chevronContainer}>
              <MotiView
                animate={{ rotate: section.expanded ? '180deg' : '0deg' }}
                transition={{ type: 'timing', duration: 220 }}
              >
                <ChevronDown size={20} color="#9ca3af" />
              </MotiView>
            </View>
          </View>
        </Pressable>

        <AnimatePresence initial={false}>
          {section.expanded && (
            <Animated.View
              key={`${section.key}-content`}
              layout={sectionLayoutTransition}
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
              style={styles.sectionContentWrapper}
            >
              <View style={styles.sectionContent}>
                {isEmpty ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIconWrapper, { backgroundColor: section.color + '15' }]}>
                      <Icon size={32} color={section.color} />
                    </View>
                    <Text style={styles.emptyText}>
                      No hay {section.title.toLowerCase()} registrados
                    </Text>
                    <Pressable
                      style={[styles.addButton, { backgroundColor: section.color }]}
                      onPress={() => openAddModal(section.key)}
                    >
                      <Plus size={18} color="#fff" />
                      <Text style={styles.addButtonText}>Agregar {SINGULAR_TITLES[section.key]}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    {section.key === 'pets' && pets.map((pet) => (
                      <PetCard
                        key={pet.id}
                        pet={pet}
                        onEdit={() => openEditModal('pets', pet)}
                        onDelete={() => confirmDeletePet(pet.id, pet.name)}
                      />
                    ))}
                    {section.key === 'household' && members.map((member) => (
                      <HouseholdMemberCard
                        key={member.id}
                        member={member}
                        onEdit={() => openEditModal('household', member)}
                        onDelete={() => confirmDeleteMember(member.id, member.name)}
                      />
                    ))}
                    {section.key === 'vehicles' && vehicles.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onEdit={() => openEditModal('vehicles', vehicle)}
                        onDelete={() => confirmDeleteVehicle(vehicle.id, vehicle.license_plate)}
                      />
                    ))}
                    {section.key === 'visits' && visits.map((visit) => (
                      <RecurrentVisitCard
                        key={visit.id}
                        visit={visit}
                        onEdit={() => openEditModal('visits', visit)}
                        onDelete={() => confirmDeleteVisit(visit.id, visit.name)}
                      />
                    ))}
                  </>
                )}
              </View>
            </Animated.View>
          )}
        </AnimatePresence>
      </Animated.View>
    );
  }, [pets, members, vehicles, visits, getCount, toggleSection, openAddModal, openEditModal, confirmDeletePet, confirmDeleteMember, confirmDeleteVehicle, confirmDeleteVisit]);

  if (!departmentId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.noDepartmentContainer}>
          <View style={styles.noDepartmentIcon}>
            <Home size={48} color="#9ca3af" />
          </View>
          <Text style={styles.noDepartmentTitle}>Sin departamento</Text>
          <Text style={styles.noDepartmentText}>
            No tienes un departamento asignado.{'\n'}Contacta a la administración para registrar tu unidad.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header con gradiente elegante */}
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.pillButton}>
            <Text style={styles.pillButtonText}>← Volver al inicio</Text>
          </Pressable>
          <View style={styles.headerTop}>
            <View style={styles.headerIconContainer}>
              <View style={styles.headerIcon}>
                <Home size={24} color="#7c3aed" />
              </View>
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Mi hogar</Text>
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>{departmentLabel}</Text>
              </View>
            </View>
          </View>
          
          {/* Stats summary */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pets.length}</Text>
              <Text style={styles.statLabel}>Mascotas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Familiares</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{vehicles.length}</Text>
              <Text style={styles.statLabel}>Vehículos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{visits.length}</Text>
              <Text style={styles.statLabel}>Visitas</Text>
            </View>
          </View>
        </View>
        
        {/* Forma decorativa inferior */}
        <View style={styles.headerWave}>
          <View style={styles.headerWaveInner} />
        </View>
      </LinearGradient>

      <View style={styles.container}>
        {/* Lista de secciones */}
        <FlatList
          ref={flatListRef}
          data={sections}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => renderSection(item)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7c3aed"
              colors={['#7c3aed']}
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* Modales */}
      <PetFormModal
        visible={activeModal === 'pets'}
        onClose={closeModal}
        onSave={handleSavePet}
        pet={editingItem as Pet | null}
        departmentId={departmentId}
      />
      <HouseholdMemberFormModal
        visible={activeModal === 'household'}
        onClose={closeModal}
        onSave={handleSaveMember}
        member={editingItem as HouseholdMember | null}
        departmentId={departmentId}
      />
      <VehicleFormModal
        visible={activeModal === 'vehicles'}
        onClose={closeModal}
        onSave={handleSaveVehicle}
        vehicle={editingItem as Vehicle | null}
        departmentId={departmentId}
      />
      <RecurrentVisitFormModal
        visible={activeModal === 'visits'}
        onClose={closeModal}
        onSave={handleSaveVisit}
        visit={editingItem as RecurrentVisit | null}
        departmentId={departmentId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 0,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pillButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  pillButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  headerIconContainer: {
    position: 'relative',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  departmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  departmentText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  headerWave: {
    height: 24,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerWaveInner: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#1f2937',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionContentWrapper: {
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  noDepartmentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  noDepartmentIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  noDepartmentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  noDepartmentText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
