from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
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
        print("App started successfully")

        # OPTIONAL: create tables safely (won’t crash app)
        models.Base.metadata.create_all(bind=engine)
        print("Tables ensured")

    except Exception as e:
        print("DB init failed:", e)


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
    db_activity = models.Activity(
        title=activity.title, 
        description=activity.description,
        month=activity.month,
        year=activity.year
    )
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
def update_activity(activity_id: int, activity_update: schemas.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    db_activity.title = activity_update.title
    db_activity.description = activity_update.description
    db_activity.month = activity_update.month
    db_activity.year = activity_update.year
    
    # Refresh media
    db.query(models.Media).filter(models.Media.activity_id == activity_id).delete()
    
    for m in activity_update.media:
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
    db_post = models.Post(
        post_type=post.post_type,
        subject=post.subject,
        content=post.content,
        image_url=post.image_url
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    for m in post.media:
        db_media = models.Media(url=m.url, file_type=m.file_type, post_id=db_post.id)
        db.add(db_media)

    db.commit()
    db.refresh(db_post)
    return db_post


@app.put("/posts/{post_id}", response_model=schemas.Post)
def update_post(post_id: int, post_update: schemas.PostCreate, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_post.subject = post_update.subject
    db_post.content = post_update.content
    db_post.post_type = post_update.post_type
    db_post.image_url = post_update.image_url
    
    # Refresh media: Simple approach - delete old and add new
    db.query(models.Media).filter(models.Media.post_id == post_id).delete()
    
    for m in post_update.media:
        db_media = models.Media(url=m.url, file_type=m.file_type, post_id=db_post.id)
        db.add(db_media)
        
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


# LEADERS
@app.get("/leaders", response_model=List[schemas.Leader])
def get_leaders(db: Session = Depends(get_db)):
    return db.query(models.Leader).all()

@app.post("/leaders", response_model=schemas.Leader)
def create_leader(leader: schemas.LeaderCreate, db: Session = Depends(get_db)):
    if leader.role in ["MP", "MLA"]:
        existing = db.query(models.Leader).filter(models.Leader.role == leader.role).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Only one {leader.role} is allowed.")

    db_leader = models.Leader(**leader.dict())
    db.add(db_leader)
    db.commit()
    db.refresh(db_leader)
    return db_leader

@app.put("/leaders/{leader_id}", response_model=schemas.Leader)
def update_leader(leader_id: int, leader_update: schemas.LeaderCreate, db: Session = Depends(get_db)):
    db_leader = db.query(models.Leader).filter(models.Leader.id == leader_id).first()
    if not db_leader:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    # Check constraint logic if they are changing roles to an MP/MLA
    if leader_update.role in ["MP", "MLA"] and leader_update.role != db_leader.role:
        existing = db.query(models.Leader).filter(models.Leader.role == leader_update.role).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Only one {leader_update.role} is allowed.")
    
    db_leader.name = leader_update.name
    db_leader.role = leader_update.role
    db_leader.ward = leader_update.ward
    db_leader.image_url = leader_update.image_url
    
    db.commit()
    db.refresh(db_leader)
    return db_leader

@app.delete("/leaders/{leader_id}")
def delete_leader(leader_id: int, db: Session = Depends(get_db)):
    db_leader = db.query(models.Leader).filter(models.Leader.id == leader_id).first()
    if not db_leader:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    db.delete(db_leader)
    db.commit()
    return {"message": "Leader deleted successfully"}

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
        from azure.storage.blob import BlobServiceClient
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
