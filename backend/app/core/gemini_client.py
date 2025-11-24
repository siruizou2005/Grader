import os
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv
import time
import random

load_dotenv()

# 强制使用 Gemini API（避免误走 Vertex）
for k in ("GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_LOCATION"):
    os.environ.pop(k, None)

API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL_PRO = "gemini-2.5-pro"
MODEL_FLASH = "gemini-2.5-flash"

def get_client():
    """获取Gemini客户端"""
    # 每次调用时重新加载环境变量，确保使用最新的API密钥
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY未设置，请在.env文件中配置")
    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(api_version="v1", timeout=600_000),
    )

def extract_qa_from_pdf(pdf_path: Path, teacher_msg: str) -> str:
    """
    从PDF中提取题目和答案（对应QA提取.py）
    包含自动重试机制，处理API过载等临时错误
    """
    if not pdf_path.exists() or pdf_path.suffix.lower() != ".pdf":
        raise ValueError(f"未找到PDF文件：{pdf_path}")
    
    pdf_size = pdf_path.stat().st_size
    if pdf_size > 20 * 1024 * 1024:
        raise ValueError(f"PDF体积约 {pdf_size/1024/1024:.1f} MB，超过20MB限制")
    
    SYSTEM_PROMPT = (
        "请OCR根据教师用书以及用户对作业任务的选择识别相应的作业内容，"
        "保留所有原作业内容与格式，不要做任何修改，数学公式使用 $...$ 或 $$...$$ 的 LaTeX 语法"
    )
    
    client = get_client()
    pdf_part = types.Part.from_bytes(
        data=pdf_path.read_bytes(),
        mime_type="application/pdf",
    )
    
    def generate_once():
        """执行一次API调用"""
        return client.models.generate_content(
            model=MODEL_PRO,
            contents=[SYSTEM_PROMPT, pdf_part, teacher_msg],
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=32000,
            ),
        )
    
    # 重试机制：最多重试5次，使用指数退避
    resp = None
    last_error = None
    for attempt in range(5):
        try:
            resp = generate_once()
            break
        except Exception as e:
            last_error = e
            msg = str(e)
            # 判断是否为临时性错误（可重试）
            transient = (
                "503" in msg
                or "UNAVAILABLE" in msg.upper()
                or "overloaded" in msg.lower()
                or "The model is overloaded" in msg
                or "Server disconnected without sending a response" in msg
                or "429" in msg  # 速率限制
                or "RESOURCE_EXHAUSTED" in msg.upper()
            )
            
            if transient and attempt < 4:
                # 指数退避：第1次等待2-3秒，第2次4-5秒，第3次8-9秒，第4次16-17秒
                wait_time = (2 ** attempt) + random.random()
                print(f"API过载，等待 {wait_time:.1f} 秒后重试（第 {attempt + 1}/5 次）...")
                time.sleep(wait_time)
                continue
            else:
                # 非临时性错误或已达到最大重试次数
                raise
    
    if resp is None:
        error_msg = str(last_error) if last_error else "未知错误"
        if "503" in error_msg or "overloaded" in error_msg.lower():
            raise ValueError(
                "Gemini API当前过载，请稍后重试。"
                "如果问题持续，可能是API配额已用完或服务暂时不可用。"
            )
        raise ValueError(f"提取答案失败: {error_msg}")
    
    md = (resp.text or "").strip()
    if not md:
        raise ValueError("模型未返回内容，请检查PDF/提示后重试")
    
    return md

def grade_homework(pdf_path: Path, answer_md_path: Path) -> str:
    """
    批改学生作业（对应作业批改-作业报告生成.py）
    """
    if not pdf_path.exists() or pdf_path.suffix.lower() != ".pdf":
        raise ValueError(f"未找到PDF文件：{pdf_path}")
    if not answer_md_path.exists():
        raise ValueError(f"未找到标准答案文件：{answer_md_path}")
    
    SYSTEM_TEXT = (
        "【系统指令】\n"
        "你将收到两个文件：\n"
        "1) homework.pdf（学生作业影像，PDF）；\n"
        "2) 习题与解答_selected.md（教师用书：题目与参考答案，Markdown）。\n\n"
        "请输出一个 Markdown 报告，包含两部分：\n"
        "## 一、学生作业 OCR 结果\n"
        "逐字逐行转写 PDF 内容，尽量保持结构与可读性（标题/段落/列表/图片占位/公式均保留；"
        "数学公式用 $...$ 或 $$...$$）。不要加入解释或评语。\n\n"
        "## 二、逐题批改简报\n"
        "按题号列出：完成情况（已作答/未作答）、判断（正确/部分正确/错误）、2~4条评分要点（可给建议分值）、"
        "常见错误/漏步、给学生的简短建议。仅引用题号或关键词，严禁复写或改写教师用书中的原题与答案文字。\n"
    )
    
    client = get_client()
    pdf_part = types.Part.from_bytes(
        data=pdf_path.read_bytes(),
        mime_type="application/pdf",
    )
    md_part = types.Part.from_bytes(
        data=answer_md_path.read_bytes(),
        mime_type="text/markdown",
    )
    
    def generate_once():
        return client.models.generate_content(
            model=MODEL_PRO,
            contents=[SYSTEM_TEXT, pdf_part, md_part],
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=16000,
            ),
        )
    
    resp = None
    for attempt in range(5):
        try:
            resp = generate_once()
            break
        except Exception as e:
            msg = str(e)
            transient = (
                "503" in msg
                or "UNAVAILABLE" in msg.upper()
                or "overloaded" in msg.lower()
                or "Server disconnected without sending a response" in msg
            )
            if transient and attempt < 4:
                time.sleep((2 ** attempt) + random.random())
                continue
            raise
    
    md = (resp.text or "").strip() if resp else ""
    if not md:
        raise ValueError("模型未返回内容，请检查文件是否正常")
    
    return md

