<template>
  <div class="test-container">
    <div class="header">
      <h2>{{ authStore.student?.name }}님의 테스트</h2>
      <div class="progress">
        문제 {{ currentIndex + 1 }} / {{ questions.length }}
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>문제를 불러오는 중...</p>
    </div>

    <div v-else-if="currentQuestion" class="question-card">
      <div class="question-number">문제 {{ currentIndex + 1 }}</div>
      <h3 class="question-text">{{ currentQuestion.question }}</h3>
      
      <div class="options">
        <button
          v-for="(option, idx) in currentQuestion.options"
          :key="idx"
          :class="{ selected: answers[currentIndex] === idx }"
          @click="selectAnswer(idx)"
        >
          <span class="option-number">{{ idx + 1 }}</span>
          <span class="option-text">{{ option }}</span>
        </button>
      </div>
    </div>

    <div class="navigation">
      <button @click="prev" :disabled="currentIndex === 0" class="nav-btn">
        ← 이전
      </button>
      
      <button 
        v-if="currentIndex < questions.length - 1"
        @click="next"
        class="nav-btn next"
      >
        다음 →
      </button>
      
      <button 
        v-else
        @click="submit"
        :disabled="submitting"
        class="submit-btn"
      >
        {{ submitting ? 'AI 분석 중...' : '채점하기' }}
      </button>
    </div>

    <!-- 자동 저장 표시 -->
    <div v-if="!loading" class="auto-save">
      💾 자동 저장됨 - 나갔다 들어와도 이어서 풀 수 있어요
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref([])
const loading = ref(true)
const submitting = ref(false)
const progressId = ref(null)
const saveTimeout = ref(null)

const currentQuestion = computed(() => {
  const q = questions.value[currentIndex.value]
  if (!q) return null
  return {
    ...q,
    options: [q.option_a, q.option_b, q.option_c, q.option_d]
  }
})

// 키보드 이벤트 핸들러
const handleKeyPress = (e) => {
  // 로딩 중이거나 제출 중이면 무시
  if (loading.value || submitting.value) return

  // 1, 2, 3, 4 키 처리
  if (['1', '2', '3', '4'].includes(e.key)) {
    const optionIndex = parseInt(e.key) - 1
    selectAnswer(optionIndex)
  }
  
  // 화살표 키 처리
  if (e.key === 'ArrowLeft') {
    prev()
  } else if (e.key === 'ArrowRight') {
    next()
  }
  
  // Enter 키로 제출 (마지막 문제일 때만)
  if (e.key === 'Enter' && currentIndex.value === questions.value.length - 1) {
    submit()
  }
}

// 답변이나 페이지가 바뀔 때마다 저장 (디바운싱)
watch([answers, currentIndex], () => {
  if (!progressId.value || loading.value) return
  
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value)
  }
  
  saveTimeout.value = setTimeout(async () => {
    try {
      await supabase
        .from('test_progress')
        .update({
          current_index: currentIndex.value,
          answers: answers.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId.value)
      
      console.log('✅ 자동 저장 완료')
    } catch (error) {
      console.error('저장 실패:', error)
    }
  }, 1000)
}, { deep: true })

onMounted(async () => {
  // 키보드 이벤트 리스너 추가
  window.addEventListener('keydown', handleKeyPress)

  try {
    console.log('학생 ID:', authStore.student?.id)
    
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .order('id')

    if (questionsError) throw questionsError
    if (!questionsData || questionsData.length === 0) {
      throw new Error('문제가 없습니다')
    }

    questions.value = questionsData
    console.log('✅ 문제 로딩:', questions.value.length)

    const { data: progress, error: progressError } = await supabase
      .from('test_progress')
      .select()
      .eq('student_id', authStore.student.id)
      .maybeSingle()

    if (progressError) {
      console.error('진행 상황 조회 에러:', progressError)
    }

    if (progress) {
      const resume = confirm(
        `이전에 풀던 테스트가 있습니다.\n` +
        `문제 ${progress.current_index + 1}번부터 이어서 하시겠습니까?`
      )
      
      if (resume) {
        progressId.value = progress.id
        currentIndex.value = progress.current_index
        answers.value = progress.answers
        console.log('✅ 이어하기:', currentIndex.value + 1, '번 문제부터')
      } else {
        await supabase
          .from('test_progress')
          .delete()
          .eq('id', progress.id)
        
        answers.value = Array(questions.value.length).fill(null)
        await createNewProgress()
      }
    } else {
      answers.value = Array(questions.value.length).fill(null)
      await createNewProgress()
    }

    loading.value = false
  } catch (err) {
    console.error('❌ 초기화 실패:', err)
    alert(`오류가 발생했습니다.\n\n${err.message}`)
    loading.value = false
  }
})

onUnmounted(() => {
  // 키보드 이벤트 리스너 제거
  window.removeEventListener('keydown', handleKeyPress)
  
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value)
  }
})

const createNewProgress = async () => {
  try {
    const { data, error } = await supabase
      .from('test_progress')
      .insert({
        student_id: authStore.student.id,
        current_index: 0,
        answers: answers.value
      })
      .select()
      .single()
    
    if (error) throw error
    
    progressId.value = data.id
    console.log('✅ 새 진행 상황 생성:', progressId.value)
  } catch (error) {
    console.error('진행 상황 생성 실패:', error)
  }
}

const selectAnswer = (idx) => {
  answers.value[currentIndex.value] = idx
}

