import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { 
  UserPlus, 
  Calendar, 
  Upload, 
  CheckCircle, 
  Users, 
  BookOpen, 
  FileText,
  Plus,
  Settings,
  LogOut
} from 'lucide-react'

interface DashboardProps {
  accessToken: string
  onLogout: () => void
}

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

interface TutorProfile {
  id: string
  fullName: string
  phone: string
  city: string
  subjects: string[]
  students: Student[]
  lessons: Lesson[]
  materials: Material[]
  onboardingStep: number
}

export default function TutorDashboard({ accessToken, onLogout }: DashboardProps) {
  const [profile, setProfile] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [completedActions, setCompletedActions] = useState({
    addedExtraStudent: false,
    createdExtraLesson: false,
    uploadedExtraFile: false
  })

  // Диалоги
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)

  // Формы
  const [studentForm, setStudentForm] = useState({
    name: '',
    age: '',
    level: '',
    subject: ''
  })

  const [lessonForm, setLessonForm] = useState({
    studentId: '',
    subject: '',
    date: '',
    time: '',
    duration: '60'
  })

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

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`https://${process.env.REACT_APP_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-c3da9688/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки профиля')
      }

      setProfile(data.profile)
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      toast.error('Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  const addStudent = async () => {
    if (!studentForm.name || !studentForm.age || !studentForm.level || !studentForm.subject) {
      toast.error('Заполните все поля')
      return
    }

    setActionLoading('student')
    try {
      const response = await fetch(`https://${process.env.REACT_APP_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-c3da9688/students`, {
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

      if (profile) {
        setProfile({
          ...profile,
          students: [...profile.students, data.student]
        })
      }
      
      setStudentForm({ name: '', age: '', level: '', subject: '' })
      setStudentDialogOpen(false)
      setCompletedActions(prev => ({ ...prev, addedExtraStudent: true }))
      toast.success('Ученик добавлен!')
    } catch (error) {
      console.error('Ошибка добавления ученика:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка добавления ученика')
    } finally {
      setActionLoading('')
    }
  }

  const createLesson = async () => {
    if (!lessonForm.studentId || !lessonForm.subject || !lessonForm.date || !lessonForm.time || !lessonForm.duration) {
      toast.error('Заполните все поля')
      return
    }

    setActionLoading('lesson')
    try {
      const response = await fetch(`https://${process.env.REACT_APP_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-c3da9688/lessons`, {
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

      if (profile) {
        setProfile({
          ...profile,
          lessons: [...profile.lessons, data.lesson]
        })
      }
      
      setLessonForm({ studentId: '', subject: '', date: '', time: '', duration: '60' })
      setLessonDialogOpen(false)
      setCompletedActions(prev => ({ ...prev, createdExtraLesson: true }))
      toast.success('Урок создан!')
    } catch (error) {
      console.error('Ошибка создания урока:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка создания урока')
    } finally {
      setActionLoading('')
    }
  }

  const addMaterial = async () => {
    if (!materialForm.title || !materialForm.subject || !materialForm.description || !materialForm.type) {
      toast.error('Заполните все поля')
      return
    }

    setActionLoading('material')
    try {
      const response = await fetch(`https://${process.env.REACT_APP_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-c3da9688/materials`, {
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

      if (profile) {
        setProfile({
          ...profile,
          materials: [...profile.materials, data.material]
        })
      }
      
      setMaterialForm({ title: '', subject: '', description: '', type: 'презентация' })
      setMaterialDialogOpen(false)
      setCompletedActions(prev => ({ ...prev, uploadedExtraFile: true }))
      toast.success('Материал добавлен!')
    } catch (error) {
      console.error('Ошибка загрузки материала:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка загрузки материала')
    } finally {
      setActionLoading('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загрузка кабинета...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>Ошибка загрузки профиля</p>
          <Button onClick={fetchProfile} className="mt-4">Попробовать снова</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold">Кабинет репетитора</h1>
              <p className="text-sm text-gray-600">{profile.fullName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Основные действия */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-24 flex-col gap-2">
                  <UserPlus className="w-6 h-6" />
                  Добавить ученика
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить ученика</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">Имя ученика</Label>
                      <Input
                        id="studentName"
                        placeholder="Анна Петрова"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentAge">Возраст</Label>
                      <Input
                        id="studentAge"
                        placeholder="15"
                        value={studentForm.age}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, age: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Уровень</Label>
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
                    <Label>Предмет</Label>
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
                  <Button onClick={addStudent} disabled={actionLoading === 'student'} className="w-full">
                    {actionLoading === 'student' ? 'Добавление...' : 'Добавить ученика'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-24 flex-col gap-2">
                  <Calendar className="w-6 h-6" />
                  Создать урок
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать урок</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ученик</Label>
                      <Select value={lessonForm.studentId} onValueChange={(value) => setLessonForm(prev => ({ ...prev, studentId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите ученика" />
                        </SelectTrigger>
                        <SelectContent>
                          {profile.students.map(student => (
                            <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Предмет</Label>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lessonDate">Дата</Label>
                      <Input
                        id="lessonDate"
                        type="date"
                        value={lessonForm.date}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lessonTime">Время</Label>
                      <Input
                        id="lessonTime"
                        type="time"
                        value={lessonForm.time}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Длительность</Label>
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
                  <Button onClick={createLesson} disabled={actionLoading === 'lesson'} className="w-full">
                    {actionLoading === 'lesson' ? 'Создание...' : 'Создать урок'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-24 flex-col gap-2">
                  <Upload className="w-6 h-6" />
                  Загрузить материал
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить материал</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="materialTitle">Название</Label>
                      <Input
                        id="materialTitle"
                        placeholder="Квадратные уравнения"
                        value={materialForm.title}
                        onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Предмет</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>Тип материала</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="materialDescription">Описание</Label>
                    <Textarea
                      id="materialDescription"
                      placeholder="Краткое описание материала"
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button onClick={addMaterial} disabled={actionLoading === 'material'} className="w-full">
                    {actionLoading === 'material' ? 'Добавление...' : 'Добавить материал'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основной контент */}
          <div className="lg:col-span-2 space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{profile.students.length}</div>
                      <div className="text-sm text-gray-600">Учеников</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{profile.lessons.length}</div>
                      <div className="text-sm text-gray-600">Уроков</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{profile.materials.length}</div>
                      <div className="text-sm text-gray-600">Материалов</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Пустые состояния */}
            {profile.students.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Нет учеников</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Добавьте первого ученика, чтобы начать планировать занятия и отслеживать прогресс.
                  </p>
                  <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить ученика
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {profile.lessons.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Нет уроков</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Создайте первый урок, чтобы начать планировать расписание занятий.
                  </p>
                  <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={profile.students.length === 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        Создать урок
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  {profile.students.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Сначала добавьте ученика
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {profile.materials.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Нет материалов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Загрузите учебные материалы, чтобы организовать библиотеку ресурсов для учеников.
                  </p>
                  <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Загрузить материал
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Боковая панель с подсказками */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Что дальше?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {completedActions.addedExtraStudent ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Добавьте ещё учеников</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Чтобы планировать расписание для нескольких учеников
                    </p>
                    <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Добавить ученика
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {completedActions.createdExtraLesson ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Создайте ещё уроки</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Чтобы протестировать календарь и планирование
                    </p>
                    <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={profile.students.length === 0}>
                          Создать урок
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {completedActions.uploadedExtraFile ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Загрузите материалы</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Для организации библиотеки ресурсов
                    </p>
                    <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Загрузить файл
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-5 h-5 border-2 border-yellow-400 rounded-full bg-yellow-50" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ваш профиль неполный</p>
                      <p className="text-xs text-gray-600 mb-2">
                        Заполните позже для лучшего представления
                      </p>
                      <Button size="sm" variant="outline">
                        Перейти в профиль
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}