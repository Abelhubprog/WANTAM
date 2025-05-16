from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Request, Body
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
import json
import hmac
import hashlib
import base64
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone
import httpx
from supabase import create_client, Client

# Configure root directory and load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
supabase_service_key = os.environ.get("SUPABASE_SERVICE_ROLE")

# Track if we're in development mode
is_dev_mode = supabase_url is None or supabase_url.startswith('https://placeholder')

# Function to get Supabase client with anon key (for public operations)
def get_supabase():
    if is_dev_mode:
        # Return a mock client in development mode
        logger.info("Using mock Supabase client in development mode")
        # This is a dummy value that will be checked by the handlers
        return "MOCK_CLIENT"
    
    try:
        supabase = create_client(supabase_url, supabase_anon_key)
        return supabase
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

# Function to get Supabase client with service role key (for admin operations)
def get_supabase_admin():
    if is_dev_mode:
        # Return a mock client in development mode
        logger.info("Using mock Supabase admin client in development mode")
        # This is a dummy value that will be checked by the handlers
        return "MOCK_ADMIN_CLIENT"
    
    try:
        if not supabase_service_key:
            logger.error("Supabase service role key is not set")
            raise HTTPException(status_code=500, detail="Server configuration error")
        
        supabase = create_client(supabase_url, supabase_service_key)
        return supabase
    except Exception as e:
        logger.error(f"Error initializing Supabase admin client: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class MPESACallback(BaseModel):
    TransactionType: str
    TransID: str
    TransTime: str
    TransAmount: str
    BusinessShortCode: str
    BillRefNumber: Optional[str] = None
    InvoiceNumber: Optional[str] = None
    OrgAccountBalance: str
    ThirdPartyTransID: Optional[str] = None
    MSISDN: str  # Phone number
    FirstName: Optional[str] = None
    MiddleName: Optional[str] = None
    LastName: Optional[str] = None
    
    @validator('TransAmount')
    def validate_amount(cls, v):
        # Ensure the transaction amount is 1.00 for pledges
        if float(v) != 1.00:
            raise ValueError("Invalid transaction amount. Pledge amount must be exactly KES 1.00")
        return v
    
    @validator('BusinessShortCode')
    def validate_shortcode(cls, v):
        # Validate that this is for our business
        expected_shortcode = os.environ.get("MPESA_SHORTCODE")
        if expected_shortcode and expected_shortcode != "placeholder-mpesa-shortcode" and v != expected_shortcode:
            raise ValueError(f"Invalid business shortcode: {v}")
        return v

class PledgeCreate(BaseModel):
    phone: str
    county: str
    transaction_id: str

class CountyPledgeCount(BaseModel):
    county: str
    pledge_count: int

class SolanaTipRequest(BaseModel):
    sender_public_key: str
    amount_lamports: int
    tip_percentage: Optional[float] = 5.0

class SolanaTipResponse(BaseModel):
    transaction: Dict[str, Any]
    tip_amount: int

# Standard GET route
@api_router.get("/")
async def root():
    return {"message": "WANTAM.INK API", "status": "online"}

# Status check endpoints
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate, supabase: Any = Depends(get_supabase)):
    try:
        status_obj = StatusCheck(client_name=input.client_name)
        
        # We'll log the status check but won't store it in the database
        logger.info(f"Status check received: {status_obj.dict()}")
        
        return status_obj
    except Exception as e:
        logger.error(f"Error processing status check: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# MPESA webhook for pledges
@api_router.post("/mpesa/callback")
async def mpesa_callback(
    request: Request,
    callback_data: Union[Dict[str, Any], MPESACallback] = Body(...),
    x_webhook_signature: Optional[str] = Header(None),
    supabase: Any = Depends(get_supabase_admin)
):
    try:
        # Get raw request body for signature verification
        raw_body = await request.body()
        
        # Verify webhook signature if provided
        webhook_secret = os.environ.get("WEBHOOK_SECRET")
        if webhook_secret and x_webhook_signature:
            computed_signature = hmac.new(
                webhook_secret.encode(), 
                raw_body, 
                hashlib.sha256
            ).digest()
            computed_signature_b64 = base64.b64encode(computed_signature).decode()
            
            if not hmac.compare_digest(computed_signature_b64, x_webhook_signature):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse callback data if it's a dict
        mpesa_data = MPESACallback(**callback_data) if isinstance(callback_data, dict) else callback_data
        
        # Extract county from BillRefNumber or InvoiceNumber
        county = mpesa_data.BillRefNumber or mpesa_data.InvoiceNumber
        if not county:
            logger.warning("County information missing in MPESA callback")
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "County information missing"}
            )
        
        # In a development environment without valid Supabase credentials, just log and return success
        if is_dev_mode or supabase == "MOCK_ADMIN_CLIENT":
            logger.info(f"Development mode: Simulating pledge creation for {mpesa_data.MSISDN} from {county}")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True, 
                    "message": "Development mode: Pledge would be created with these details",
                    "data": {
                        "phone": mpesa_data.MSISDN,
                        "county": county,
                        "amount": float(mpesa_data.TransAmount),
                        "transaction_id": mpesa_data.TransID
                    }
                }
            )
        
        # Create pledge in database
        pledge_data = {
            "phone": mpesa_data.MSISDN,
            "county": county,
            "amount": float(mpesa_data.TransAmount),
            "transaction_id": mpesa_data.TransID,
            "payment_method": "mpesa",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert pledge into Supabase
        result = supabase.table("pledges").insert(pledge_data).execute()
        
        if result.data:
            logger.info(f"Pledge created: {result.data}")
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": "Pledge created successfully"}
            )
        else:
            logger.error(f"Error creating pledge: {result.error}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": "Failed to create pledge"}
            )
            
    except ValueError as e:
        # Handle validation errors
        logger.warning(f"Validation error: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": str(e)}
        )
    except Exception as e:
        logger.error(f"Error processing MPESA callback: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal server error"}
        )

