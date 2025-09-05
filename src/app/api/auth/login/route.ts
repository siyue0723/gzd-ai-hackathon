import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { emailOrUsername, password } = await request.json()

    // 验证必填字段
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: '邮箱/用户名和密码为必填项' },
        { status: 400 }
      )
    }

    // 验证用户并生成token
    const result = await authenticateUser(emailOrUsername, password)

    return NextResponse.json({
      message: '登录成功',
      user: result.user,
      token: result.token,
    })
  } catch (error: any) {
    console.error('登录错误:', error)
    
    // 处理特定的认证错误
    if (error.message === '用户不存在' || error.message === '密码错误') {
      return NextResponse.json(
        { error: '邮箱/用户名或密码错误' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}