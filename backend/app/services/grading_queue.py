import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Global queue instance
_grading_queue: Optional[asyncio.Queue] = None

def get_grading_queue() -> asyncio.Queue:
    global _grading_queue
    if _grading_queue is None:
        _grading_queue = asyncio.Queue()
    return _grading_queue

async def enqueue_submission(submission_id: int) -> None:
    """
    Add a submission ID to the grading queue.
    """
    queue = get_grading_queue()
    await queue.put(submission_id)
    logger.info(f"Submission {submission_id} enqueued for grading.")