# Get county pledge counts 
@api_router.get("/pledges/counties", response_model=List[CountyPledgeCount])
async def get_county_pledge_counts(supabase: Any = Depends(get_supabase)):
    try:
        # In a development environment without valid Supabase credentials, return sample data
        if is_dev_mode or supabase == "MOCK_CLIENT":
            logger.info("Development mode: Returning sample county pledge counts")
            sample_data = [
                {"county": "Nairobi", "pledge_count": 125},
                {"county": "Mombasa", "pledge_count": 87},
                {"county": "Kisumu", "pledge_count": 64},
                {"county": "Nakuru", "pledge_count": 42},
                {"county": "Uasin Gishu", "pledge_count": 36},
                {"county": "Kiambu", "pledge_count": 29},
                {"county": "Machakos", "pledge_count": 23},
                {"county": "Kajiado", "pledge_count": 18},
                {"county": "Kilifi", "pledge_count": 15},
                {"county": "Kwale", "pledge_count": 12},
                {"county": "Garissa", "pledge_count": 10},
                {"county": "Turkana", "pledge_count": 8},
                {"county": "Marsabit", "pledge_count": 6},
                {"county": "Wajir", "pledge_count": 4},
                {"county": "Mandera", "pledge_count": 2}
            ]
            return [CountyPledgeCount(**item) for item in sample_data]
        
        result = supabase.from_("county_pledge_count").select("*").execute()
        
        if result.data:
            return [CountyPledgeCount(**item) for item in result.data]
        else:
            return []
    except Exception as e:
        logger.error(f"Error getting county pledge counts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Solana tip transaction endpoint
@api_router.post("/solana/tip", response_model=SolanaTipResponse)
async def create_solana_tip(
    request: SolanaTipRequest,
    supabase: Any = Depends(get_supabase)
):
    try:
        # Validate inputs
        if not request.sender_public_key:
            raise HTTPException(status_code=400, detail="Sender public key is required")
        
        if not request.amount_lamports or request.amount_lamports <= 0:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        tip_percentage = request.tip_percentage or 5.0
        tip_amount = int(request.amount_lamports * (tip_percentage / 100))
        
        if tip_amount <= 0:
            raise HTTPException(status_code=400, detail="Tip amount too small")
        
        # Get tip wallet from environment
        tip_wallet = os.environ.get("TIP_WALLET")
        if not tip_wallet:
            # Use placeholder in development mode
            tip_wallet = "placeholder-tip-wallet"
            logger.info("Using placeholder tip wallet in development mode")
        
        # In a real implementation, we would create a Solana transaction here
        # For now, we'll return a mock transaction structure
        transaction = {
            "blockhash": "mock_blockhash",
            "lastValidBlockHeight": 12345,
            "feePayer": request.sender_public_key,
            "instructions": [
                {
                    "programId": "11111111111111111111111111111111",
                    "keys": [
                        {"pubkey": request.sender_public_key, "isSigner": True, "isWritable": True},
                        {"pubkey": tip_wallet, "isSigner": False, "isWritable": True}
                    ],
                    "data": f"Transfer: {tip_amount} lamports"
                }
            ]
        }
        
        # Log the transaction
        logger.info(f"Created tip transaction: {tip_amount} lamports from {request.sender_public_key} to {tip_wallet}")
        
        return SolanaTipResponse(
            transaction=transaction,
            tip_amount=tip_amount
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Solana tip transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)