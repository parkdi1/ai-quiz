<template>
  <div class="admin-container">
    <div class="header">
      <h1>📊 관리자 페이지</h1>
      <div class="header-actions">
        <button @click="deleteAll" class="delete-all-btn" v-if="results.length > 0">
          🗑️ 전체 삭제
        </button>
        <a href="/" class="back-link">← 돌아가기</a>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ results.length }}</div>
        <div class="stat-label">총 응시자</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ averageScore }}</div>
        <div class="stat-label">평균 점수</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ maxScore }}</div>
        <div class="stat-label">최고 점수</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ minScore }}</div>
        <div class="stat-label">최저 점수</div>
      </div>
    </div>

    <div v-if="loading" class="loading">데이터를 불러오는 중...</div>

    <div v-else-if="results.length > 0" class="table-container">
      <table>
        <thead>
          <tr>
            <th>순위</th>
            <th>이름</th>
            <th>점수</th>
            <th>제출 시간</th>
            <th>AI 분석</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, idx) in results" :key="result.id">
            <td class="rank">{{ idx + 1 }}</td>
            <td class="name">{{ result.student_name }}</td>
            <td class="score">
              <span class="score-badge" :class="getScoreClass(result.score)">
                {{ result.score }}점
              </span>
            </td>
            <td class="date">{{ formatDate(result.created_at) }}</td>
            <td class="analysis">
              <button @click="showAnalysis(result)" class="view-btn">
                보기
              </button>
            </td>
            <td class="actions">
              <button @click="deleteResult(result)" class="delete-btn">
                🗑️ 삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty">
      아직 제출된 결과가 없습니다.
    </div>

    <!-- AI 분석 모달 -->
    <div v-if="selectedResult" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">×</button>
        <h3>{{ selectedResult.student_name }}님의 AI 분석</h3>
        <div class="modal-score">점수: {{ selectedResult.score }}점</div>
        <pre class="modal-analysis">{{ selectedResult.ai_analysis }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const results = ref([])
const loading = ref(true)
const selectedResult = ref(null)

const averageScore = computed(() => {
  if (results.value.length === 0) return 0
  const sum = results.value.reduce((acc, r) => acc + r.score, 0)
  return Math.round(sum / results.value.length)
})

const maxScore = computed(() => {
  if (results.value.length === 0) return 0
  return Math.max(...results.value.map(r => r.score))
})

const minScore = computed(() => {
  if (results.value.length === 0) return 0
  return Math.min(...results.value.map(r => r.score))
})

onMounted(async () => {
  await loadResults()
})

const loadResults = async () => {
  loading.value = true
  
  const { data } = await supabase
    .from('test_results')
    .select(`
      *,
      students (name)
    `)
    .order('score', { ascending: false })

  results.value = data.map(d => ({
    ...d,
    student_name: d.students.name
  }))
  
  loading.value = false
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'average'
  return 'poor'
}

const showAnalysis = (result) => {
  selectedResult.value = result
}

const closeModal = () => {
  selectedResult.value = null
}

const deleteResult = async (result) => {
  const confirmMessage = `${result.student_name}님의 결과를 삭제하시겠습니까?\n\n학생 정보도 함께 삭제됩니다.`
  
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    // 1. test_progress 삭제 (있다면)
    await supabase
      .from('test_progress')
      .delete()
      .eq('student_id', result.student_id)

    // 2. test_results 삭제
    const { error: resultError } = await supabase
      .from('test_results')
      .delete()
      .eq('id', result.id)

    if (resultError) throw resultError

    // 3. students 삭제
    const { error: studentError } = await supabase
      .from('students')
      .delete()
      .eq('id', result.student_id)

    if (studentError) throw studentError

    // 4. 목록에서 제거
    results.value = results.value.filter(r => r.id !== result.id)
    
    alert('✅ 삭제되었습니다.')
  } catch (error) {
    console.error('삭제 실패:', error)
    alert('❌ 삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

const deleteAll = async () => {
  const confirmMessage = `⚠️ 경고: 모든 데이터를 삭제하시겠습니까?\n\n- 총 ${results.value.length}명의 결과\n- 모든 학생 정보\n- 모든 진행 상황\n\n이 작업은 되돌릴 수 없습니다!`
  
  if (!confirm(confirmMessage)) {
    return
  }

  // 한 번 더 확인
  const doubleCheck = prompt('정말 삭제하려면 "삭제"를 입력하세요:')
  if (doubleCheck !== '삭제') {
    alert('취소되었습니다.')
    return
  }

  try {
    loading.value = true

    // 1. test_progress 전체 삭제
    const { error: progressError } = await supabase
      .from('test_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

    if (progressError) throw progressError

    // 2. test_results 전체 삭제
    const { error: resultsError } = await supabase
      .from('test_results')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (resultsError) throw resultsError

    // 3. students 전체 삭제
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (studentsError) throw studentsError

    // 4. 목록 비우기
    results.value = []
    
    alert('✅ 모든 데이터가 삭제되었습니다.')
  } catch (error) {
    console.error('전체 삭제 실패:', error)
    alert('❌ 삭제 중 오류가 발생했습니다: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

h1 {
  margin: 0;
  color: #333;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-size: 18px;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s;
}

.back-link:hover {
  background: #f0f4ff;
}

.delete-all-btn {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s;
}

.delete-all-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 48px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

.loading, .empty {
  text-align: center;
  padding: 80px;
  font-size: 20px;
  color: #666;
  background: white;
  border-radius: 15px;
}

.table-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #667eea;
  color: white;
  padding: 20px;
  text-align: left;
  font-weight: bold;
  font-size: 16px;
}

td {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

tr:hover {
  background: #f8f9fa;
}

.rank {
  font-weight: bold;
  color: #667eea;
  font-size: 18px;
}

.name {
  font-weight: 600;
  font-size: 16px;
}

.score-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 16px;
}

.score-badge.excellent {
  background: #d4edda;
  color: #155724;
}

.score-badge.good {
  background: #d1ecf1;
  color: #0c5460;
}

.score-badge.average {
  background: #fff3cd;
  color: #856404;
}

.score-badge.poor {
  background: #f8d7da;
  color: #721c24;
}

.date {
  color: #666;
  font-size: 14px;
}

.view-btn {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.view-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.delete-btn {
  padding: 8px 15px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 14px;
}

.delete-btn:hover {
  background: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(255, 68, 68, 0.3);
}

/* 모달 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 20px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 36px;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-score {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  margin: 20px 0;
}

.modal-analysis {
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 36px;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    font-size: 14px;
  }

  th, td {
    padding: 12px 8px;
  }

  .delete-all-btn {
    font-size: 14px;
    padding: 8px 15px;
  }
}
</style>