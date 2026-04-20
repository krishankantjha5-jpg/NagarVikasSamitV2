from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from azure.storage.blob import BlobServiceClient
from typing import List
import os
import shutil
import time

from database import engine, get_db
import models, schemas

app = FastAPI(title="Nagar Vikas Samiti API")

# ✅ SAFE STARTUP (won’t crash container)
@app.on_event("startup")
def startup():
    try:
        print("🚀 App started successfully")

        # OPTIONAL: create tables safely (won’t crash app)
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tables ensured")

    except Exception as e:
        print("❌ DB init failed:", e)


# DEBUG (you can remove later)
print("ACTUAL DB URL:", os.getenv("DATABASE_URL"))

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

if os.path.exists("./dist"):
    app.mount("/", StaticFiles(directory="./dist", html=True), name="static")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
print(f"CORS origins loaded: {origins}") # Helps debug Azure logs if frontend fails to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_PINCODES = ["121013", "121003", "201310", "210308", "110091"]

# HEALTH CHECK (important for Azure)
@app.get("/health")
def health():
    return {"status": "ok"}


# ACTIVITIES
@app.get("/activities", response_model=List[schemas.Activity])
def get_activities(db: Session = Depends(get_db)):
    return db.query(models.Activity).all()


@app.post("/activities", response_model=schemas.Activity)
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = models.Activity(title=activity.title, description=activity.description)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    for m in activity.media:
        db_media = models.Media(url=m.url, file_type=m.file_type, activity_id=db_activity.id)
        db.add(db_media)

    db.commit()
    db.refresh(db_activity)
    return db_activity


# POSTS
@app.get("/posts", response_model=List[schemas.Post])
def get_posts(db: Session = Depends(get_db)):
    return db.query(models.Post).order_by(models.Post.created_at.desc()).all()


@app.post("/posts", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    db_post = models.Post(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


# VOLUNTEERS
@app.get("/volunteers", response_model=List[schemas.Volunteer])
def get_volunteers(db: Session = Depends(get_db)):
    return db.query(models.Volunteer).order_by(models.Volunteer.created_at.desc()).all()


@app.post("/volunteers", response_model=schemas.Volunteer)
def create_volunteer(volunteer: schemas.VolunteerCreate, db: Session = Depends(get_db)):
    if volunteer.pincode not in ALLOWED_PINCODES:
        raise HTTPException(status_code=400, detail="Invalid Pincode")

    db_volunteer = models.Volunteer(**volunteer.dict())
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer


# LOGIN
@app.post("/login")
def login(admin: schemas.AdminLogin):
    if admin.username == "samiti" and admin.password == "2024@samiti":
        return {"access_token": "fake-jwt-token", "token_type": "bearer"}

    raise HTTPException(status_code=401, detail="Invalid credentials")


# FILE UPLOAD
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{int(time.time()*1000)}{file_extension}"

    # --- CASE A: AZURE DEPLOYMENT ---
    if connection_string:
        CONTAINER_NAME = "images"
        try:
            blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=unique_filename)
            blob_client.upload_blob(file.file, overwrite=True)
            return {"image_url": blob_client.url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Azure Upload Failed: {str(e)}")

    # --- CASE B: LOCAL DEVELOPMENT (Fallback) ---
    else:
        # Save to the local 'uploads' folder you already defined
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return a relative URL that your frontend can use via the /uploads mount
        # Ensure your VITE_API_URL is set correctly in frontend .env
        return {"image_url": f"/uploads/{unique_filename}"}
