<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 제목 -->
      <h1>📘 고등학생 AI·디지털 역량 진단 평가</h1>
      
      <!-- 안내 문구 -->
      <div class="info-section">
        <h3>검사 목적 및 안내</h3>
        <p class="description">
          본 검사는 고등학생을 대상으로 인공지능(AI) 역량과 디지털 역량을 진단하기 위해 설계되었습니다. 
          문항은 객관식 4지선다형이며, 전체 예상 소요 시간은 약 <strong>30분</strong>입니다.
        </p>
        
        <div class="competency-info">
          <div class="competency-item">
            <div class="competency-icon">🤖</div>
            <div class="competency-text">
              <strong>AI 역량</strong>
              <p>인공지능 기술의 개념과 활용, 윤리적 고려사항을 이해하고 비판적으로 평가하는 능력</p>
            </div>
          </div>
          
          <div class="competency-item">
            <div class="competency-icon">💻</div>
            <div class="competency-text">
              <strong>디지털 역량</strong>
              <p>디지털 기술을 안전하고 효율적으로 사용하며, 정보 탐색·소통·콘텐츠 제작·문제 해결을 수행하는 능력</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 로그인 폼 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <p class="form-label">이름을 입력하고 시작하세요</p>
        <input
          v-model="name"
          type="text"
          placeholder="이름을 입력하세요"
          required
          autofocus
        />
        <button type="submit" :disabled="!name.trim()">
          테스트 시작
        </button>
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

const handleLogin = async () => {
  await authStore.login(name.value)
  router.push('/test')
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
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

h1 {
  margin: 0 0 25px;
  color: #333;
  font-size: 26px;
  text-align: center;
  line-height: 1.4;
}

/* 안내 섹션 */
.info-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
}

.info-section h3 {
  margin: 0 0 15px;
  color: #667eea;
  font-size: 18px;
}

.description {
  color: #555;
  line-height: 1.8;
  margin-bottom: 20px;
  font-size: 15px;
}

.description strong {
  color: #667eea;
  font-weight: 700;
}

/* 역량 설명 */
.competency-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.competency-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.competency-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.competency-text {
  flex: 1;
}

.competency-text strong {
  display: block;
  color: #333;
  font-size: 16px;
  margin-bottom: 5px;
}

.competency-text p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

/* 로그인 폼 */
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
  margin-bottom: 20px;
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

/* 반응형 */
@media (max-width: 768px) {
  .login-box {
    padding: 30px 20px;
  }
  
  h1 {
    font-size: 22px;
  }
  
  .info-section {
    padding: 20px;
  }
  
  .competency-item {
    flex-direction: column;
    text-align: center;
  }
  
  .competency-icon {
    font-size: 40px;
  }
}
</style>