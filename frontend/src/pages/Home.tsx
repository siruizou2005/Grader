import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  PenTool, 
  Coffee, 
  Layout, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp,
  Users,
  FileText,
  Upload,
  Scan,
  Brain,
  FileCheck,
  BarChart3,
  Sparkles,
  Eye
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-yellow-200 selection:text-yellow-900">
      {/* 背景装饰 - 方格纸效果 */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" 
           style={{
             backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
             backgroundSize: '24px 24px'
           }}>
      </div>

      {/* Navbar Placeholder (如果Layout中没有包含Home的Navbar，这里可以简单留白或放Logo) */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800 tracking-tight">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
            <PenTool size={18} />
          </div>
          <span>Agent Grader</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2">
            登录
          </Link>
          <Link to="/register" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            注册账号
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 pb-32 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              让批改像喝咖啡一样轻松
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
              把繁琐留给机器，<br/>
              <span className="relative inline-block">
                <span className="relative z-10 text-primary-600">把时间还给教学</span>
                <svg className="absolute bottom-2 left-0 w-full h-3 -z-10 text-yellow-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              不仅仅是批改作业。这是一个懂你的教学助手，帮你处理重复性工作，
              让你专注于发现每一个学生的闪光点。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="group relative px-8 py-4 bg-primary-600 text-white text-lg font-bold rounded-xl shadow-[0_8px_0_rgb(29,78,216)] hover:shadow-[0_4px_0_rgb(29,78,216)] hover:translate-y-1 active:shadow-none active:translate-y-2 transition-all">
                <span className="flex items-center gap-2">
                  开始使用
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </span>
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                已有账号
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid - "Bento" Style */}
        <section className="px-6 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Large - Speed */}
              <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-8 items-center overflow-hidden relative group">
                <div className="flex-1 relative z-10">
                  <div className="w-12 h-12 bg-blue-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6">
                    <Coffee size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">秒级批改，立等可取</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    上传作业 PDF，稍作休息，批改即刻完成。无论是手写公式还是复杂图表，都能精准识别。不再需要在堆积如山的作业本中埋头苦干。
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-green-500"/> OCR 识别</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-green-500"/> 智能评分</span>
                  </div>
                </div>
                {/* Visual Element */}
                <div className="w-full md:w-1/2 bg-slate-50 rounded-2xl p-4 transform rotate-3 group-hover:rotate-0 transition-transform duration-500 border border-slate-100">
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                    <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100 flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shrink-0">A</div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-green-200 rounded w-12"></div>
                        <div className="h-1.5 bg-green-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Detailed Reports */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Layout size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">不仅仅是打分</h3>
                <p className="text-slate-600 leading-relaxed">
                  生成详细的反馈报告，告诉学生哪里错了，为什么错，以及如何改进。
                </p>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-50 rounded-full mix-blend-multiply opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              </div>

              {/* Card 3: Analytics */}
              <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-slate-400/20 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <TrendingUp size={24} className="text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">全班学情，一目了然</h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    自动生成班级统计报表。谁进步了？哪个知识点大家都没掌握？数据替你说话。
                  </p>
                  <Link to="/login" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 font-medium gap-1">
                    查看示例 <ArrowRight size={16}/>
                  </Link>
                </div>
                {/* Background pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Teacher & Student */}
              <div className="md:col-span-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-100 shadow-xl shadow-yellow-100/50 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10 max-w-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                      <Users size={20} />
                    </div>
                    <span className="font-bold text-orange-800 tracking-wide uppercase text-sm">双端协作</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">师生互动的新桥梁</h3>
                  <p className="text-slate-700">
                    清晰的角色分离。教师端掌控全局，学生端专注练习。支持邀请码机制，安全、私密、高效。
                  </p>
                </div>
                <div className="hidden md:flex gap-2 absolute right-8 top-1/2 -translate-y-1/2 opacity-80">
                  <div className="w-16 h-24 bg-white rounded-xl shadow-md transform -rotate-6 border border-orange-100"></div>
                  <div className="w-16 h-24 bg-white rounded-xl shadow-md transform rotate-6 border border-orange-100 translate-y-4"></div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* How It Works - Flowchart */}
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <div className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium mb-3">
                工作原理
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                智能批改系统架构
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                基于 Google Gemini AI 的多模块协作流程
              </p>
            </div>

            {/* Flowchart Container */}
            <div className="relative bg-slate-50 rounded-2xl p-4 md:p-6 border border-slate-100 shadow-lg overflow-hidden">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 rounded-3xl opacity-20"
                   style={{
                     backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                     backgroundSize: '32px 32px'
                   }}>
              </div>

              <div className="relative z-10">
                {/* Stage 1: Teacher Creates Assignment */}
                <div className="mb-6">
                  <div className="text-center mb-3">
                    <div className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                      阶段一：教师创建作业
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
                    <div className="flow-node">
                      <div className="node-icon bg-blue-100 text-blue-600">
                        <FileText size={18} />
                      </div>
                      <div className="node-label">教师用书 PDF</div>
                      <div className="node-badge bg-blue-100 text-blue-700">输入</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-purple-100 text-purple-600 relative">
                        <Scan size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                          AI
                        </div>
                      </div>
                      <div className="node-label">答案提取模块</div>
                      <div className="node-desc">OCR识别并提取标准答案</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-indigo-100 text-indigo-600 relative">
                        <Eye size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-white text-[9px]">
                          师
                        </div>
                      </div>
                      <div className="node-label">教师校对</div>
                      <div className="node-desc">在线编辑确认答案</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-emerald-100 text-emerald-600">
                        <FileCheck size={18} />
                      </div>
                      <div className="node-label">发布作业</div>
                      <div className="node-desc">学生可见并提交</div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-md h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent"></div>
                </div>

                {/* Stage 2: Student Submission & Grading */}
                <div className="mb-6">
                  <div className="text-center mb-3">
                    <div className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold">
                      阶段二：学生提交与AI批改
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
                    <div className="flow-node">
                      <div className="node-icon bg-green-100 text-green-600">
                        <Upload size={18} />
                      </div>
                      <div className="node-label">学生作业 PDF</div>
                      <div className="node-badge bg-green-100 text-green-700">输入</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-yellow-100 text-yellow-600 relative">
                        <Brain size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                          AI
                        </div>
                      </div>
                      <div className="node-label">作业批改模块</div>
                      <div className="node-desc">生成批改报告（OCR+评分）</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-orange-100 text-orange-600 relative">
                        <Sparkles size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                          AI
                        </div>
                      </div>
                      <div className="node-label">JSON提取模块</div>
                      <div className="node-desc">提取结构化数据</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-teal-100 text-teal-600">
                        <FileCheck size={18} />
                      </div>
                      <div className="node-label">批改完成</div>
                      <div className="node-desc">报告MD + JSON数据</div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-md h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent"></div>
                </div>

                {/* Stage 3: Analytics & Reporting */}
                <div>
                  <div className="text-center mb-3">
                    <div className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold">
                      阶段三：学情分析与报告
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
                    <div className="flow-node">
                      <div className="node-icon bg-pink-100 text-pink-600 relative">
                        <BarChart3 size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-white text-[9px]">
                          师
                        </div>
                      </div>
                      <div className="node-label">查看学情统计</div>
                      <div className="node-desc">等级分布、题目正确率</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-cyan-100 text-cyan-600 relative">
                        <TrendingUp size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-white text-[9px]">
                          师
                        </div>
                      </div>
                      <div className="node-label">生成Excel汇总</div>
                      <div className="node-desc">成绩表格导出</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-violet-100 text-violet-600 relative">
                        <Layout size={18} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                          AI
                        </div>
                      </div>
                      <div className="node-label">生成全班学情报告</div>
                      <div className="node-desc">综合分析教学建议</div>
                    </div>
                    <ArrowRight size={20} className="text-primary-400 hidden lg:block flex-shrink-0" />
                    <div className="flow-node">
                      <div className="node-icon bg-emerald-100 text-emerald-600">
                        <Users size={18} />
                      </div>
                      <div className="node-label">发布报告</div>
                      <div className="node-desc">学生可查看批改结果</div>
                      <div className="node-badge bg-emerald-100 text-emerald-700">输出</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold">AI</div>
                <span className="text-slate-600">AI 自动处理</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-white text-[9px]">师</div>
                <span className="text-slate-600">教师审核</span>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Steps */}
        <section className="py-20 border-t border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">开始只需三步</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="relative">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-slate-600 border-4 border-white shadow-lg">1</div>
                <h4 className="font-bold text-lg mb-2">上传资料</h4>
                <p className="text-slate-500 text-sm">上传习题与答案 PDF</p>
              </div>
              <div className="relative">
                {/* Connector Line */}
                <div className="hidden md:block absolute top-8 -left-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary-600 border-4 border-white shadow-lg">2</div>
                <h4 className="font-bold text-lg mb-2">学生提交</h4>
                <p className="text-slate-500 text-sm">通过专属链接上传作业</p>
              </div>
              <div className="relative">
                 <div className="hidden md:block absolute top-8 -left-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-slate-600 border-4 border-white shadow-lg">3</div>
                <h4 className="font-bold text-lg mb-2">获取报告</h4>
                <p className="text-slate-500 text-sm">自动生成评分与分析</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 text-center text-slate-400 text-sm">
          <div className="flex justify-center items-center gap-2 mb-4">
             <BookOpen size={16} />
             <span>Made for Education</span>
          </div>
          <p>© 2024 Agent Grader. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
