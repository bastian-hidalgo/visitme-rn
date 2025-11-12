import { useResidentContext } from '@/components/contexts/ResidentContext'
import { formatDateLogical } from '@/lib/time'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'

type AnswerMap = Record<string, string>

type SurveyQuestion = {
  id: string | number
  question: string
  type: 'yes_no' | 'multiple' | 'text'
  options?: unknown
  is_required?: boolean
}

const YES_NO_OPTIONS = ['Sí', 'No']

const parseOptions = (raw: unknown): string[] => {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.map((value) => String(value))
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value))
      }
    } catch {
      // noop -> fallback to splitting below
    }

    return raw
      .split('|')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  }

  return []
}

export default function SurveyPanel() {
  const {
    isSurveyPanelOpen,
    selectedSurvey,
    loadingSurveys,
    closePanels,
    refreshSurveys,
  } = useResidentContext()
  const { userDepartments } = useUser()

  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['92%'], [])

  const [answers, setAnswers] = useState<AnswerMap>({})
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasMultipleDepartments = userDepartments.length > 1

  useEffect(() => {
    const sheet = bottomSheetRef.current
    if (!sheet) return

    if (isSurveyPanelOpen) {
      sheet.present()
    } else {
      sheet.dismiss()
    }
  }, [isSurveyPanelOpen])

  useEffect(() => {
    if (userDepartments.length === 1) {
      setSelectedDepartmentId(userDepartments[0].department_id)
    }
  }, [userDepartments])

  useEffect(() => {
    if (!isSurveyPanelOpen) {
      setAnswers({})
      setSubmitting(false)
      if (userDepartments.length !== 1) {
        setSelectedDepartmentId(null)
      }
    } else {
      setAnswers({})
      setSubmitting(false)
    }
  }, [isSurveyPanelOpen, userDepartments.length])

  useEffect(() => {
    setAnswers({})
    setSubmitting(false)
  }, [selectedSurvey])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        style={{ backgroundColor: 'rgba(15,23,42,0.65)' }}
      />
    ),
    []
  )

  const handleChange = useCallback((questionId: string | number, value: string) => {
    const key = String(questionId)
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSelectDepartment = useCallback((departmentId: string) => {
    setSelectedDepartmentId(departmentId)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedSurvey) return

    if (!selectedDepartmentId) {
      Toast.show({
        type: 'info',
        text1: 'Selecciona un departamento para responder la encuesta.',
      })
      return
    }

    if (selectedSurvey.alreadyAnswered) {
      Toast.show({
        type: 'info',
        text1: 'Este departamento ya respondió esta encuesta.',
      })
      return
    }

    const questions = Array.isArray(selectedSurvey.survey_questions)
      ? selectedSurvey.survey_questions
      : []

    if (!questions.length) {
      Toast.show({
        type: 'info',
        text1: 'Esta encuesta no tiene preguntas disponibles por ahora.',
      })
      return
    }

    const hasMissingRequired = questions.some((question) => {
      if (!question?.is_required) return false
      const key = String(question.id)
      return !answers[key]
    })

    if (hasMissingRequired) {
      Toast.show({
        type: 'info',
        text1: 'Responde todas las preguntas obligatorias.',
      })
      return
    }

    setSubmitting(true)

    try {
      const entries = questions.map((question) => ({
        survey_id: selectedSurvey.id,
        question_id: question.id,
        response: answers[String(question.id)] ?? null,
        department_id: selectedDepartmentId,
      }))

      const { error } = await supabase.from('survey_responses').insert(entries)
      if (error) {
        throw error
      }

      Toast.show({
        type: 'success',
        text1: '¡Gracias por participar!',
        text2: 'Tus respuestas fueron enviadas correctamente.',
      })

      await refreshSurveys()
      closePanels()
    } catch (error) {
      console.error('[SurveyPanel] submit error', error)
      Toast.show({
        type: 'error',
        text1: 'No pudimos enviar tus respuestas.',
        text2: 'Inténtalo nuevamente en unos minutos.',
      })
    } finally {
      setSubmitting(false)
    }
  }, [
    answers,
    closePanels,
    refreshSurveys,
    selectedDepartmentId,
    selectedSurvey,
  ])

  const questions = useMemo(() => {
    if (!selectedSurvey || !Array.isArray(selectedSurvey.survey_questions)) {
      return []
    }

    return selectedSurvey.survey_questions as SurveyQuestion[]
  }, [selectedSurvey])

  const expiresAtLabel = selectedSurvey?.expires_at
    ? formatDateLogical(selectedSurvey.expires_at)
    : null

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={closePanels}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Responder encuesta</Text>
            {selectedSurvey?.title ? (
              <Text style={styles.surveyTitle}>{selectedSurvey.title}</Text>
            ) : null}
            {selectedSurvey?.description ? (
              <Text style={styles.surveyDescription}>{selectedSurvey.description}</Text>
            ) : null}
            {expiresAtLabel ? (
              <Text style={styles.surveyMeta}>Vigente hasta: {expiresAtLabel}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={closePanels}
            hitSlop={12}
            style={styles.closeButton}
          >
            <X size={18} color="#1F2937" />
          </Pressable>
        </View>

        {loadingSurveys ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color="#6D28D9" />
            <Text style={styles.loaderText}>Cargando encuesta...</Text>
          </View>
        ) : null}

        {!loadingSurveys && !selectedSurvey ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No se encontró la encuesta seleccionada.</Text>
          </View>
        ) : null}

        {!loadingSurveys && selectedSurvey ? (
          <View style={styles.body}>
            {hasMultipleDepartments ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Responder desde el departamento</Text>
                <View style={styles.departmentGrid}>
                  {userDepartments.map((department) => {
                    const isSelected = department.department_id === selectedDepartmentId
                    return (
                      <Pressable
                        key={department.department_id}
                        onPress={() => handleSelectDepartment(department.department_id)}
                        style={[
                          styles.departmentChip,
                          isSelected && styles.departmentChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.departmentLabel,
                            isSelected && styles.departmentLabelActive,
                          ]}
                        >
                          {department.department}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ) : null}

            {!hasMultipleDepartments && userDepartments.length === 1 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Respondiendo desde</Text>
                <View style={styles.singleDepartment}>
                  <Text style={styles.singleDepartmentText}>
                    {userDepartments[0]?.department ?? 'Departamento asignado'}
                  </Text>
                </View>
              </View>
            ) : null}

            {selectedSurvey.alreadyAnswered ? (
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>Encuesta respondida</Text>
                <Text style={styles.alertDescription}>
                  Este departamento ya respondió esta encuesta. ¡Gracias por participar!
                </Text>
              </View>
            ) : null}

            {questions.map((question, index) => {
              const key = String(question.id)
              const selectedValue = answers[key] ?? ''
              const isDisabled = submitting || Boolean(selectedSurvey?.alreadyAnswered)

              const renderChoices = (options: string[]) => (
                <View style={styles.optionGroup}>
                  {options.map((option) => {
                    const isSelected = selectedValue === option
                    return (
                      <Pressable
                        key={option}
                        onPress={() => !isDisabled && handleChange(question.id, option)}
                        style={[
                          styles.option,
                          isSelected && styles.optionActive,
                          isDisabled && styles.optionDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelActive,
                            isDisabled && styles.optionLabelDisabled,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )

              const renderInput = () => {
                if (question.type === 'yes_no') {
                  return renderChoices(YES_NO_OPTIONS)
                }

                if (question.type === 'multiple') {
                  return renderChoices(parseOptions(question.options))
                }

                return (
                  <TextInput
                    value={selectedValue}
                    onChangeText={(value) => handleChange(question.id, value)}
                    editable={!isDisabled}
                    multiline
                    numberOfLines={4}
                    placeholder="Tu respuesta..."
                    placeholderTextColor="#9CA3AF"
                    style={[styles.textArea, isDisabled && styles.textAreaDisabled]}
                    textAlignVertical="top"
                  />
                )
              }

              return (
                <View key={key} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionIndex}>{index + 1}.</Text>
                    <Text style={styles.questionText}>{question.question}</Text>
                    {question.is_required ? (
                      <Text style={styles.requiredBadge}>*</Text>
                    ) : null}
                  </View>

                  {renderInput()}
                </View>
              )
            })}

            {!questions.length ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Esta encuesta no tiene preguntas configuradas.</Text>
              </View>
            ) : null}

            <Pressable
              disabled={
                submitting ||
                Boolean(selectedSurvey.alreadyAnswered) ||
                !questions.length
              }
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                (submitting ||
                  selectedSurvey.alreadyAnswered ||
                  !questions.length) && styles.submitButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar respuestas</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: '#d1d5db',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4C1D95',
  },
  surveyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  surveyDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  surveyMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#4B5563',
  },
  emptyState: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  body: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  departmentChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  departmentChipActive: {
    backgroundColor: '#C4B5FD',
  },
  departmentLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  departmentLabelActive: {
    color: '#4C1D95',
  },
  singleDepartment: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  singleDepartmentText: {
    fontSize: 14,
    color: '#3730A3',
    fontWeight: '600',
  },
  alertBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  alertDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C1D95',
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  requiredBadge: {
    fontSize: 16,
    color: '#DC2626',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  optionActive: {
    backgroundColor: '#C4B5FD',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionLabelActive: {
    color: '#4C1D95',
  },
  optionLabelDisabled: {
    color: '#6B7280',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textAreaDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#4C1D95',
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
