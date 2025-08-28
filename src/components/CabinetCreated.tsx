import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle } from 'lucide-react'

interface CabinetCreatedProps {
  onContinue: () => void
}

export default function CabinetCreated({ onContinue }: CabinetCreatedProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Кабинет создан!</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Ваш кабинет репетитора успешно создан. Теперь пройдите быструю настройку, 
              чтобы начать работать с учениками.
            </p>
            
            <Button className="w-full" onClick={onContinue}>
              Перейти к настройке
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}