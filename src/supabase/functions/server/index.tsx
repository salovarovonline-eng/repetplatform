import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Функция для хеширования пароля (простая реализация для демо)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'tutor_salt_key')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Функция для генерации случайного токена
const generateToken = (): string => {
  return crypto.randomUUID() + Date.now().toString()
}

// Регистрация репетитора
app.post('/make-server-c3da9688/register', async (c) => {
  try {
    const { phone, password, fullName, subjects, city, experience, levels, format, rate } = await c.req.json()

    // Проверяем, не существует ли уже пользователь с таким телефоном
    const existingUser = await kv.get(`user:${phone}`)
    if (existingUser) {
      return c.json({ error: 'Пользователь с таким телефоном уже зарегистрирован' }, 400)
    }

    // Генерируем уникальный ID пользователя
    const userId = crypto.randomUUID()

    // Хешируем пароль
    const hashedPassword = await hashPassword(password)

    // Сохраняем профиль репетитора
    const tutorProfile = {
      id: userId,
      phone,
      fullName,
      subjects: subjects || [],
      city,
      experience: experience || '',
      levels: levels || [],
      format: format || '',
      rate: rate || '',
      createdAt: new Date().toISOString(),
      onboardingStep: 0, // 0 - не начат, 1-3 - шаги онбординга, 4 - завершен
      students: [],
      lessons: [],
      materials: []
    }

    // Сохраняем данные для аутентификации отдельно
    const authData = {
      userId,
      phone,
      hashedPassword,
      createdAt: new Date().toISOString()
    }

    await kv.set(`user:${phone}`, JSON.stringify(tutorProfile))
    await kv.set(`tutor:${userId}`, JSON.stringify(tutorProfile))
    await kv.set(`auth:${phone}`, JSON.stringify(authData))

    return c.json({ 
      success: true, 
      userId,
      message: 'Кабинет успешно создан' 
    })

  } catch (error) {
    console.log('Ошибка регистрации:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при регистрации' }, 500)
  }
})

// Вход в систему
app.post('/make-server-c3da9688/login', async (c) => {
  try {
    const { phone, password } = await c.req.json()

    // Получаем данные аутентификации
    const authDataStr = await kv.get(`auth:${phone}`)
    if (!authDataStr) {
      return c.json({ error: 'Пользователь с таким телефоном не найден' }, 401)
    }

    const authData = JSON.parse(authDataStr)
    
    // Проверяем пароль
    const hashedPassword = await hashPassword(password)
    if (authData.hashedPassword !== hashedPassword) {
      return c.json({ error: 'Неверный пароль' }, 401)
    }

    // Генерируем токен доступа
    const accessToken = generateToken()
    
    // Сохраняем сессию
    const sessionData = {
      userId: authData.userId,
      phone: authData.phone,
      accessToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
    }
    
    await kv.set(`session:${accessToken}`, JSON.stringify(sessionData))

    // Получаем профиль пользователя
    const profile = await kv.get(`user:${phone}`)
    if (!profile) {
      return c.json({ error: 'Профиль пользователя не найден' }, 404)
    }

    return c.json({ 
      success: true, 
      accessToken: accessToken,
      user: JSON.parse(profile)
    })

  } catch (error) {
    console.log('Ошибка входа в систему:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при входе' }, 500)
  }
})

// Функция для проверки токена доступа
const verifyAccessToken = async (accessToken: string) => {
  const sessionDataStr = await kv.get(`session:${accessToken}`)
  if (!sessionDataStr) {
    return null
  }

  const sessionData = JSON.parse(sessionDataStr)
  
  // Проверяем срок действия
  if (new Date() > new Date(sessionData.expiresAt)) {
    await kv.del(`session:${accessToken}`)
    return null
  }

  return sessionData
}

// Получение профиля пользователя
app.get('/make-server-c3da9688/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Токен доступа не предоставлен' }, 401)
    }

    const sessionData = await verifyAccessToken(accessToken)
    if (!sessionData) {
      return c.json({ error: 'Недействительный или истекший токен' }, 401)
    }

    const profile = await kv.get(`tutor:${sessionData.userId}`)
    if (!profile) {
      return c.json({ error: 'Профиль пользователя не найден' }, 404)
    }

    return c.json({ profile: JSON.parse(profile) })

  } catch (error) {
    console.log('Ошибка получения профиля:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при получении профиля' }, 500)
  }
})

