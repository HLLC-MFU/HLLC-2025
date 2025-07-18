import React, { useState } from 'react';
import { Modal, View, Text, Button, ActivityIndicator, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

interface PretestModalProps {
  visible: boolean;
  questions: any[];
  loading: boolean;
  error: string | null;
  onSubmit: (answers: Record<string, string>) => void;
}

const PretestModal = ({ visible, questions, loading, error, onSubmit }:PretestModalProps) => {
  const { t, i18n } = useTranslation();
  // เก็บคำตอบแต่ละข้อ (key = question id, value = answer)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, minWidth: 320, maxHeight: '80%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t('pretest.title')}</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#888" style={{ marginVertical: 24 }} />
          ) : error ? (
            <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
          ) : (
            <ScrollView style={{ maxHeight: 350, backgroundColor: 'transparent' }} showsVerticalScrollIndicator={true}>
              {questions.length === 0 ? (
                <Text style={{ marginBottom: 16 }}>{t('pretest.noQuestions')}</Text>
              ) : (
                questions.map((q, idx) => {
                  const lang = i18n.language;
                  const questionText =
                    (typeof q.question === 'object' ? q.question?.[lang] : q.question) ||
                    (typeof q.text === 'object' ? q.text?.[lang] : q.text) ||
                    '-';
                  const qid = q._id || q.id || idx;
                  // สี pastel ไล่จากแดง (1) ไปเขียว (5)
                  const pastelColors = [
                    '#FFB3B3', // 1 - แดงอ่อน
                    '#FFD6A5', // 2 - ส้มอ่อน
                    '#FFF7AE', // 3 - เหลืองอ่อน
                    '#C1F7C7', // 4 - เขียวอ่อน
                    '#A0E7A0', // 5 - เขียวพาสเทล
                  ];
                  const activeColors = [
                    '#FF6B6B', // 1 - แดง
                    '#FFA94D', // 2 - ส้ม
                    '#FFD43B', // 3 - เหลือง
                    '#51CF66', // 4 - เขียวกลาง
                    '#38D9A9', // 5 - เขียวเข้ม
                  ];
                  return (
                    <View key={qid} style={{ marginBottom: 24 }}>
                      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>{idx + 1}. {questionText}</Text>
                      {q.type === 'rating' ? (
                        <>
                          <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
                            {[1,2,3,4,5].map((val, i) => {
                              const isActive = answers[qid] === String(val);
                              return (
                                <TouchableOpacity
                                  key={val}
                                  style={{
                                    backgroundColor: isActive ? activeColors[i] : '#fff',
                                    borderRadius: 20,
                                    width: 40,
                                    height: 40,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginHorizontal: 8,
                                    borderWidth: isActive ? 2 : 1,
                                    borderColor: isActive ? activeColors[i] : '#ddd',
                                  }}
                                  onPress={() => handleChange(qid, String(val))}
                                  disabled={submitting}
                                >
                                  <Text style={{ color: isActive ? 'white' : '#333', fontWeight: 'bold', fontSize: 18 }}>{val}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 8, marginBottom: 4 }}>
                            <Text style={{ color: '#FF6B6B', fontSize: 13 }}>{t('pretest.low')}</Text>
                            <Text style={{ color: '#38D9A9', fontSize: 13 }}>{t('pretest.high')}</Text>
                          </View>
                        </>
                      ) : q.type === 'dropdown' ? (
                        <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 4 }}>
                          <Picker
                            selectedValue={answers[qid] || ''}
                            onValueChange={value => handleChange(qid, value)}
                            enabled={!submitting}
                          >
                            <Picker.Item label={t('pretest.select')} value="" />
                            {/* TODO: ดึง options จริงจาก q.options ถ้ามี */}
                            <Picker.Item label={t('pretest.option1')} value="option1" />
                            <Picker.Item label={t('pretest.option2')} value="option2" />
                            <Picker.Item label={t('pretest.option3')} value="option3" />
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 36 }}
                          placeholder={t('pretest.placeholder')}
                          value={answers[qid] || ''}
                          onChangeText={text => handleChange(qid, text)}
                          editable={!submitting}
                        />
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
          <View style={{ marginTop: 12 }}>
            <Button
              title={submitting ? t('pretest.submitting') : t('pretest.submit')}
              onPress={handleSubmit}
              disabled={loading || submitting || questions.length === 0 || Object.keys(answers).length < questions.length}
              color="#38D9A9"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PretestModal; 