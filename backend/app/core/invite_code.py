import re
from typing import Tuple, Optional

def parse_invite_code(invite_code: str) -> Tuple[Optional[str], Optional[str]]:
    """
    解析邀请码，返回(角色, 班级ID)
    格式: teacher-101 或 student-101
    """
    pattern = r'^(teacher|student)-(\d+)$'
    match = re.match(pattern, invite_code.strip())
    if match:
        role = match.group(1)
        class_id = match.group(2)
        return role, class_id
    return None, None

def validate_invite_code(invite_code: str, selected_role: str) -> Tuple[bool, Optional[str]]:
    """
    验证邀请码是否与选择的角色匹配
    返回: (是否有效, 班级ID)
    """
    role, class_id = parse_invite_code(invite_code)
    if role is None or class_id is None:
        return False, None
    if role != selected_role:
        return False, None
    return True, class_id

