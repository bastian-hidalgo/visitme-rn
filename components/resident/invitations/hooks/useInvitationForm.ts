import { env } from '@/constants/env'
import { dayjs } from '@/lib/time'
import { useState } from 'react'

const DATE_INPUT_FORMAT = env.datetimeFormat || 'YYYY-MM-DD HH:mm'

export function useInvitationForm() {
  const [form, setForm] = useState({
    type: null,
    visitorName: '',
    contact: '',
    licensePlate: '',
    expectedAt: dayjs().format(DATE_INPUT_FORMAT),
    guests: '1',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.visitorName.trim()) e.visitorName = 'Ingresa el nombre de tu invitado.'
    if (!dayjs(form.expectedAt, DATE_INPUT_FORMAT, true).isValid())
      e.expectedAt = 'Usa el formato AAAA-MM-DD HH:mm'
    if (Number(form.guests) < 1) e.guests = 'Ingresa un número válido de acompañantes.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return { form, setForm, errors, validate }
}
