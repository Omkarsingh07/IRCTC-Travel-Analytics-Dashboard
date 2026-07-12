from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import authenticate
from gmail import get_gmail_service

from services.booking_service import (
    load_tickets,
    calculate_total_spent
)

from services.refund_service import (
    calculate_total_refund
)

app = FastAPI(
    title="IRCTC Travel Analytics API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():

    return {
        "status": "success",
        "message": "🚆 IRCTC Travel Analytics API is Running"
    }


@app.get("/summary")
def get_summary():

    # Gmail Authentication
    creds = authenticate()
    service = get_gmail_service(creds)

    # Load Parsed Tickets
    tickets = load_tickets()

    # Booking Stats
    total_bookings = len(tickets)

    # Fare Summary
    total_ticket_cost = calculate_total_spent()

    # Refund Summary
    cancelled_tickets, total_refund = calculate_total_refund(service)

    # Final Calculations
    completed_trips = total_bookings - cancelled_tickets
    net_amount_spent = total_ticket_cost - total_refund

    return {

        "total_bookings": total_bookings,

        "cancelled_tickets": cancelled_tickets,

        "completed_trips": completed_trips,

        "total_ticket_cost": round(total_ticket_cost, 2),

        "total_refund": round(total_refund, 2),

        "net_amount_spent": round(net_amount_spent, 2)

    }