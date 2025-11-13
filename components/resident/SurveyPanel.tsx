import { useResidentContext } from '@/components/contexts/ResidentContext'
import { supabase } from '@/lib/supabase'
import { formatDateLogical } from '@/lib/time'
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
  KeyboardAvoidingView,
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

  if (Array.isArray(raw)) return raw.map(String)

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {}

    return raw.split('|').map((v) => v.trim()).filter(Boolean)
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
    residentDepartments,
  } = useResidentContext()

  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['92%'], [])

  const [answers, setAnswers] = useState<AnswerMap>({})
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasMultipleDepartments = residentDepartments.length > 1

  // abrir/cerrar modal
  useEffect(() => {
    if (!bottomSheetRef.current) return
    isSurveyPanelOpen ? bottomSheetRef.current.present() : bottomSheetRef.current.dismiss()
  }, [isSurveyPanelOpen])

  // set de departamento inicial
  useEffect(() => {
    if (!isSurveyPanelOpen) return

    if (!residentDepartments.length) {
      setSelectedDepartmentId(null)
      return
    }

    if (residentDepartments.length === 1) {
      setSelectedDepartmentId(residentDepartments[0].department_id)
      return
    }

    setSelectedDepartmentId((current) =>
      current &&
      residentDepartments.some((d) => d.department_id === current)
        ? current
        : residentDepartments[0].department_id
    )
  }, [isSurveyPanelOpen, residentDepartments])

  // reset en apertura/cierre
  useEffect(() => {
    if (!isSurveyPanelOpen) {
      setAnswers({})
      setSubmitting(false)
      if (residentDepartments.length !== 1) setSelectedDepartmentId(null)
    } else {
      setAnswers({})
      setSubmitting(false)
    }
  }, [isSurveyPanelOpen, residentDepartments.length])

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
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }))
  }, [])

  const handleSelectDepartment = useCallback((departmentId: string) => {
    setSelectedDepartmentId(String(departmentId))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedSurvey) return

    if (!selectedDepartmentId) {
      Toast.show({ type: 'info', text1: 'Selecciona un departamento.' })
      return
    }

    if (selectedSurvey.alreadyAnswered) {
      Toast.show({ type: 'info', text1: 'Este departamento ya respondió esta encuesta.' })
      return
    }

    const questions: SurveyQuestion[] = Array.isArray(selectedSurvey.survey_questions)
      ? selectedSurvey.survey_questions
      : []

    if (!questions.length) {
      Toast.show({ type: 'info', text1: 'La encuesta no tiene preguntas.' })
      return
    }

    const missing = questions.some((q) => q.is_required && !answers[String(q.id)])
    if (missing) {
      Toast.show({ type: 'info', text1: 'Responde todas las preguntas obligatorias.' })
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
      if (error) throw error

      Toast.show({
        type: 'success',
        text1: '¡Gracias por participar!',
      })

      await refreshSurveys()
      closePanels()
    } catch (error) {
      console.error('[SurveyPanel] submit error', error)
      Toast.show({
        type: 'error',
        text1: 'No pudimos enviar tus respuestas.',
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

  const questions = useMemo<SurveyQuestion[]>(() => {
    if (!selectedSurvey?.survey_questions) return []
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
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Responder encuesta</Text>

              {selectedSurvey?.title && (
                <Text style={styles.surveyTitle}>{selectedSurvey.title}</Text>
              )}

              {selectedSurvey?.description && (
                <Text style={styles.surveyDescription}>{selectedSurvey.description}</Text>
              )}

              {expiresAtLabel && (
                <Text style={styles.surveyMeta}>Vigente hasta: {expiresAtLabel}</Text>
              )}
            </View>

            <Pressable onPress={closePanels} style={styles.closeButton}>
              <X size={18} color="#1F2937" />
            </Pressable>
          </View>

          {loadingSurveys && (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color="#6D28D9" />
              <Text style={styles.loaderText}>Cargando encuesta...</Text>
            </View>
          )}

          {!loadingSurveys && selectedSurvey && (
            <View style={styles.body}>
              {/* Selección de departamento */}
              {hasMultipleDepartments && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Responder desde el departamento</Text>

                  <View style={styles.departmentGrid}>
                    {residentDepartments.map((d) => {
                      const selected = d.department_id === selectedDepartmentId
                      return (
                        <Pressable
                          key={d.department_id}
                          onPress={() => handleSelectDepartment(d.department_id)}
                          style={[
                            styles.departmentChip,
                            selected && styles.departmentChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.departmentLabel,
                              selected && styles.departmentLabelActive,
                            ]}
                          >
                            {d.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )}

              {selectedSurvey.alreadyAnswered && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertTitle}>Encuesta respondida</Text>
                  <Text style={styles.alertDescription}>
                    Este departamento ya respondió esta encuesta.
                  </Text>
                </View>
              )}

              {/* PREGUNTAS */}
              {questions.map((question, index) => {
                const key = String(question.id)
                const selected = answers[key] ?? ''
                const disabled = submitting || selectedSurvey.alreadyAnswered

                const renderChoices = (options: string[]) => (
                  <View style={styles.optionGroup}>
                    {options.map((opt) => {
                      const isSelected = selected === opt
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => !disabled && handleChange(question.id, opt)}
                          style={[
                            styles.option,
                            isSelected && styles.optionActive,
                            disabled && styles.optionDisabled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelActive,
                              disabled && styles.optionLabelDisabled,
                            ]}
                          >
                            {opt}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )

                const renderInput = () => {
                  if (question.type === 'yes_no') return renderChoices(YES_NO_OPTIONS)
                  if (question.type === 'multiple')
                    return renderChoices(parseOptions(question.options))

                  return (
                    <TextInput
                      value={selected}
                      onChangeText={(value) => handleChange(question.id, value)}
                      editable={!disabled}
                      multiline
                      numberOfLines={4}
                      placeholder="Tu respuesta..."
                      placeholderTextColor="#9CA3AF"
                      onFocus={() => bottomSheetRef.current?.expand()}
                      style={[
                        styles.textArea,
                        disabled && styles.textAreaDisabled,
                      ]}
                    />
                  )
                }

                return (
                  <View key={key} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionIndex}>{index + 1}.</Text>
                      <Text style={styles.questionText}>{question.question}</Text>
                      {question.is_required && (
                        <Text style={styles.requiredBadge}>*</Text>
                      )}
                    </View>

                    {renderInput()}
                  </View>
                )
              })}

              {/* BOTÓN ENVIAR */}
              <Pressable
                disabled={submitting || selectedSurvey.alreadyAnswered || !questions.length}
                onPress={handleSubmit}
                style={[
                  styles.submitButton,
                  (submitting || selectedSurvey.alreadyAnswered) &&
                    styles.submitButtonDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar respuestas</Text>
                )}
              </Pressable>
            </View>
          )}
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
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
    textAlignVertical: 'top',
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
