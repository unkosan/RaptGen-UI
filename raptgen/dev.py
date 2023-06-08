from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Set

from routers import session, test, data, upload

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    # "*", # for testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(data.router)
app.include_router(test.router)
app.include_router(upload.router)


def print_spec() -> str:
    return str(app.openapi())


@app.get("/api/")
async def root():
    return {"message": "OK"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=7000, reload=True)
