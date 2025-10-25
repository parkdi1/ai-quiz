import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const student = ref(null)
  const isAuthenticated = ref(false)

  // 세션 복원
  const restoreSession = () => {
    const saved = localStorage.getItem('student')
    if (saved) {
      student.value = JSON.parse(saved)
      isAuthenticated.value = true
    }
  }

  // 로그인
  const login = async (name) => {
    // 기존 학생 찾기
    let { data } = await supabase
      .from('students')
      .select()
      .eq('name', name)
      .single()

    // 없으면 생성
    if (!data) {
      const { data: newStudent } = await supabase
        .from('students')
        .insert({ name })
        .select()
        .single()
      data = newStudent
    }

    student.value = data
    isAuthenticated.value = true
    localStorage.setItem('student', JSON.stringify(data))
    
    return data
  }

  // 로그아웃
  const logout = () => {
    student.value = null
    isAuthenticated.value = false
    localStorage.removeItem('student')
  }

  return {
    student,
    isAuthenticated,
    login,
    logout,
    restoreSession
  }
})