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

# models.Base.metadata.drop_all(bind=engine) # Optional: Wipe DB for a clean start if schema changed
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nagar Vikas Samiti API")

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

if os.path.exists("./dist"):
    app.mount("/", StaticFiles(directory="./dist", html=True), name="static")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_PINCODES = ["121013", "121003", "201310", "210308", "110091"]

# ACTIVITIES & MEDIA (CRUD)
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

@app.put("/activities/{activity_id}", response_model=schemas.Activity)
def update_activity(activity_id: int, activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    db_activity.title = activity.title
    db_activity.description = activity.description
    
    # Simple strategy: clear media and re-add (for this scale)
    db.query(models.Media).filter(models.Media.activity_id == activity_id).delete()
    for m in activity.media:
        db_media = models.Media(url=m.url, file_type=m.file_type, activity_id=db_activity.id)
        db.add(db_media)
    
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int):
    raise HTTPException(status_code=405, detail="Deletion of activities is permanently disabled.")

# POSTS (CRUD)
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

@app.put("/posts/{post_id}", response_model=schemas.Post)
def update_post(post_id: int, post: schemas.PostCreate, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    for var, value in post.dict().items():
        setattr(db_post, var, value) if value else None
    
    db.commit()
    db.refresh(db_post)
    return db_post

@app.delete("/posts/{post_id}")
def delete_post(post_id: int):
    raise HTTPException(status_code=405, detail="Deletion of posts is permanently disabled.")

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

# AUTH & UPLOAD
@app.post("/login")
def login(admin: schemas.AdminLogin):
    if admin.username == "samiti" and admin.password == "2024@samiti":
        return {"access_token": "fake-jwt-token", "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Get the Azure connection string from environment variables
    AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    CONTAINER_NAME = "images"

    if not AZURE_CONNECTION_STRING:
        raise HTTPException(status_code=500, detail="Storage not configured")

    # Generate a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{int(time.time()*1000)}{file_extension}"

    try:
        # Connect to Azure
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=unique_filename)
        
        # Upload the file
        blob_client.upload_blob(file.file, overwrite=True)
        
        # Return the public Azure URL
        return {"image_url": blob_client.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
