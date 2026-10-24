from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from ragdoctor.api.routes import router
from ragdoctor.config import _REPO_ROOT, settings
from ragdoctor.store.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    yield


def create_app() -> FastAPI:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    app = FastAPI(
        title="RAGDoctor API",
        version="0.1.0",
        description="RAG Evaluation Pipeline — retrieval and generation evaluated separately",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)

    dist_dir = _REPO_ROOT / "frontend" / "dist"
    if dist_dir.exists():
        app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")

    return app


app = create_app()

