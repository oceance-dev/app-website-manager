import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class RefreshToken extends BaseModel {
  static table = 'refresh_tokens'
  
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare token_hash: string

  @column()
  declare family: string

  @column()
  declare createdIp: string

  @column()
  declare userAgent: string | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column()
  declare isRevoked: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  get isValid(): boolean {
    if (this.isRevoked) return false
    if (this.expiresAt < DateTime.now()) return false
    return true
  }

  static async revokeFamily(family: string): Promise<void> {
    await this.query().where('family', family).update({ isRevoked: true})
  }

  static async revokeAllForUser(userId: number): Promise<void> {
    await this.query().where('userId', userId).update({ isRevoked: true})
  }
}