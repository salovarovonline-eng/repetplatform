import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Eye, EyeOff, Plus, X } from 'lucide-react'

interface RegistrationFormProps {
  onSuccess: (userId: string) => void
  onSwitchToLogin?: () => void
}

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export default function RegistrationForm({ onSuccess, onSwitchToLogin }: RegistrationFormProps) {
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    subjects: [] as string[],
    city: '',
    experience: '',
    levels: [] as string[],
    format: '',
    rate: '',
    agreePersonalData: false,
    agreeTerms: false,
    agreeNewsletter: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newSubject, setNewSubject] = useState('')

  const subjects = [
    'Математика', 'Физика', 'Химия', 'Биология', 'Русский язык',
    'Литература', 'История', 'Обществознание', 'География', 'Английский язык',
    'Немецкий язык', 'Французский язык', 'Информатика', 'Музыка', 'Рисование'
  ]

  const levels = [
    'Начальная школа (1-4 класс)',
    'Средняя школа (5-9 класс)', 
    'Старшая школа (10-11 класс)',
    'ЕГЭ/ОГЭ',
    'Студенты',
    'Взрослые'
  ]

  const formats = [
    'Онлайн',
    'Очно',
    'Онлайн и очно'
  ]

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+7[0-9]{10}$/
    return phoneRegex.test(phone)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 12 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[^a-zA-Z0-9]/.test(password)
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone) {
      newErrors.phone = 'Телефон обязателен'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона (+7XXXXXXXXXX)'
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Пароль должен содержать минимум 12 символов, включая заглавные, строчные буквы, цифры и спецсимволы'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают'
    }

    if (!formData.fullName) {
      newErrors.fullName = 'ФИО обязательно'
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Выберите хотя бы один предмет'
    }

    if (!formData.city) {
      newErrors.city = 'Город обязателен'
    }

    if (!formData.agreePersonalData) {
      newErrors.agreePersonalData = 'Необходимо согласие на обработку персональных данных'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Необходимо согласие с условиями оферты'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep1()) return

    setLoading(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password,
          fullName: formData.fullName,
          subjects: formData.subjects,
          city: formData.city,
          experience: formData.experience,
          levels: formData.levels,
          format: formData.format,
          rate: formData.rate
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.includes('уже зарегистрирован')) {
          // Пользователь уже существует - предлагаем войти
          toast.error('Пользователь с таким телефоном уже зарегистрирован')
          if (onSwitchToLogin) {
            setTimeout(() => {
              onSwitchToLogin()
            }, 2000)
          }
          return
        }
        throw new Error(data.error || 'Ошибка регистрации')
      }

      toast.success('Кабинет успешно создан!')
      onSuccess(data.userId)
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const addSubject = () => {
    if (newSubject && !formData.subjects.includes(newSubject)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject]
      }))
      setNewSubject('')
    }
  }

  const removeSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }))
  }

  const progress = step === 1 ? 50 : 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Регистрация репетитора</CardTitle>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                {/* Основные данные */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Основные данные</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7XXXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Минимум 12 символов"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Подтверждение пароля *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Повторите пароль"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={errors.confirmPassword ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">ФИО *</Label>
                    <Input
                      id="fullName"
                      placeholder="Иванов Иван Иванович"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Предметы *</Label>
                    <div className="flex gap-2">
                      <Select value={newSubject} onValueChange={setNewSubject}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Выберите предмет" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.filter(s => !formData.subjects.includes(s)).map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addSubject} disabled={!newSubject}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.subjects.map(subject => (
                          <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                            {subject}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => removeSubject(subject)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {errors.subjects && <p className="text-sm text-red-500">{errors.subjects}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Город *</Label>
                    <Input
                      id="city"
                      placeholder="Москва"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                  </div>
                </div>

                {/* Дополнительные данные */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Дополнительная информация</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Опыт работы</Label>
                    <Input
                      id="experience"
                      placeholder="Например: 5 лет преподавания математики"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Уровни учеников</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {levels.map(level => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={level}
                            checked={formData.levels.includes(level)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ ...prev, levels: [...prev.levels, level] }))
                              } else {
                                setFormData(prev => ({ ...prev, levels: prev.levels.filter(l => l !== level) }))
                              }
                            }}
                          />
                          <Label htmlFor={level} className="text-sm">{level}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Формат занятий</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите формат" />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map(format => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Стоимость занятия</Label>
                    <Input
                      id="rate"
                      placeholder="Например: 1500 руб/час"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Согласия */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Согласия</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreePersonalData"
                        checked={formData.agreePersonalData}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreePersonalData: !!checked }))}
                      />
                      <Label htmlFor="agreePersonalData" className="text-sm">
                        Я согласен на обработку персональных данных в соответствии с 152-ФЗ *
                      </Label>
                    </div>
                    {errors.agreePersonalData && <p className="text-sm text-red-500">{errors.agreePersonalData}</p>}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: !!checked }))}
                      />
                      <Label htmlFor="agreeTerms" className="text-sm">
                        Я согласен с условиями публичной оферты *
                      </Label>
                    </div>
                    {errors.agreeTerms && <p className="text-sm text-red-500">{errors.agreeTerms}</p>}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeNewsletter"
                        checked={formData.agreeNewsletter}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeNewsletter: !!checked }))}
                      />
                      <Label htmlFor="agreeNewsletter" className="text-sm">
                        Я согласен на получение рассылок
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Создание кабинета...' : 'Создать кабинет'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}