"""
文件路径工具函数
"""
import re
from pathlib import Path

def sanitize_filename(name: str, max_length: int = 100) -> str:
    """
    清理文件名，去除特殊字符，保留中文、英文、数字、下划线、连字符
    将空格替换为下划线，去除首尾空格
    """
    if not name:
        return "untitled"
    
    # 去除首尾空格
    name = name.strip()
    
    # 替换空格为下划线
    name = name.replace(' ', '_')
    
    # 只保留中文、英文、数字、下划线、连字符、小数点
    # 中文Unicode范围：\u4e00-\u9fff
    name = re.sub(r'[^\w\u4e00-\u9fff.-]', '', name)
    
    # 去除连续的下划线
    name = re.sub(r'_+', '_', name)
    
    # 去除首尾的下划线和连字符
    name = name.strip('_-')
    
    # 限制长度
    if len(name) > max_length:
        name = name[:max_length]
    
    # 如果清理后为空，使用默认名称
    if not name:
        name = "untitled"
    
    return name

def get_teacher_dir_name(teacher_username: str, teacher_id: int) -> str:
    """
    获取教师目录名称：{teacher_username}_{teacher_id}
    如果用户名已清理后唯一，可以只用用户名，但为了安全起见，加上ID确保唯一性
    """
    sanitized_name = sanitize_filename(teacher_username)
    return f"{sanitized_name}_{teacher_id}"

def get_assignment_dir_name(assignment_title: str, assignment_id: int) -> str:
    """
    获取作业目录名称：{assignment_title}_{assignment_id}
    """
    sanitized_name = sanitize_filename(assignment_title)
    return f"{sanitized_name}_{assignment_id}"

