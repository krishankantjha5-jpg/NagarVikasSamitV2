import os
import shutil
import time
import datetime
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from database import engine, get_db
import models, schemas

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ Startup: Create tables safely
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables ensured.")
    except Exception as e:
        print(f"DB init failed: {e}")
    yield
    # Shutdown logic would go here

app = FastAPI(title="Nagar Vikas Samiti API", lifespan=lifespan)



# ALLOWED PINCODES (can be moved to .env for flexibility)
ALLOWED_PINCODES = os.getenv("ALLOWED_PINCODES", "121013,121003,201310,210308,110091").split(",")

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

if os.path.exists("./dist"):
    app.mount("/", StaticFiles(directory="./dist", html=True), name="static")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HEALTH CHECK (important for Azure)
@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}

@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": "Duplicate entry. This title or value might already exist."},
    )


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
    
    # Update flat fields
    db_activity.title = activity_update.title
    db_activity.description = activity_update.description
    db_activity.month = activity_update.month
    db_activity.year = activity_update.year
    
    # Refresh media: Delete old, add new
    db.query(models.Media).filter(models.Media.activity_id == activity_id).delete()
    
    for m in activity_update.media:
        db_media = models.Media(url=m.url, file_type=m.file_type, activity_id=db_activity.id)
        db.add(db_media)
        
    try:
        db.commit()
        db.refresh(db_activity)
        print(f"Updated activity {activity_id} successfully.")
    except Exception as e:
        db.rollback()
        print(f"Failed to update activity {activity_id}: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")

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

# PROMISES
@app.post("/promises", response_model=schemas.Promise)
def create_promise(promise: schemas.PromiseCreate, db: Session = Depends(get_db)):
    # Verify leader exists
    db_leader = db.query(models.Leader).filter(models.Leader.id == promise.leader_id).first()
    if not db_leader:
        raise HTTPException(status_code=404, detail="Leader not found")
        
    db_promise = models.Promise(**promise.dict())
    db.add(db_promise)
    db.commit()
    db.refresh(db_promise)
    return db_promise

# REALITIES (Public Submission)
@app.post("/realities", response_model=schemas.Reality)
def submit_reality(reality: schemas.RealityCreate, db: Session = Depends(get_db)):
    # Verify leader exists
    db_leader = db.query(models.Leader).filter(models.Leader.id == reality.leader_id).first()
    if not db_leader:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    # Create Reality entry
    db_reality = models.Reality(
        leader_id=reality.leader_id,
        month=reality.month,
        year=reality.year,
        area_details=reality.area_details,
        status="pending"
    )
    db.add(db_reality)
    db.commit()
    db.refresh(db_reality)
    
    # Add Media
    for m in reality.media:
        db_media = models.Media(
            url=m.url,
            file_type=m.file_type,
            reality_id=db_reality.id
        )
        db.add(db_media)
    
    db.commit()
    db.refresh(db_reality)
    return db_reality

@app.get("/realities/{leader_id}", response_model=List[schemas.Reality])
def get_approved_realities(leader_id: int, db: Session = Depends(get_db)):
    return db.query(models.Reality).filter(
        models.Reality.leader_id == leader_id,
        models.Reality.status == "approved"
    ).all()

# ADMIN REALITIES MANAGEMENT
@app.get("/admin/realities", response_model=List[schemas.Reality])
def get_pending_realities(db: Session = Depends(get_db)):
    return db.query(models.Reality).filter(models.Reality.status == "pending").all()

@app.patch("/admin/realities/{reality_id}", response_model=schemas.Reality)
def update_reality_status(reality_id: int, update: schemas.RealityUpdate, db: Session = Depends(get_db)):
    db_reality = db.query(models.Reality).filter(models.Reality.id == reality_id).first()
    if not db_reality:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    db_reality.status = update.status
    db.commit()
    db.refresh(db_reality)
    return db_reality

# LOGIN
@app.post("/login")
def login(admin: schemas.AdminLogin):
    # Use environment variables for production security
    env_user = os.getenv("ADMIN_USERNAME", "samiti")
    env_pass = os.getenv("ADMIN_PASSWORD", "2024@samiti")

    if admin.username == env_user and admin.password == env_pass:
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
