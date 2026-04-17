from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MediaBase(BaseModel):
    url: str
    file_type: str

class Media(MediaBase):
    id: int
    class Config:
        from_attributes = True

class ActivityBase(BaseModel):
    title: str
    description: str

class ActivityCreate(ActivityBase):
    media: List[MediaBase] = []

class Activity(ActivityBase):
    id: int
    media: List[Media] = []
    class Config:
        from_attributes = True

class PostBase(BaseModel):
    post_type: str
    subject: str
    content: str
    image_url: Optional[str] = None

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class VolunteerBase(BaseModel):
    name: str
    number: str
    address: str
    pincode: str
    association: str

class VolunteerCreate(VolunteerBase):
    pass

class Volunteer(VolunteerBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
