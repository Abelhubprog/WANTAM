import os
import base64
import json
import logging
import requests
from datetime import datetime
from typing import Dict, Any, Optional

class MPESAManager:
    """
    Manager class for handling MPESA payment integrations
    """
    
    def __init__(self):
        """Initialize the MPESA manager with credentials from env vars"""
        self.consumer_key = os.environ.get("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.environ.get("MPESA_CONSUMER_SECRET")
        self.shortcode = os.environ.get("MPESA_SHORTCODE")
        self.logger = logging.getLogger(__name__)
        self.auth_token_cache = {
            "token": None,
            "expires_at": datetime.now()
        }
        
        # Base URLs
        self.base_url = "https://sandbox.safaricom.co.ke"  # Use production URL in production
        
        # Check if credentials are available
        if not all([self.consumer_key, self.consumer_secret, self.shortcode]):
            self.logger.warning("MPESA credentials not fully configured")

    def _get_auth_token(self) -> str:
        """Get authentication token from MPESA API"""
        # Check if we have a cached token that's still valid
        if (self.auth_token_cache["token"] and 
            self.auth_token_cache["expires_at"] > datetime.now()):
            return self.auth_token_cache["token"]
        
        # Create the authorization string
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        
        # Make the request
        headers = {
            "Authorization": f"Basic {encoded_auth}"
        }
        
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            token = data.get("access_token")
            
            if token:
                # Cache the token with expiration time (usually 1 hour)
                expiry_seconds = int(data.get("expires_in", 3600))
                expires_at = datetime.now().timestamp() + expiry_seconds
                
                self.auth_token_cache = {
                    "token": token,
                    "expires_at": datetime.fromtimestamp(expires_at)
                }
                
                return token
            else:
                self.logger.error("Failed to get auth token from MPESA API")
                return ""
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error getting auth token: {e}")
            return ""

    def initiate_stk_push(
        self, 
        phone_number: str, 
        amount: float,
        account_reference: str,
        transaction_desc: str,
        callback_url: str
    ) -> Dict[str, Any]:
        """
        Initiate STK push to customer's phone
        
        Args:
            phone_number: Customer's phone number (format: 254XXXXXXXXX)
            amount: Amount to charge
            account_reference: Unique reference for the transaction
            transaction_desc: Description of the transaction
            callback_url: URL to send callback data to
            
        Returns:
            Dictionary with the response from MPESA API
        """
        token = self._get_auth_token()
        if not token:
            return {"error": "Authentication failed"}
        
        # Generate timestamp in format YYYYMMDDHHmmss
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Generate password
        password_str = f"{self.shortcode}{os.environ.get('MPESA_PASSKEY', '')}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()
        
        # Prepare request payload
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"STK push request failed: {response.text}")
                return {"error": f"Failed with status {response.status_code}", "details": response.text}
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error initiating STK push: {e}")
            return {"error": str(e)}

    def check_transaction_status(self, checkout_request_id: str) -> Dict[str, Any]:
        """
        Check the status of an STK push transaction
        
        Args:
            checkout_request_id: The CheckoutRequestID from the STK push response
            
        Returns:
            Dictionary with the transaction status
        """
        token = self._get_auth_token()
        if not token:
            return {"error": "Authentication failed"}
            
        # Generate timestamp in format YYYYMMDDHHmmss
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Generate password
        password_str = f"{self.shortcode}{os.environ.get('MPESA_PASSKEY', '')}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()
        
        # Prepare request payload
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"Transaction status check failed: {response.text}")
                return {"error": f"Failed with status {response.status_code}", "details": response.text}
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error checking transaction status: {e}")
            return {"error": str(e)}

    def validate_callback(self, callback_data: Dict[str, Any]) -> bool:
        """
        Validate MPESA callback data
        
        Args:
            callback_data: The callback data from MPESA
            
        Returns:
            True if the callback data is valid, False otherwise
        """
        try:
            # Check for required fields in callback data
            required_fields = [
                "TransactionType", "TransID", "TransTime",
                "TransAmount", "BusinessShortCode", "MSISDN"
            ]
            
            for field in required_fields:
                if field not in callback_data:
                    self.logger.warning(f"Required field '{field}' missing in callback data")
                    return False
            
            # Validate shortcode
            if callback_data["BusinessShortCode"] != self.shortcode:
                self.logger.warning(
                    f"Invalid business shortcode: got {callback_data['BusinessShortCode']}, "
                    f"expected {self.shortcode}"
                )
                return False
                
            return True
            
        except Exception as e:
            self.logger.error(f"Error validating callback data: {e}")
            return False
