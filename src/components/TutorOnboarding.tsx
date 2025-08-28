import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { UserPlus, Calendar, Upload, CheckCircle, ExternalLink } from 'lucide-react'

interface OnboardingProps {
  accessToken: string
  onComplete: () => void
}

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string

interface Student {
  id: string
  name: string
  age: string
  level: string
  subject: string
}

interface Lesson {
  id: string
  studentId: string
  subject: string
  date: string
  time: string
  duration: string
}

interface Material {
  id: string
  title: string
  subject: string
  description: string
  type: string
}

export default function TutorOnboarding({ accessToken, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])

  // Шаг 1: Добавить ученика
  const [studentForm, setStudentForm] = useState({
    name: '',
    age: '',
    level: '',
    subject: ''
  })

  // Шаг 2: Создать урок
  const [lessonForm, setLessonForm] = useState({
    studentId: '',
    subject: '',
    date: '',
    time: '',
    duration: '60'
  })

  // Шаг 3: Загрузить материал
  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject: '',
    description: '',
    type: 'презентация'
  })

  const subjects = [
    'Математика', 'Физика', 'Химия', 'Биология', 'Русский язык',
    'Литература', 'История', 'Обществознание', 'География', 'Английский язык'
  ]

  const levels = [
    'Начальная школа (1-4 класс)',
    'Средняя школа (5-9 класс)',
    'Старшая школа (10-11 класс)',
    'ЕГЭ/ОГЭ',
    'Студенты',
    'Взрослые'
  ]

  const materialTypes = [
    'презентация',
    'конспект',
    'задачи',
    'тест',
    'видео',
    'аудио',
    'другое'
  ]

  const addStudent = async () => {
    if (!studentForm.name || !studentForm.age || !studentForm.level || !studentForm.subject) {
      toast.error('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(studentForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка добавления ученика')
      }

      setStudents([...students, data.student])
      setStudentForm({ name: '', age: '', level: '', subject: '' })
      toast.success('Ученик добавлен!')
      
      // Обновляем шаг онбординга
      await updateOnboardingStep(1)
      setCurrentStep(2)
    } catch (error) {
      console.error('Ошибка добавления ученика:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка добавления ученика')
    } finally {
      setLoading(false)
    }
  }

  const createLesson = async () => {
    if (!lessonForm.studentId || !lessonForm.subject || !lessonForm.date || !lessonForm.time || !lessonForm.duration) {
      toast.error('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(lessonForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания урока')
      }

      setLessons([...lessons, data.lesson])
      setLessonForm({ studentId: '', subject: '', date: '', time: '', duration: '60' })
      toast.success('Урок создан!')
      
      // Обновляем шаг онбординга
      await updateOnboardingStep(2)
      setCurrentStep(3)
    } catch (error) {
      console.error('Ошибка создания урока:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка создания урока')
    } finally {
      setLoading(false)
    }
  }

  const addMaterial = async () => {
    if (!materialForm.title || !materialForm.subject || !materialForm.description || !materialForm.type) {
      toast.error('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(materialForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки материала')
      }

      setMaterials([...materials, data.material])
      setMaterialForm({ title: '', subject: '', description: '', type: 'презентация' })
      toast.success('Материал добавлен!')
      
      // Обновляем шаг онбординга
      await updateOnboardingStep(3)
      setCurrentStep(4) // Показываем финальный экран
    } catch (error) {
      console.error('Ошибка загрузки материала:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка загрузки материала')
    } finally {
      setLoading(false)
    }
  }

  const updateOnboardingStep = async (step: number) => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c3da9688/onboarding/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ step })
      })
    } catch (error) {
      console.error('Ошибка обновления онбординга:', error)
    }
  }

  const completeOnboarding = async () => {
    await updateOnboardingStep(4)
    onComplete()
  }

  const shareLink = () => {
    const link = `${window.location.origin}/tutor-profile/preview`
    navigator.clipboard.writeText(link)
    toast.success('Ссылка скопирована в буфер обмена!')
  }

  const progress = (currentStep / 4) * 100

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-4">Настройка кабинета</h1>
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Добавить ученика</span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Создать урок</span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Загрузить материал</span>
            <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>Готово</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Шаг 1: Добавьте первого ученика
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Добавьте первого ученика, чтобы начать планировать занятия. 
                Вы сможете добавить больше учеников позже.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Имя ученика *</Label>
                  <Input
                    id="studentName"
                    placeholder="Анна Петрова"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentAge">Возраст *</Label>
                  <Input
                    id="studentAge"
                    placeholder="15"
                    value={studentForm.age}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Уровень *</Label>
                  <Select value={studentForm.level} onValueChange={(value) => setStudentForm(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Предмет *</Label>
                  <Select value={studentForm.subject} onValueChange={(value) => setStudentForm(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={addStudent} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Добавление...' : 'Добавить ученика'}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Шаг 2: Создайте первый урок
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Создайте первый урок, чтобы протестировать календарь и планирование занятий.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ученик *</Label>
                  <Select value={lessonForm.studentId} onValueChange={(value) => setLessonForm(prev => ({ ...prev, studentId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите ученика" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Предмет *</Label>
                  <Select value={lessonForm.subject} onValueChange={(value) => setLessonForm(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lessonDate">Дата *</Label>
                  <Input
                    id="lessonDate"
                    type="date"
                    value={lessonForm.date}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lessonTime">Время *</Label>
                  <Input
                    id="lessonTime"
                    type="time"
                    value={lessonForm.time}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Длительность *</Label>
                  <Select value={lessonForm.duration} onValueChange={(value) => setLessonForm(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите длительность" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 минут</SelectItem>
                      <SelectItem value="45">45 минут</SelectItem>
                      <SelectItem value="60">1 час</SelectItem>
                      <SelectItem value="90">1.5 часа</SelectItem>
                      <SelectItem value="120">2 часа</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={createLesson} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Создание...' : 'Создать урок'}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Шаг 3: Загрузите первый материал
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Добавьте учебный материал, чтобы организовать библиотеку ресурсов для учеников.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materialTitle">Название *</Label>
                  <Input
                    id="materialTitle"
                    placeholder="Квадратные уравнения - теория"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Предмет *</Label>
                  <Select value={materialForm.subject} onValueChange={(value) => setMaterialForm(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Тип материала *</Label>
                  <Select value={materialForm.type} onValueChange={(value) => setMaterialForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="materialDescription">Описание *</Label>
                  <Textarea
                    id="materialDescription"
                    placeholder="Краткое описание материала"
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={addMaterial} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Добавление...' : 'Добавить материал'}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>Онбординг завершён!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-600">
                Отлично! Ваш кабинет настроен. Теперь вы можете поделиться ссылкой на ваш профиль с учениками.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Превью вашего кабинета:</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Учеников:</span>
                    <Badge variant="secondary">{students.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Уроков:</span>
                    <Badge variant="secondary">{lessons.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Материалов:</span>
                    <Badge variant="secondary">{materials.length}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={shareLink} variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Поделиться ссылкой
                </Button>
                <Button onClick={completeOnboarding} className="flex-1">
                  Перейти в кабинет
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}