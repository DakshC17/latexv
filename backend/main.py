from fastapi import FastAPI
from api.routes import router
app = FastAPI()

app.include_router(router)


# def main():
#     print("Hello from backend!")


# if __name__ == "__main__":
#     main()
