<template>
  <div class="result-container">
    <div v-if="loading" class="loading">결과를 불러오는 중...</div>

    <div v-else-if="result" class="result-card">
      <h1>🎉 테스트 완료!</h1>
      
      <div class="score-section">
        <div class="score-circle">
          <div class="score">{{ result.score }}</div>
          <div class="label">점</div>
        </div>
      </div>

      <div class="info-box">
        <p><strong>이름:</strong> {{ studentName }}</p>
        <p><strong>제출 시간:</strong> {{ formatDate(result.created_at) }}</p>
      </div>

      <div class="analysis-box">
        <h3>📊 AI 분석 결과</h3>
        <pre class="analysis-text">{{ result.ai_analysis }}</pre>
      </div>

      <div class="actions">
        <button @click="goHome" class="btn-primary">처음으로</button>
        <button @click="print" class="btn-secondary">결과 출력</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const result = ref(null)
const studentName = ref('')
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('test_results')
    .select(`
      *,
      students (name)
    `)
    .eq('id', route.params.id)
    .single()

  result.value = data
  studentName.value = data.students.name
  loading.value = false
})

const formatDate = (date) => {
  return new Date(date).toLocaleString('ko-KR')
}

const goHome = () => {
  router.push('/')
}

const print = () => {
  window.print()
}
</script>

<style scoped>
.result-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 100px;
  font-size: 20px;
}

.result-card {
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.score-section {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.score-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.score {
  font-size: 72px;
  font-weight: bold;
  line-height: 1;
}

.label {
  font-size: 24px;
  margin-top: 5px;
}

.info-box {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 15px;
  margin: 30px 0;
}

.info-box p {
  margin: 10px 0;
  font-size: 18px;
}

.analysis-box {
  background: #e8f4f8;
  padding: 30px;
  border-radius: 15px;
  margin: 30px 0;
}

.analysis-box h3 {
  margin-top: 0;
  color: #2c3e50;
}

.analysis-text {
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.8;
  font-size: 16px;
  color: #333;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 40px;
}

.btn-primary, .btn-secondary {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}

@media print {
  .actions {
    display: none;
  }
}
</style>