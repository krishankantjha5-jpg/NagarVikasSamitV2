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

class RealityBase(BaseModel):
    leader_id: int
    month: int
    year: int
    area_details: str

class RealityCreate(RealityBase):
    media: List[MediaBase] = []

class RealityUpdate(BaseModel):
    status: str # approved, rejected

class Reality(RealityBase):
    id: int
    status: str
    created_at: datetime
    media: List[Media] = []
    class Config:
        from_attributes = True

class ActivityBase(BaseModel):
# ... (rest of the file follows)
    title: str
    description: str
    month: Optional[int] = None
    year: Optional[int] = None

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
    media: List[MediaBase] = [] # Allow adding media during creation

class Post(PostBase):
    id: int
    created_at: datetime
    media: List[Media] = [] # Include media in response
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

class LeaderBase(BaseModel):
    name: str
    role: str
    ward: Optional[str] = None
    image_url: Optional[str] = None

class LeaderCreate(LeaderBase):
    pass

class PromiseBase(BaseModel):
    leader_id: int
    month: int
    year: int
    amount: str
    video_url: Optional[str] = None

class PromiseCreate(PromiseBase):
    pass

class Promise(PromiseBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Leader(LeaderBase):
    id: int
    created_at: datetime
    promises: List[Promise] = []
    realities: List[Reality] = []
    class Config:
        from_attributes = True

