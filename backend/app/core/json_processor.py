import re
import json
from typing import List, Dict, Any
from pathlib import Path

def normalize_status(s: str) -> str:
    """规范化状态标签"""
    s = s.strip().lower()
    mapping = {
        "正确": "正确", "完全正确": "正确", "对": "正确",
        "部分正确": "过程部分正确", "过程部分正确": "过程部分正确",
        "步骤部分正确": "过程部分正确", "思路正确但有疏漏": "过程部分正确",
        "答案正确结果错误": "答案正确结果错误",
        "结果错误": "答案正确结果错误", "计算错误": "答案正确结果错误",
        "错误": "错误", "完全错误": "错误", "未作答": "错误", "空白": "错误",
    }
    for key in list(mapping.keys()):
        if key.lower() in s:
            return mapping[key]
    return "错误"

def grade_from_statuses(statuses: List[str]) -> str:
    """根据状态列表计算等级"""
    steps = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]
    full_errors = sum(1 for s in statuses if s in ("错误", "答案正确结果错误"))
    partial_errors = sum(1 for s in statuses if s == "过程部分正确")
    if full_errors == 0:
        if partial_errors <= 1:
            idx = 0
        else:
            idx = min(1 + (partial_errors - 2), len(steps) - 1)
    else:
        idx = min(full_errors, len(steps) - 1)
    return steps[idx]

def parse_name_id_from_filename(path: Path) -> tuple:
    """从文件名解析姓名和学号
    文件名格式：{学号}-{姓名}-data.json 或 {学号}-{姓名}-homework.pdf
    例如：42404455-cirdon-data.json -> sid="42404455", name="cirdon"
    """
    stem = path.stem
    parts = stem.split("-")
    # 文件名格式：{学号}-{姓名}-{后缀}
    # parts[0] = 学号, parts[1] = 姓名
    if len(parts) >= 2:
        sid = parts[0].strip()
        name = parts[1].strip()
        sid = re.sub(r"[^\dA-Za-z]", "", sid)
        return name, sid
    # 兼容旧格式（如果只有一部分）
    m = re.search(r"([0-9A-Za-z]{6,})", stem)
    sid = m.group(1) if m else ""
    return stem, sid

def process_report_to_json(md_text: str, student_name: str, student_id: str, raw_questions: List[Dict]) -> dict:
    """
    处理从Gemini提取的原始问题数据，生成标准JSON格式
    """
    questions = []
    for q in raw_questions:
        raw_id = str(q.get("id", "")).strip()
        qid = re.sub(r"[^0-9A-Za-z\.\-]", "", raw_id) or raw_id
        section_raw = str(q.get("section", "")).strip()
        sec_num = re.sub(r"[^0-9\.]", "", section_raw)
        section = f"§{sec_num}" if sec_num else ""
        key = f"{section} {qid}".strip()
        status = normalize_status(str(q.get("status", "")))
        if qid:
            questions.append({"key": key, "status": status})
    
    statuses = [q["status"] for q in questions]
    counts = {
        "correct": sum(1 for s in statuses if s == "正确"),
        "partial": sum(1 for s in statuses if s == "过程部分正确"),
        "result_wrong": sum(1 for s in statuses if s == "答案正确结果错误"),
        "wrong": sum(1 for s in statuses if s == "错误"),
    }
    grade = grade_from_statuses(statuses)
    
    return {
        "student_name": student_name,
        "student_id": student_id,
        "total_questions": len(questions),
        "counts": counts,
        "grade": grade,
        "questions": questions,
    }

