<template>
  <div class="test-container">
    <div class="header">
      <h2>{{ authStore.student?.name }}님의 테스트</h2>
      <div class="progress">
        문제 {{ currentIndex + 1 }} / {{ questions.length }}
      </div>
    </div>

    <div v-if="loading" class="loading">문제를 불러오는 중...</div>

    <div v-else-if="questions.length > 0" class="question-card">
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
        {{ submitting ? '분석 중...' : '채점하기' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const router = useRouter()
const authStore = useAuthStore()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref([])
const loading = ref(true)
const submitting = ref(false)

const currentQuestion = computed(() => questions.value[currentIndex.value])

onMounted(async () => {
  // 문제 불러오기
  const { data } = await supabase
    .from('questions')
    .select('*')
    .order('id')

  questions.value = data.map(q => ({
    ...q,
    options: JSON.parse(q.options)
  }))
  
  answers.value = Array(questions.value.length).fill(null)
  loading.value = false
})

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
  // 미응답 확인
  const unanswered = answers.value.filter(a => a === null).length
  if (unanswered > 0) {
    if (!confirm(`${unanswered}개 문제를 풀지 않았습니다. 제출하시겠습니까?`)) {
      return
    }
  }

  submitting.value = true

  try {
    // 채점
    let correct = 0
    const wrongQuestions = []
    
    answers.value.forEach((answer, idx) => {
      if (answer === questions.value[idx].correct_answer) {
        correct++
      } else {
        wrongQuestions.push({
          question: questions.value[idx].question,
          category: questions.value[idx].category,
          studentAnswer: answer !== null ? questions.value[idx].options[answer] : '미응답',
          correctAnswer: questions.value[idx].options[questions.value[idx].correct_answer]
        })
      }
    })

    const score = Math.round((correct / questions.value.length) * 100)

    // AI 분석
    const aiAnalysis = await analyzeWithClaude(score, wrongQuestions)

    // DB 저장
    const { data } = await supabase
      .from('test_results')
      .insert({
        student_id: authStore.student.id,
        score,
        answers: answers.value,
        ai_analysis: aiAnalysis
      })
      .select()
      .single()

    router.push(`/result/${data.id}`)
  } catch (error) {
    alert('제출 중 오류가 발생했습니다: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const analyzeWithClaude = async (score, wrongQuestions) => {
  try {
    const anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    })

    const prompt = `
학생의 테스트 결과를 분석해주세요.

점수: ${score}점
틀린 문제 수: ${wrongQuestions.length}개

틀린 문제:
${JSON.stringify(wrongQuestions, null, 2)}

다음 형식으로 분석해주세요:
1. 전체 평가 (2-3문장)
2. 강점 (2개)
3. 약점 (1-2개)
4. 추천사항 (2-3개)

친근하고 격려하는 톤으로 작성해주세요.
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })

    return message.content[0].text
  } catch (error) {
    console.error('AI 분석 실패:', error)
    return `점수: ${score}점\n${
      score >= 90 ? '우수한 실력입니다!' :
      score >= 70 ? '잘 하고 있습니다!' :
      score >= 50 ? '조금 더 노력이 필요합니다.' :
      '기초부터 다시 학습해보세요.'
    }`
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
}

.question-text {
  font-size: 28px;
  margin: 20px 0 40px;
  color: #333;
  line-height: 1.4;
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
  font-size: 18px;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

.navigation {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.nav-btn, .submit-btn {
  padding: 18px 40px;
  font-size: 18px;
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
  font-size: 20px;
  padding: 18px 50px;
}

.nav-btn:hover:not(:disabled), .submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}
</style>