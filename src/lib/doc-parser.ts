import Credential from '@alicloud/credentials';
import Client, { 
  SubmitDocParserJobAdvanceRequest,
  QueryDocParserStatusRequest,
  GetDocParserResultRequest
} from '@alicloud/docmind-api20220711';
import { RuntimeOptions } from '@alicloud/tea-util';
import fs from 'fs';

export interface DocParserResult {
  success: boolean;
  text?: string;
  error?: string;
  jobId?: string;
}

export interface DocParserStatus {
  status: 'processing' | 'success' | 'failed';
  numberOfSuccessfulParsing?: number;
  imageCount?: number;
  pageCountEstimate?: number;
  paragraphCount?: number;
  tableCount?: number;
  tokens?: number;
}

export class DocParserService {
  private client: any;

  constructor() {
    // 直接使用环境变量配置
    this.client = new Client({
      // 访问的域名
      endpoint: 'docmind-api.cn-hangzhou.aliyuncs.com',
      // 通过环境变量获取AccessKey ID
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      // 通过环境变量获取AccessKey Secret
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      type: 'access_key',
      regionId: 'cn-hangzhou'
    });
  }

  /**
   * 步骤一：提交文档解析任务
   */
  async submitDocParserJob(filePath: string, fileName: string): Promise<DocParserResult> {
    try {
      const advanceRequest = new SubmitDocParserJobAdvanceRequest();
      const file = fs.createReadStream(filePath);
      advanceRequest.fileUrlObject = file;
      advanceRequest.fileName = fileName;
      
      const runtimeObject = new RuntimeOptions({});
      const response = await this.client.submitDocParserJobAdvance(advanceRequest, runtimeObject);
      
      if (response.body && response.body.data && response.body.data.id) {
        return {
          success: true,
          jobId: response.body.data.id
        };
      } else {
        return {
          success: false,
          error: '提交文档解析任务失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '提交文档解析任务时发生错误'
      };
    }
  }

  /**
   * 步骤二：查询文档解析状态
   */
  async queryDocParserStatus(jobId: string): Promise<DocParserStatus> {
    try {
      const resultRequest = new QueryDocParserStatusRequest();
      resultRequest.id = jobId;
      const response = await this.client.queryDocParserStatus(resultRequest);
      
      if (response.body && response.body.data) {
        const data = response.body.data;
        return {
          status: data.status === 'success' ? 'success' : 
                 data.status === 'failed' ? 'failed' : 'processing',
          numberOfSuccessfulParsing: data.numberOfSuccessfulParsing,
          imageCount: data.imageCount,
          pageCountEstimate: data.pageCountEstimate,
          paragraphCount: data.paragraphCount,
          tableCount: data.tableCount,
          tokens: data.tokens
        };
      } else {
        return { status: 'failed' };
      }
    } catch (error: any) {
      console.error('查询文档解析状态失败:', error);
      return { status: 'failed' };
    }
  }

  /**
   * 步骤三：获取文档解析结果
   */
  async getDocParserResult(jobId: string): Promise<DocParserResult> {
    try {
      const resultRequest = new GetDocParserResultRequest();
      resultRequest.id = jobId;
      resultRequest.layoutStepSize = 100; // 获取更多内容
      resultRequest.layoutNum = 0;
      
      const response = await this.client.getDocParserResult(resultRequest);
      
      if (response.body && response.body.data && response.body.data.layouts) {
        // 提取所有文本内容
        const textContent = response.body.data.layouts
          .map((layout: any) => layout.text || '')
          .filter((text: string) => text.trim().length > 0)
          .join('\n');
        
        return {
          success: true,
          text: textContent
        };
      } else {
        return {
          success: false,
          error: '获取文档解析结果失败'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '获取文档解析结果时发生错误'
      };
    }
  }

  /**
   * 完整的文档解析流程
   */
  async parseDocument(filePath: string, fileName: string): Promise<DocParserResult> {
    try {
      // 步骤一：提交任务
      const submitResult = await this.submitDocParserJob(filePath, fileName);
      if (!submitResult.success || !submitResult.jobId) {
        return submitResult;
      }

      const jobId = submitResult.jobId;
      
      // 步骤二：轮询状态直到完成
      let maxRetries = 30; // 最多等待5分钟（30次 * 10秒）
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        const status = await this.queryDocParserStatus(jobId);
        
        if (status.status === 'success') {
          // 步骤三：获取结果
          return await this.getDocParserResult(jobId);
        } else if (status.status === 'failed') {
          return {
            success: false,
            error: '文档解析失败'
          };
        }
        
        // 等待10秒后重试
        await new Promise(resolve => setTimeout(resolve, 10000));
        retryCount++;
      }
      
      return {
        success: false,
        error: '文档解析超时'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '文档解析过程中发生错误'
      };
    }
  }

  /**
   * 检查文件类型是否支持
   */
  static isSupportedFileType(fileName: string): boolean {
    const supportedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return supportedExtensions.includes(extension);
  }
}