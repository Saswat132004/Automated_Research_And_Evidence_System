from fastapi import APIRouter
from app.evaluation.benchmark import evaluation_engine

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarks"])

# Store last run in memory
LATEST_BENCHMARK_RESULT = None

@router.post("/run")
def run_evaluation_benchmark(k: int = 5):
    global LATEST_BENCHMARK_RESULT
    result = evaluation_engine.run_benchmark(k=k)
    LATEST_BENCHMARK_RESULT = result
    return result

@router.get("/latest")
def get_latest_benchmark():
    global LATEST_BENCHMARK_RESULT
    if not LATEST_BENCHMARK_RESULT:
        LATEST_BENCHMARK_RESULT = evaluation_engine.run_benchmark(k=5)
    return LATEST_BENCHMARK_RESULT
