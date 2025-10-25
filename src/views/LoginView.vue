<template>
  <div class="login-container">
    <div class="login-box">
      <h1>📘 고등학생 AI·디지털 역량 진단 평가</h1>
      
      <div class="info-section">
        <p class="main-info">
          본 검사는 고등학생을 대상으로 <strong>인공지능(AI) 역량</strong>과 
          <strong>디지털 역량</strong>을 진단하기 위해 설계되었습니다.
        </p>
        <p class="sub-info">
          📝 객관식 4지선다형 · ⏱️ 소요 시간 약 30분
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <p class="form-label">이름을 입력하고 시작하세요</p>
        <input
          v-model="name"
          type="text"
          placeholder="이름을 입력하세요"
          required
          autofocus
        />
        <button type="submit" :disabled="!name.trim() || loading">
          {{ loading ? '로그인 중...' : '테스트 시작' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const name = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(name.value)
    router.push('/test')
  } catch (err) {
    error.value = '로그인 중 오류가 발생했습니다.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 100%;
}

h1 {
  margin: 0 0 20px;
  color: #333;
  font-size: 24px;
  text-align: center;
  line-height: 1.4;
}

.info-section {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
}

.main-info {
  color: #333;
  line-height: 1.7;
  margin: 0 0 10px;
  font-size: 15px;
}

.main-info strong {
  color: #667eea;
}

.sub-info {
  color: #666;
  font-size: 14px;
  margin: 0;
  text-align: center;
}

.login-form {
  text-align: center;
}

.form-label {
  color: #666;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  border: 2px solid #ddd;
  border-radius: 10px;
  margin-bottom: 15px;
  transition: border 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff6b6b;
  margin-top: 10px;
  font-size: 14px;
}
</style>