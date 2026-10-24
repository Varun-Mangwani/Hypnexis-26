from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from ragdoctor.config import settings

engine = create_engine(
    str(settings.database_url),
    connect_args={"check_same_thread": False, "timeout": 30.0},
)
_engine = engine



def init_db() -> None:
    SQLModel.metadata.create_all(_engine)


def get_session() -> Generator[Session, None, None]:
    with Session(_engine) as session:
        yield session
