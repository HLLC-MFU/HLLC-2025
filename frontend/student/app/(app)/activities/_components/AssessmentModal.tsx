import React, { useEffect, useState } from "react"
import { Modal, View, Text, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView, StatusBar } from "react-native"
import { Button, Input } from "tamagui"
import { useTranslation } from "react-i18next"
import { apiRequest } from "@/utils/api"
import { useProgress } from "@/hooks/useProgress"
import { useToastController } from "@tamagui/toast"

interface AssessmentModalProps {
  visible: boolean
  onClose: () => void
  activity: any
}

const AssessmentModal = ({ visible, onClose, activity }: AssessmentModalProps) => {
  const { t, i18n } = useTranslation()
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([])
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [assessmentAnswers, setAssessmentAnswers] = useState<{ [questionId: string]: number | string }>({})
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false)
  const { fetchProgress } = useProgress()
  const toast = useToastController();

  useEffect(() => {
    if (visible && activity?._id) {
      setAssessmentLoading(true)
      apiRequest(`/assessments/${activity._id}/activity`, "GET")
        .then(res => {
          let questions: any[] = [];
          if (res && typeof res.data === 'object' && Array.isArray((res.data as any).data)) {
            questions = (res.data as any).data;
          } else if (Array.isArray(res?.data)) {
            questions = res.data;
          } else if (res && typeof res.data === 'object' && Array.isArray((res.data as any).questions)) {
            questions = (res.data as any).questions;
          } else {
            questions = [];
          }
          // เรียงตาม order
          const sortedQuestions = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          setAssessmentQuestions(sortedQuestions)
          setAssessmentAnswers({})
        })
        .finally(() => setAssessmentLoading(false))
    } else if (!visible) {
      // Reset state when modal is closed
      setAssessmentQuestions([])
      setAssessmentAnswers({})
      setAssessmentLoading(false)
    }
  }, [visible, activity?._id])

  const handleAssessmentSelect = (questionId: string, value: number | string) => {
    setAssessmentAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const canSubmitAssessment =
    assessmentQuestions.length > 0 &&
    assessmentQuestions.every((q) => {
      if (q.type === "rating") {
        return typeof assessmentAnswers[q._id] === "number" && (assessmentAnswers[q._id] as number) > 0
      } else if (q.type === "text") {
        return typeof assessmentAnswers[q._id] === "string" && (assessmentAnswers[q._id] as string).trim() !== ""
      }
      return false
    })

  const handleAssessmentSubmit = async () => {
    if (!activity?._id) return
    setAssessmentSubmitting(true)
    try {
      const payload = {
        answers: assessmentQuestions.map(q => ({
          assessment: q._id,
          answer: String(assessmentAnswers[q._id]),
        })),
      }
      const res = await apiRequest("/assessment-answers", "POST", payload)
      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        toast.show(t('assessment.success'), {
          type: 'success',
        });
        fetchProgress()
        onClose() // ปิด modal เฉพาะเมื่อส่งสำเร็จ
      }
    } catch (e) {
      toast.show(t('assessment.failed'), {
        type: 'error',
      });
    } finally {
      setAssessmentSubmitting(false)
    }
  }

  const gradientColors = ["#ef4444", "#f59e42", "#fde047", "#a7f3d0", "#22c55e"];

  // Don't render modal if no activity is selected
  if (!activity) {
    return null
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      {Platform.OS === "android" ? (
        <View style={{ flex: 1 }}>
          <StatusBar backgroundColor="rgba(0,0,0,0.5)" translucent barStyle="light-content" />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#0008",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <KeyboardAvoidingView
              behavior={undefined}
              style={{ width: "100%", justifyContent: "center", alignItems: "center" }}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "90%" }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#2563eb", textAlign: "center", marginBottom: 20 }}>
                    {t("assessment.title", "Assessment Activity")}
                  </Text>
                  {assessmentLoading ? (
                    <Text style={{ textAlign: "center", marginVertical: 24 }}>{t("assessment.loading", "Loading...")}</Text>
                  ) : assessmentQuestions.length === 0 ? (
                    <Text style={{ textAlign: "center", marginVertical: 24, color: "#ef4444" }}>{t("assessment.notFound", "ไม่พบคำถามสำหรับแบบประเมินนี้")}</Text>
                  ) : (
                    <>
                      <Text style={{ textAlign: "center", marginBottom: 8, color: "#888" }}>{t("assessment.questionCount", { count: assessmentQuestions.length })}</Text>
                      <ScrollView style={{ maxHeight: 400, marginBottom: 8 }}>
                        {assessmentQuestions.map((q: any, idx: number) => {
                          const lang = i18n.language?.startsWith("th") ? "th" : "en"
                          const questionText = q.question?.[lang] || q.question?.en || q.question?.th || q.question || ""
                          return (
                            <View key={q._id} style={{ marginBottom: 20 }}>
                              <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 8 }}>
                                {idx + 1}. {questionText} <Text style={{ color: "#ef4444" }}>*</Text>
                              </Text>
                              {q.type === "rating" ? (
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                                  <Text style={{ color: "#888", fontSize: 13 }}>{t("assessment.low", "Low")}</Text>
                                  <View style={{ flexDirection: "row" }}>
                                    {[1, 2, 3, 4, 5].map((num, i) => (
                                      <View key={num} style={{ marginLeft: i === 0 ? 0 : 12 }}>
                                        <Button
                                          size="$2"
                                          borderRadius={999}
                                          backgroundColor={assessmentAnswers[q._id] === num ? gradientColors[i] : "#fff"}
                                          borderColor={gradientColors[i]}
                                          borderWidth={1}
                                          color={assessmentAnswers[q._id] === num ? "#fff" : gradientColors[i]}
                                          onPress={() => handleAssessmentSelect(q._id, num)}
                                          style={{ minWidth: 36, height: 36, paddingHorizontal: 0 }}
                                        >
                                          <Text>{num}</Text>
                                        </Button>
                                      </View>
                                    ))}
                                  </View>
                                  <Text style={{ color: "#888", fontSize: 13 }}>{t("assessment.high", "High")}</Text>
                                </View>
                              ) : q.type === "text" ? (
                                <View style={{ marginTop: 8 }}>
                                  <Input
                                    value={assessmentAnswers[q._id] !== undefined ? String(assessmentAnswers[q._id]) : ""}
                                    onChangeText={text => handleAssessmentSelect(q._id, text)}
                                    placeholder={t("assessment.yourComments", lang === "th" ? "กรอกความคิดเห็นของคุณ" : "Your comments")}
                                    multiline
                                    style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, minHeight: 40, color: "#222", backgroundColor: "#f3f4f6", }}
                                  />
                                </View>
                              ) : null}
                            </View>
                          )
                        })}
                      </ScrollView>
                    </>
                  )}
                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Button
                        backgroundColor={canSubmitAssessment ? "#22c55e" : "#a7f3d0"}
                        color="#fff"
                        borderRadius={12}
                        disabled={!canSubmitAssessment || assessmentSubmitting}
                        onPress={handleAssessmentSubmit}
                      >
                        <Text>{assessmentSubmitting ? t("assessment.submitting", "SUBMITTING...") : t("assessment.submit", "SUBMIT")}</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0008" }}>
              <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "90%" }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: "#2563eb", textAlign: "center", marginBottom: 20 }}>
                  {t("assessment.title", "Assessment Activity")}
                </Text>
                {assessmentLoading ? (
                  <Text style={{ textAlign: "center", marginVertical: 24 }}>{t("assessment.loading", "Loading...")}</Text>
                ) : assessmentQuestions.length === 0 ? (
                  <Text style={{ textAlign: "center", marginVertical: 24, color: "#ef4444" }}>{t("assessment.notFound", "ไม่พบคำถามสำหรับแบบประเมินนี้")}</Text>
                ) : (
                  <>
                    <Text style={{ textAlign: "center", marginBottom: 8, color: "#888" }}>{t("assessment.questionCount", { count: assessmentQuestions.length })}</Text>
                    <ScrollView style={{ maxHeight: 400, marginBottom: 8 }}>
                      {assessmentQuestions.map((q: any, idx: number) => {
                        const lang = i18n.language?.startsWith("th") ? "th" : "en"
                        const questionText = q.question?.[lang] || q.question?.en || q.question?.th || q.question || ""
                        return (
                          <View key={q._id} style={{ marginBottom: 20 }}>
                            <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 8 }}>
                              {idx + 1}. {questionText} <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                            {q.type === "rating" ? (
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                                <Text style={{ color: "#888", fontSize: 13 }}>{t("assessment.low", "Low")}</Text>
                                <View style={{ flexDirection: "row" }}>
                                  {[1, 2, 3, 4, 5].map((num, i) => (
                                    <View key={num} style={{ marginLeft: i === 0 ? 0 : 12 }}>
                                      <Button
                                        size="$2"
                                        borderRadius={999}
                                        backgroundColor={assessmentAnswers[q._id] === num ? gradientColors[i] : "#fff"}
                                        borderColor={gradientColors[i]}
                                        borderWidth={1}
                                        color={assessmentAnswers[q._id] === num ? "#fff" : gradientColors[i]}
                                        onPress={() => handleAssessmentSelect(q._id, num)}
                                        style={{ minWidth: 36, height: 36, paddingHorizontal: 0 }}
                                      >
                                        <Text>{num}</Text>
                                      </Button>
                                    </View>
                                  ))}
                                </View>
                                <Text style={{ color: "#888", fontSize: 13 }}>{t("assessment.high", "High")}</Text>
                              </View>
                            ) : q.type === "text" ? (
                              <View style={{ marginTop: 8 }}>
                                <Input
                                  value={assessmentAnswers[q._id] !== undefined ? String(assessmentAnswers[q._id]) : ""}
                                  onChangeText={text => handleAssessmentSelect(q._id, text)}
                                  placeholder={t("assessment.yourComments", lang === "th" ? "กรอกความคิดเห็นของคุณ" : "Your comments")}
                                  multiline
                                  style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, minHeight: 40, color: "#222", backgroundColor: "#f3f4f6", }}
                                />
                              </View>
                            ) : null}
                          </View>
                        )
                      })}
                    </ScrollView>
                  </>
                )}
                {/* Action Buttons */}
                <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Button
                      backgroundColor={canSubmitAssessment ? "#22c55e" : "#a7f3d0"}
                      color="#fff"
                      borderRadius={12}
                      disabled={!canSubmitAssessment || assessmentSubmitting}
                      onPress={handleAssessmentSubmit}
                    >
                      <Text>{assessmentSubmitting ? t("assessment.submitting", "SUBMITTING...") : t("assessment.submit", "SUBMIT")}</Text>
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </Modal>
  )
}

export default AssessmentModal 