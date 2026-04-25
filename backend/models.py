from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True)
    description = Column(Text)
    month = Column(Integer, nullable=True) # 1-12
    year = Column(Integer, nullable=True) # e.g. 2024
    
    media = relationship("Media", back_populates="activity", cascade="all, delete-orphan")

class Media(Base):
    __tablename__ = "media"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    file_type = Column(String) # 'image' or 'video'
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True) 
    reality_id = Column(Integer, ForeignKey("realities.id"), nullable=True) # Link to reality checks
    help_entry_id = Column(Integer, ForeignKey("help_entries.id"), nullable=True)
    
    activity = relationship("Activity", back_populates="media")
    post = relationship("Post", back_populates="media")
    reality = relationship("Reality", back_populates="media")
    help_entry = relationship("HelpEntry", back_populates="media")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    post_type = Column(String) # 'thought' or 'campaign'
    subject = Column(String)
    content = Column(Text)
    image_url = Column(String, nullable=True) # Keep for compatibility
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    media = relationship("Media", back_populates="post", cascade="all, delete-orphan")

class Volunteer(Base):
    # ... (remains same)
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

class Leader(Base):
    __tablename__ = "leaders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String) # 'MP', 'MLA', 'Councillor'
    ward = Column(String, nullable=True) # Only for Councillor
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    promises = relationship("Promise", back_populates="leader", cascade="all, delete-orphan")
    realities = relationship("Reality", back_populates="leader", cascade="all, delete-orphan")

class Promise(Base):
    __tablename__ = "promises"
    id = Column(Integer, primary_key=True, index=True)
    leader_id = Column(Integer, ForeignKey("leaders.id"))
    month = Column(Integer)
    year = Column(Integer)
    amount = Column(String)
    video_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    leader = relationship("Leader", back_populates="promises")

class Reality(Base):
    __tablename__ = "realities"
    id = Column(Integer, primary_key=True, index=True)
    leader_id = Column(Integer, ForeignKey("leaders.id"))
    month = Column(Integer)
    year = Column(Integer)
    area_details = Column(Text)
    status = Column(String, default="pending") # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    leader = relationship("Leader", back_populates="realities")
    media = relationship("Media", back_populates="reality", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    mobile = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    location = Column(String, nullable=True) # Added location
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    help_entries = relationship("HelpEntry", back_populates="user", cascade="all, delete-orphan")

class HelpEntry(Base):
    __tablename__ = "help_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entry_type = Column(String) # 'seeking' or 'providing'
    category = Column(String) # 'Books', 'Clothes', 'Medical Equipments', 'Others'
    title = Column(String)
    description = Column(Text)
    admin_comment = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, approved, rejected, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="help_entries")
    media = relationship("Media", back_populates="help_entry", cascade="all, delete-orphan")
    interests = relationship("HelpInterest", back_populates="entry", cascade="all, delete-orphan")

class HelpInterest(Base):
    __tablename__ = "help_interests"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("help_entries.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    entry = relationship("HelpEntry", back_populates="interests")
    user = relationship("User")

class DonationGoal(Base):
    __tablename__ = "donation_goals"
    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    target_amount = Column(Float, default=0.0)
    collected_amount = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
