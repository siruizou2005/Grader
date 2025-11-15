import json
import re
from pathlib import Path
from typing import Dict, List
import pandas as pd

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
        sid = re.sub(r"[^0-9A-Za-z]", "", sid)
        return name, sid
    # 兼容旧格式（如果只有一部分）
    m = re.search(r"([0-9A-Za-z]{6,})", stem)
    sid = m.group(1) if m else ""
    return stem, sid

def load_one_json(path: Path) -> Dict:
    """加载单个JSON文件并转换为宽表行"""
    obj = json.loads(path.read_text(encoding="utf-8"))
    # 优先从文件名解析（更可靠），如果JSON中有值且看起来合理则使用JSON的值
    parsed_name, parsed_sid = parse_name_id_from_filename(path)
    json_name = obj.get("student_name", "").strip()
    json_sid = obj.get("student_id", "").strip()
    
    # 如果JSON中的值看起来不正确（包含_homework等后缀），使用文件名解析的值
    if json_name and "_homework" not in json_name.lower() and json_name == parsed_name:
        name = json_name
    else:
        name = parsed_name
    
    if json_sid and json_sid == parsed_sid:
        sid = json_sid
    else:
        sid = parsed_sid
    total = obj.get("total_questions", 0)
    counts = obj.get("counts", {}) or {}
    correct = counts.get("correct", 0)
    partial = counts.get("partial", 0)
    result_wrong = counts.get("result_wrong", 0)
    wrong = counts.get("wrong", 0)
    grade = obj.get("grade", "")
    
    # 兼容两种结构：新（key+status）和旧（section+id+status）
    qmap: Dict[str, str] = {}
    for q in obj.get("questions", []):
        if "key" in q and q["key"]:
            key = str(q["key"]).strip()
        else:
            raw_id = str(q.get("id", "")).strip()
            qid = re.sub(r"[^0-9A-Za-z\.\-]", "", raw_id) or raw_id
            section_raw = str(q.get("section", "")).strip()
            sec_num = re.sub(r"[^0-9\.]", "", section_raw)
            section = f"§{sec_num}" if sec_num else ""
            key = f"{section} {qid}".strip()
        status = str(q.get("status", "")).strip()
        if key:
            qmap[key] = status
    
    row = {
        "student_name": name,
        "student_id": sid,
        "total_questions": total,
        "correct": correct,
        "partial": partial,
        "result_wrong": result_wrong,
        "wrong": wrong,
        "grade": grade,
    }
    # 逐题展开列，列名为 Q:§2.5 T6
    for key, status in qmap.items():
        row[f"Q:{key}"] = status
    return row

def collect_rows(json_dir: Path) -> List[Dict]:
    """收集所有JSON文件的数据（递归查找）"""
    rows: List[Dict] = []
    for p in sorted(json_dir.glob("**/*.json")):
        try:
            rows.append(load_one_json(p))
        except Exception as e:
            print(f"[跳过] 无法解析 {p.name}: {e}")
    return rows

def get_all_qcols(rows: List[Dict]) -> List[str]:
    """获取所有题目列名"""
    qcols = set()
    for r in rows:
        for k in r.keys():
            if k.startswith("Q:"):
                qcols.add(k)
    return sorted(qcols, key=lambda c: c[2:])

def generate_excel(json_dir: Path, output_path: Path) -> Path:
    """
    生成Excel文件（对应作业JSON汇总为Excel.py）
    """
    if not json_dir.exists():
        raise ValueError(f"输入目录不存在：{json_dir}")
    
    rows = collect_rows(json_dir)
    if not rows:
        raise ValueError("未找到任何JSON文件")
    
    base_cols = [
        "student_name", "student_id", "total_questions",
        "correct", "partial", "result_wrong", "wrong", "grade"
    ]
    qcols = get_all_qcols(rows)
    
    for r in rows:
        for c in qcols:
            r.setdefault(c, "")
    
    df_wide = pd.DataFrame(rows, columns=base_cols + qcols)
    
    long_records = []
    for r in rows:
        for qc in qcols:
            long_records.append({
                "student_name": r["student_name"],
                "student_id": r["student_id"],
                "key": qc[2:],  # 去掉 'Q:' 前缀
                "status": r.get(qc, ""),
                "grade": r.get("grade", "")
            })
    df_long = pd.DataFrame(long_records)
    
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        df_wide.to_excel(writer, sheet_name="汇总(宽表)", index=False)
        df_long.to_excel(writer, sheet_name="明细(长表)", index=False)
    
    return output_path