def extract_json_from_report(md_text: str) -> dict:
    """
    从批改报告中提取JSON数据（对应同学报告提取json格式.py）
    """
    SYSTEM_TEXT = (
        "你将收到一份 Markdown 报告，第二部分是「逐题批改简报」。\n"
        "请从该部分中为每一题抽取：章节（如「§2.5」）、题号（原样，如「T6」）、正确性标签。\n"
        "正确性标签只允许四选一：『正确』『过程部分正确』『答案正确结果错误』『错误』。\n"
        "若出现「未作答」或等价表述，请标为『错误』；若无法定位章节，章节置空字符串。\n"
        "### 输出要求（严格 JSON）\n"
        "{\n"
        '  "questions": [\n'
        '    {"section": "§2.5", "id": "T6", "status": "正确"}\n'
        "  ]\n"
        "}\n"
    )
    
    client = get_client()
    
    def _once():
        resp = client.models.generate_content(
            model=MODEL_FLASH,
            contents=[SYSTEM_TEXT, md_text],
            config=types.GenerateContentConfig(temperature=0.0, max_output_tokens=8192),
        )
        return (resp.text or "").strip()
    
    text = ""
    for attempt in range(4):
        try:
            text = _once()
            break
        except Exception as e:
            msg = str(e)
            transient = "503" in msg or "UNAVAILABLE" in msg.upper() \
                        or "Server disconnected without sending a response" in msg
            if transient and attempt < 3:
                time.sleep((2 ** attempt) + random.random())
                continue
            raise
    
    if not text:
        return {"questions": []}
    
    import json
    import re
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, flags=re.S)
        if not m:
            return {"questions": []}
        data = json.loads(m.group(0))
    
    # Calculate statistics locally
    questions = data.get("questions", [])
    total = len(questions)
    counts = {"correct": 0, "partial": 0, "result_wrong": 0, "wrong": 0}
    
    # 统计各状态数量
    for q in questions:
        status = q.get("status", "")
        if status == "正确":
            counts["correct"] += 1
        elif status == "过程部分正确":
            counts["partial"] += 1
        elif status == "答案正确结果错误":
            # 答案正确但过程有误，算作部分正确
            counts["result_wrong"] += 1
        else:
            counts["wrong"] += 1
    
    # Calculate Grade based on full errors only
    # 评分策略：只计算完全错误的数量，部分错误（过程部分正确、答案正确结果错误）不计入错误数
    # 等级序列：A+, A, A-, B+, B, B-, C+, C, C-, D, F
    grade_steps = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]
    full_errors = counts["wrong"]  # 只计算完全错误的数量
    
    if total == 0:
        grade = "F"
    elif full_errors == 0:
        grade = "A+"  # 全对
    elif full_errors >= len(grade_steps) - 1:
        grade = "F"  # 10个或更多完全错误
    else:
        grade = grade_steps[full_errors]  # 根据完全错误数量确定等级
            
    data["total_questions"] = total
    data["counts"] = counts
    data["grade"] = grade
    
    return data

def generate_class_report(combined_md_path: Path) -> str:
    """
    生成全班学情报告（汇总所有学生的批改报告后生成）
    """
    if not combined_md_path.exists():
        raise ValueError(f"未找到汇总的MD文件：{combined_md_path}")
    
    SYSTEM_TEXT = (
        "【系统指令】\n"
        "你将收到一份汇总的 Markdown 文档，其中包含了全班所有学生的作业批改报告。\n"
        "每份报告都包含两部分：\n"
        "1) 学生作业 OCR 结果\n"
        "2) 逐题批改简报\n\n"
        "请基于这些批改报告，生成一份**全班学情分析报告**，包含以下内容：\n\n"
        "## 一、整体情况概览\n"
        "- 提交情况统计（已提交人数、未提交人数）\n"
        "- 整体完成度分析\n"
        "- 平均正确率\n\n"
        "## 二、题目完成情况分析\n"
        "- 按题目统计完成情况（已作答/未作答）\n"
        "- 各题目的正确率\n"
        "- 高频错误题目识别\n\n"
        "## 三、常见错误分析\n"
        "- 总结学生普遍出现的错误类型\n"
        "- 识别知识薄弱点\n"
        "- 提供教学建议\n\n"
        "## 四、重点关注学生\n"
        "- 列出需要重点关注的学生（未提交、错误率高等）\n"
        "- 简要说明关注原因\n\n"
        "## 五、教学建议\n"
        "- 基于学情分析，提供针对性的教学建议\n"
        "- 建议重点讲解的知识点\n"
        "- 建议的复习和巩固措施\n\n"
        "请确保报告结构清晰、数据准确、建议具有可操作性。\n"
    )
    
    client = get_client()
    md_content = combined_md_path.read_text(encoding="utf-8")
    
    def generate_once():
        return client.models.generate_content(
            model=MODEL_PRO,
            contents=[SYSTEM_TEXT, md_content],
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=32000,
            ),
        )
    
    resp = None
    for attempt in range(5):
        try:
            resp = generate_once()
            break
        except Exception as e:
            msg = str(e)
            transient = (
                "503" in msg
                or "UNAVAILABLE" in msg.upper()
                or "overloaded" in msg.lower()
                or "Server disconnected without sending a response" in msg
            )
            if transient and attempt < 4:
                time.sleep((2 ** attempt) + random.random())
                continue
            raise
    
    md = (resp.text or "").strip() if resp else ""
    if not md:
        raise ValueError("模型未返回内容，请检查文件是否正常")
    
    return md

