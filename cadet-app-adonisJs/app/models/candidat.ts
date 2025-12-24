import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Candidat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare emailParent: string

  @column()
  declare status: 'pending' | 'appointment_scheduled' | 'validated' | 'rejected'

  @column()
  declare rejection_reason: string

  @column.dateTime()
  declare request_date: DateTime

  @column.dateTime()
  declare validated_at: DateTime

  @column()
  declare validate_by: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}