// Обновление шага онбординга
app.post('/make-server-c3da9688/onboarding/step', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Токен доступа не предоставлен' }, 401)
    }

    const sessionData = await verifyAccessToken(accessToken)
    if (!sessionData) {
      return c.json({ error: 'Недействительный или истекший токен' }, 401)
    }

    const { step } = await c.req.json()

    const profile = await kv.get(`tutor:${sessionData.userId}`)
    if (!profile) {
      return c.json({ error: 'Профиль пользователя не найден' }, 404)
    }

    const tutorData = JSON.parse(profile)
    tutorData.onboardingStep = step

    await kv.set(`tutor:${sessionData.userId}`, JSON.stringify(tutorData))
    await kv.set(`user:${tutorData.phone}`, JSON.stringify(tutorData))

    return c.json({ success: true })

  } catch (error) {
    console.log('Ошибка обновления шага онбординга:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при обновлении онбординга' }, 500)
  }
})

// Добавление ученика
app.post('/make-server-c3da9688/students', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Токен доступа не предоставлен' }, 401)
    }

    const sessionData = await verifyAccessToken(accessToken)
    if (!sessionData) {
      return c.json({ error: 'Недействительный или истекший токен' }, 401)
    }

    const { name, age, level, subject } = await c.req.json()

    const profile = await kv.get(`tutor:${sessionData.userId}`)
    if (!profile) {
      return c.json({ error: 'Профиль пользователя не найден' }, 404)
    }

    const tutorData = JSON.parse(profile)
    const student = {
      id: Date.now().toString(),
      name,
      age,
      level,
      subject,
      createdAt: new Date().toISOString()
    }

    tutorData.students.push(student)
    
    await kv.set(`tutor:${sessionData.userId}`, JSON.stringify(tutorData))
    await kv.set(`user:${tutorData.phone}`, JSON.stringify(tutorData))

    return c.json({ success: true, student })

  } catch (error) {
    console.log('Ошибка добавления ученика:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при добавлении ученика' }, 500)
  }
})

// Создание урока
app.post('/make-server-c3da9688/lessons', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Токен доступа не предоставлен' }, 401)
    }

    const sessionData = await verifyAccessToken(accessToken)
    if (!sessionData) {
      return c.json({ error: 'Недействительный или истекший токен' }, 401)
    }

    const { studentId, subject, date, time, duration } = await c.req.json()

    const profile = await kv.get(`tutor:${sessionData.userId}`)
    if (!profile) {
      return c.json({ error: 'Профиль пользователя не найден' }, 404)
    }

    const tutorData = JSON.parse(profile)
    const lesson = {
      id: Date.now().toString(),
      studentId,
      subject,
      date,
      time,
      duration,
      createdAt: new Date().toISOString()
    }

    tutorData.lessons.push(lesson)
    
    await kv.set(`tutor:${sessionData.userId}`, JSON.stringify(tutorData))
    await kv.set(`user:${tutorData.phone}`, JSON.stringify(tutorData))

    return c.json({ success: true, lesson })

  } catch (error) {
    console.log('Ошибка создания урока:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при создании урока' }, 500)
  }
})

// Загрузка материала
app.post('/make-server-c3da9688/materials', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Токен доступа не предоставлен' }, 401)
    }

    const sessionData = await verifyAccessToken(accessToken)
    if (!sessionData) {
      return c.json({ error: 'Недействительный или истекший токен' }, 401)
    }

    const { title, subject, description, type } = await c.req.json()

    const profile = await kv.get(`tutor:${sessionData.userId}`)
    if (!profile) {
      return c.json({ error: 'Профиль пользователя не найден' }, 404)
    }

    const tutorData = JSON.parse(profile)
    const material = {
      id: Date.now().toString(),
      title,
      subject,
      description,
      type,
      createdAt: new Date().toISOString()
    }

    tutorData.materials.push(material)
    
    await kv.set(`tutor:${sessionData.userId}`, JSON.stringify(tutorData))
    await kv.set(`user:${tutorData.phone}`, JSON.stringify(tutorData))

    return c.json({ success: true, material })

  } catch (error) {
    console.log('Ошибка добавления материала:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при добавлении материала' }, 500)
  }
})

// Выход из системы
app.post('/make-server-c3da9688/logout', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (accessToken) {
      await kv.del(`session:${accessToken}`)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Ошибка выхода из системы:', error)
    return c.json({ error: 'Внутренняя ошибка сервера при выходе' }, 500)
  }
})

Deno.serve(app.fetch)