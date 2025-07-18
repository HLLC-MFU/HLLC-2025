import React, { useState } from 'react';
import { Modal, View, Text, Button, ActivityIndicator, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

interface PosttestModalProps {
  visible: boolean;
  questions: any[];
  loading: boolean;
  error: string | null;
  onSubmit: (answers: Record<string, string>) => void;
}

const PosttestModal = ({ visible, questions, loading, error, onSubmit }: PosttestModalProps) => {
  const { t, i18n } = useTranslation();
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t('posttest.title')}</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#888" style={{ marginVertical: 24 }} />
          ) : error ? (
            <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
          ) : (
            <ScrollView style={{ maxHeight: 350, backgroundColor: 'transparent' }} showsVerticalScrollIndicator={true}>
              {questions.length === 0 ? (
                <Text style={{ marginBottom: 16 }}>{t('posttest.noQuestions')}</Text>
              ) : (
                questions.map((q, idx) => {
                  const lang = i18n.language;
                  const questionText =
                    (typeof q.question === 'object' ? q.question?.[lang] : q.question) ||
                    (typeof q.text === 'object' ? q.text?.[lang] : q.text) ||
                    '-';
                  const qid = q._id || q.id || idx;
                  const pastelColors = [
                    '#FFB3B3',
                    '#FFD6A5',
                    '#FFF7AE',
                    '#C1F7C7',
                    '#A0E7A0',
                  ];
                  const activeColors = [
                    '#FF6B6B',
                    '#FFA94D',
                    '#FFD43B',
                    '#51CF66',
                    '#38D9A9',
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
                            <Text style={{ color: '#FF6B6B', fontSize: 13 }}>{t('posttest.low')}</Text>
                            <Text style={{ color: '#38D9A9', fontSize: 13 }}>{t('posttest.high')}</Text>
                          </View>
                        </>
                      ) : q.type === 'dropdown' ? (
                        <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 4 }}>
                          <Picker
                            selectedValue={answers[qid] || ''}
                            onValueChange={value => handleChange(qid, value)}
                            enabled={!submitting}
                          >
                            <Picker.Item label={t('posttest.select')} value="" />
                            {/* TODO: ดึง options จริงจาก q.options ถ้ามี */}
                            <Picker.Item label={t('posttest.option1')} value="option1" />
                            <Picker.Item label={t('posttest.option2')} value="option2" />
                            <Picker.Item label={t('posttest.option3')} value="option3" />
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 36 }}
                          placeholder={t('posttest.placeholder')}
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
              title={submitting ? t('posttest.submitting') : t('posttest.submit')}
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

export default PosttestModal; 