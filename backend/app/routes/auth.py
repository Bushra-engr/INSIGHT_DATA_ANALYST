from fastapi import APIRouter,HTTPException,status
from app.services.auth_service import register_user,authenticate_user
from app.services.security import create_access_token
from app.schemas.auth import UserLogin,UserRegister


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register")
def userRegister(user_data: UserRegister):
    response = register_user(user_data)
    
    if response["success"] == True:
        user_id = response.get("user_id")
        generated_token = create_access_token(int(user_id)) if user_id else ""
        return {
            "success": True,
            "message": response["message"],
            "access_token": generated_token,
            "token_type": "bearer",
            "user": {
                "id": int(user_id) if user_id else 1,
                "name": response.get("name", user_data.name),
                "email": response.get("email", user_data.email)
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response["message"]
        )
        

@router.post("/login")
def user_login(user_data: UserLogin):
    response = authenticate_user(user_data)
    
    if response["success"] == True:
        user_id = response["user_id"]
        generated_token = create_access_token(int(user_id))
        return {
            "success": True,
            "access_token": generated_token,
            "token_type": "bearer",
            "user": {
                "id": int(user_id),
                "name": response.get("name", user_data.username_or_email),
                "email": response.get("email", user_data.username_or_email)
            }
        }
    else:
        is_invalid_password = "Password" in response.get("message", "")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED if is_invalid_password else status.HTTP_404_NOT_FOUND,
            detail=response["message"]
        )