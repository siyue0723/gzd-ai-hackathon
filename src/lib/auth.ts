import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { signToken, JWTPayload } from './jwt'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(email: string, username: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      name,
    },
  })

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  }

  const token = signToken(payload)

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    },
    token,
  }
}

export async function authenticateUser(emailOrUsername: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    },
  })

  if (!user) {
    throw new Error('用户不存在')
  }

  const isValidPassword = await verifyPassword(password, user.password)
  if (!isValidPassword) {
    throw new Error('密码错误')
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  }

  const token = signToken(payload)

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    },
    token,
  }
}