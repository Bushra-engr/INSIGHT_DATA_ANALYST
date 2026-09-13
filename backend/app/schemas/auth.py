from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator

class UserRegister(BaseModel):
    name: Optional[str] = "User"
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    username_or_email: Optional[str] = None
    email: Optional[str] = None
    password: str

    @model_validator(mode="before")
    @classmethod
    def check_username_or_email(cls, values):
        if isinstance(values, dict):
            if not values.get("username_or_email") and values.get("email"):
                values["username_or_email"] = values["email"]
            elif not values.get("username_or_email") and not values.get("email"):
                raise ValueError("username_or_email or email is required")
        return values


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse