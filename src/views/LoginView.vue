<template>
  <div class="login-container">
    <div class="login-box">
      <h1>🎓 학생 AI 역량 테스트</h1>
      <p class="subtitle">이름을 입력하고 테스트를 시작하세요</p>
      
      <form @submit.prevent="handleLogin">
        <input
          v-model="name"
          type="text"
          placeholder="이름을 입력하세요"
          required
          autofocus
        />
        <button type="submit" :disabled="!name.trim()">
          시작하기
        </button>
      </form>

      <a href="/admin" class="admin-link">관리자 페이지</a>
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
}

.login-box {
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

h1 {
  margin: 0 0 10px;
  color: #333;
  font-size: 32px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
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

.admin-link {
  display: block;
  margin-top: 20px;
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}
</style>