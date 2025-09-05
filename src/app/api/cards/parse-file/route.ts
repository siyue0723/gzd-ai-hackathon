import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { DocParserService } from '@/lib/doc-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    // 检查文件类型
    if (!DocParserService.isSupportedFileType(file.name)) {
      return NextResponse.json({ error: '不支持的文件格式，请上传PDF、Word或PPT文件' }, { status: 400 });
    }

    // 检查文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    try {
      // 创建DocParser实例
      const docParser = new DocParserService();
      
      // 将File对象转换为临时文件
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      const tempDir = os.tmpdir();
      const actualTempPath = path.join(tempDir, `${Date.now()}_${file.name}`);
      
      fs.writeFileSync(actualTempPath, uint8Array);
      
      let result;
      try {
        // 调用文档解析服务
        result = await docParser.parseDocument(actualTempPath, file.name);
      } finally {
        // 清理临时文件
        try {
          fs.unlinkSync(actualTempPath);
        } catch (error) {
          console.warn('清理临时文件失败:', error);
        }
      }
      
      if (result.success && result.text) {
        return NextResponse.json({
          success: true,
          text: result.text,
          fileName: file.name
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || '文档解析失败'
        }, { status: 500 });
      }
    } catch (error: any) {
      console.error('文档解析错误:', error);
      return NextResponse.json({
        success: false,
        error: error.message || '文档解析过程中发生错误'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 });
  }
}