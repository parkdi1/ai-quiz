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
    try {
      // 같은 이름의 학생이 있는지 확인
      const { data: existingStudents, error: selectError } = await supabase
        .from('students')
        .select('*')
        .eq('name', name)

      if (selectError) throw selectError

      let studentData

      if (existingStudents && existingStudents.length > 0) {
        // 이미 있는 학생 (첫 번째 사용)
        studentData = existingStudents[0]
      } else {
        // 새 학생 등록
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert({ name })
          .select()
          .single()

        if (insertError) throw insertError
        studentData = newStudent
      }

      student.value = studentData
      isAuthenticated.value = true
      localStorage.setItem('student', JSON.stringify(studentData))

      return studentData
    } catch (error) {
      console.error('로그인 실패:', error)
      throw error
    }
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