const next = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const submit = async () => {
  const unanswered = answers.value.filter(a => a === null).length
  if (unanswered > 0) {
    if (!confirm(`${unanswered}개 문제를 풀지 않았습니다.\n제출하시겠습니까?`)) {
      return
    }
  }

  submitting.value = true

  try {
    let correct = 0
    const wrongQuestions = []
    const categoryStats = {}
    
    answers.value.forEach((answer, idx) => {
      const q = questions.value[idx]
      const category = q.category
      
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, correct: 0 }
      }
      categoryStats[category].total++
      
      if (answer === q.correct_answer) {
        correct++
        categoryStats[category].correct++
      } else if (answer !== null) {
        const opts = [q.option_a, q.option_b, q.option_c, q.option_d]
        wrongQuestions.push({
          number: idx + 1,
          question: q.question,
          category: q.category,
          studentAnswer: opts[answer],
          correctAnswer: opts[q.correct_answer]
        })
      }
    })

    const score = Math.round((correct / questions.value.length) * 100)

    const aiAnalysis = await analyzeWithClaude(score, wrongQuestions, categoryStats)

    const { data, error } = await supabase
      .from('test_results')
      .insert({
        student_id: authStore.student.id,
        score,
        answers: answers.value,
        ai_analysis: aiAnalysis
      })
      .select()
      .single()

    if (error) throw error

    if (progressId.value) {
      await supabase
        .from('test_progress')
        .delete()
        .eq('id', progressId.value)
    }

    router.push(`/result/${data.id}`)
  } catch (error) {
    console.error('제출 에러:', error)
    alert('제출 중 오류가 발생했습니다: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const analyzeWithClaude = async (score, wrongQuestions, categoryStats) => {
  try {
    const categoryAnalysis = Object.entries(categoryStats)
      .map(([cat, stats]) => {
        const percent = Math.round((stats.correct / stats.total) * 100)
        return `${cat}: ${stats.correct}/${stats.total} (${percent}%)`
      })
      .join('\n')

    const prompt = `
고등학생의 AI·디지털 역량 진단 평가 결과를 분석해주세요.

**전체 점수:** ${score}점 / 100점
**정답 수:** ${30 - wrongQuestions.length}개 / 30개

**영역별 성적:**
${categoryAnalysis}

**틀린 문제 (${wrongQuestions.length}개):**
${wrongQuestions.map(q => `
- 문제 ${q.number}: ${q.question}
  학생 답변: ${q.studentAnswer}
  정답: ${q.correctAnswer}
`).join('\n')}

다음 형식으로 분석해주세요:
1. 전체 평가 (3-4문장)
2. 영역별 분석
3. 강점 (2-3개)
4. 보완 필요 부분 (2-3개)
5. 학습 추천 (3-4개)

친근하고 격려하는 톤으로 작성해주세요.
`

    // Edge Function 호출
    const { data, error } = await supabase.functions.invoke('claude-chat', {
      body: { message: prompt }
    })

    if (error) throw error

    return data.content[0].text
  } catch (error) {
    console.error('AI 분석 실패:', error)
    
    let feedback = `총점: ${score}점\n\n`
    if (score >= 90) feedback += '🌟 우수: 매우 뛰어난 실력입니다!'
    else if (score >= 80) feedback += '😊 양호: 잘 하고 있습니다!'
    else if (score >= 70) feedback += '👍 보통: 기본기는 탄탄합니다.'
    else if (score >= 60) feedback += '💪 노력 필요: 조금만 더 학습하면 좋을 것 같아요.'
    else feedback += '📚 기초부터: 천천히 다시 학습해보세요.'
    
    return feedback
  }
}
</script>

<style scoped>
.test-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.progress {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.loading {
  text-align: center;
  padding: 100px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  font-size: 20px;
  color: #666;
}

.question-card {
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 5px 30px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.question-number {
  color: #667eea;
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
}

.question-text {
  font-size: 24px;
  margin: 20px 0 40px;
  color: #333;
  line-height: 1.6;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.options button {
  display: flex;
  align-items: center;
  padding: 20px;
  text-align: left;
  border: 3px solid #e0e0e0;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
}

.options button:hover {
  border-color: #667eea;
  transform: translateX(5px);
}

.options button.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.option-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
  font-size: 14px;
}

.option-text {
  flex: 1;
  line-height: 1.5;
}

.navigation {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.nav-btn, .submit-btn {
  padding: 15px 35px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn {
  background: #e0e0e0;
  color: #333;
}

.nav-btn.next {
  background: #667eea;
  color: white;
}

.submit-btn {
  background: #ff6b6b;
  color: white;
  padding: 15px 45px;
}

.nav-btn:hover:not(:disabled), .submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.auto-save {
  text-align: center;
  color: #28a745;
  font-size: 14px;
  padding: 10px;
  background: #f0f9f4;
  border-radius: 8px;
}

.keyboard-hint {
  margin-top: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.keyboard-hint kbd {
  display: inline-block;
  padding: 3px 8px;
  margin: 0 3px;
  font-size: 13px;
  font-family: monospace;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 3px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .test-container {
    padding: 20px 15px;
  }

  .header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .question-card {
    padding: 30px 20px;
  }
  
  .question-text {
    font-size: 20px;
  }
  
  .options button {
    font-size: 15px;
    padding: 15px;
  }

  .option-number {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .navigation {
    flex-direction: column;
  }

  .nav-btn, .submit-btn {
    width: 100%;
  }
}
</style>