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

const currentQuestion = computed(() => {
  const q = questions.value[currentIndex.value]
  if (!q) return null
  
  // options 배열 생성
  return {
    ...q,
    options: [q.option_a, q.option_b, q.option_c, q.option_d]
  }
})

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('id')

    if (error) throw error
    if (!data || data.length === 0) throw new Error('문제가 없습니다')

    questions.value = data
    answers.value = Array(questions.value.length).fill(null)
    loading.value = false

    console.log('✅ 문제 로딩 성공:', questions.value.length)
  } catch (err) {
    console.error('❌ 문제 로딩 실패:', err)
    alert(`문제를 불러올 수 없습니다.\n\n${err.message}`)
    loading.value = false
  }
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

    // AI 분석
    const aiAnalysis = await analyzeWithClaude(score, wrongQuestions, categoryStats)

    // DB 저장
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
    const anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    })

    const categoryAnalysis = Object.entries(categoryStats).map(([cat, stats]) => {
      const percent = Math.round((stats.correct / stats.total) * 100)
      return `${cat}: ${stats.correct}/${stats.total} (${percent}%)`
    }).join('\n')

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

다음 형식으로 고등학생에게 도움이 되는 분석을 작성해주세요:

1. **전체 평가** (3-4문장으로 전반적인 실력 평가)

2. **영역별 분석**
   - AI역량 영역 분석
   - 디지털역량 영역 분석

3. **강점** (2-3개)

4. **보완이 필요한 부분** (2-3개)

5. **학습 추천사항** (3-4개의 구체적인 학습 방법)

친근하고 격려하는 톤으로 작성하되, 구체적이고 실용적인 조언을 제공해주세요.
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    return message.content[0].text
  } catch (error) {
    console.error('AI 분석 실패:', error)
    
    // 기본 피드백
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

<!-- template과 style은 기존과 동일 -->