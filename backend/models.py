from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True)
    description = Column(Text)
    
    media = relationship("Media", back_populates="activity", cascade="all, delete-orphan")

class Media(Base):
    __tablename__ = "media"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    file_type = Column(String) # 'image' or 'video'
    activity_id = Column(Integer, ForeignKey("activities.id"))
    
    activity = relationship("Activity", back_populates="media")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    post_type = Column(String) # 'thought' or 'campaign'
    subject = Column(String)
    content = Column(Text)
    image_url = Column(String, nullable=True) # New Field: Optional image for thoughts/campaigns
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Volunteer(Base):
    __tablename__ = "volunteers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    number = Column(String)
    address = Column(String)
    pincode = Column(String)
    association = Column(String) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    hashed_password = Column(String)
