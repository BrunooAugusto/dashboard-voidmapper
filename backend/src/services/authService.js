import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { generateToken } from '../utils/jwt.js'

const USER_SELECT = {
  id: true, email: true, name: true, role: true,
  initials: true, profileComplete: true, createdAt: true,
}

function buildInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'US'
}

export async function register({ email, name, password, role = 'Usuário' }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw Object.assign(new Error('Email já cadastrado'), { status: 409 })

  const hash     = await bcrypt.hash(password, 10)
  const initials = buildInitials(name)
  const user     = await prisma.user.create({
    data: { email, name, password: hash, role, initials, profileComplete: false },
    select: USER_SELECT,
  })
  const token = generateToken({ id: user.id, email: user.email, role: user.role })
  return { user, token }
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw Object.assign(new Error('Credenciais inválidas'), { status: 401 })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw Object.assign(new Error('Credenciais inválidas'), { status: 401 })

  const { password: _, ...safe } = user
  const token = generateToken({ id: user.id, email: user.email, role: user.role })
  return { user: safe, token }
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: USER_SELECT,
  })
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 })
  return user
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw Object.assign(new Error('Senha atual incorreta'), { status: 400 })

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hash } })
  return { success: true }
}

export async function updateProfile(userId, { name, role, initials, profileComplete }) {
  const data = {}
  if (name            !== undefined) data.name            = name
  if (role            !== undefined) data.role            = role
  if (initials        !== undefined) data.initials        = initials
  if (profileComplete !== undefined) data.profileComplete = profileComplete
  return prisma.user.update({
    where:  { id: userId },
    data,
    select: { ...USER_SELECT, updatedAt: true },
  })
}
