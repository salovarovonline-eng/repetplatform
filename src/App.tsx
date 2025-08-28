import React, { useState, useEffect } from 'react'
import { Toaster } from 'sonner@2.0.3'
import RegistrationForm from './components/RegistrationForm'
import CabinetCreated from './components/CabinetCreated'
import TutorOnboarding from './components/TutorOnboarding'
import TutorDashboard from './components/TutorDashboard'

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

type AppState = 'registration' | 'cabinet-created' | 'onboarding' | 'dashboard' | 'login'

interface UserSession {
  accessToken: string
  userId: string
}

function App() {
  const [appState, setAppState] = useState<AppState>('registration')
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Проверяем существующую сессию при загрузке
  useEffect(() => {
    const savedSession = localStorage.getItem('tutorSession')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        setUserSession(session)
        setAppState('dashboard')
      } catch (error) {
        console.error('Ошибка восстановления сессии:', error)
        localStorage.removeItem('tutorSession')
      }
    }
    setLoading(false)
  }, [])

  const handleRegistrationSuccess = (userId: string) => {
    setAppState('cabinet-created')
  }

  const handleContinueToOnboarding = () => {
    setAppState('onboarding')
  }

  const handleOnboardingComplete = () => {
    setAppState('dashboard')
  }

  const handleLogin = async (phone: string, password: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ phone, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа')
      }

      const session = {
        accessToken: data.accessToken,
        userId: data.user.id
      }

      setUserSession(session)
      localStorage.setItem('tutorSession', JSON.stringify(session))
      
      // Проверяем шаг онбординга
      if (data.user.onboardingStep < 4) {
        setAppState('onboarding')
      } else {
        setAppState('dashboard')
      }

      return { success: true }
    } catch (error) {
      console.error('Ошибка входа:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка входа' 
      }
    }
  }

  const handleLogout = async () => {
    // Отправляем запрос на сервер для удаления сессии
    if (userSession?.accessToken) {
      try {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userSession.accessToken}`
          }
        })
      } catch (error) {
        console.error('Ошибка выхода:', error)
      }
    }

    setUserSession(null)
    localStorage.removeItem('tutorSession')
    setAppState('registration')
  }

  const switchToLogin = () => {
    setAppState('login')
  }

  const switchToRegistration = () => {
    setAppState('registration')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {appState === 'registration' && (
        <div>
          <RegistrationForm 
            onSuccess={handleRegistrationSuccess}
            onSwitchToLogin={switchToLogin}
          />
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button 
                onClick={switchToLogin}
                className="text-blue-600 hover:underline"
              >
                Войти
              </button>
            </p>
          </div>
        </div>
      )}

      {appState === 'login' && (
        <LoginForm 
          onSuccess={(phone, password) => handleLogin(phone, password)} 
          onSwitchToRegistration={switchToRegistration}
        />
      )}

      {appState === 'cabinet-created' && (
        <CabinetCreated onContinue={handleContinueToOnboarding} />
      )}

      {appState === 'onboarding' && userSession && (
        <TutorOnboarding 
          accessToken={userSession.accessToken}
          onComplete={handleOnboardingComplete} 
        />
      )}

      {appState === 'dashboard' && userSession && (
        <TutorDashboard 
          accessToken={userSession.accessToken}
          onLogout={handleLogout}
        />
      )}

      <Toaster position="top-right" />
    </div>
  )
}

// Компонент формы входа
interface LoginFormProps {
  onSuccess: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>
  onSwitchToRegistration: () => void
}

function LoginForm({ onSuccess, onSwitchToRegistration }: LoginFormProps) {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.phone || !formData.password) {
      setError('Заполните все поля')
      return
    }

    // Проверяем формат телефона
    const phoneRegex = /^\+7[0-9]{10}$/
    if (!phoneRegex.test(formData.phone)) {
      setError('Неверный формат телефона (+7XXXXXXXXXX)')
      return
    }

    setLoading(true)
    const result = await onSuccess(formData.phone, formData.password)
    
    if (!result.success) {
      setError(result.error || 'Ошибка входа')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Вход в кабинет</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+7XXXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <button 
                onClick={onSwitchToRegistration}
                className="text-blue-600 hover:underline"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App