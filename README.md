# IRCTC Travel Analytics Dashboard

A Full Stack Travel Analytics Dashboard that automatically reads IRCTC booking and cancellation emails from Gmail, extracts journey details, and provides insightful travel analytics through an interactive React dashboard.

---

## Features

- Gmail OAuth Authentication
- Automatic IRCTC Email Parsing
- Booking History Analytics
- Refund Tracking
- Travel Summary Dashboard
- FastAPI REST API
- React Frontend

---

## Tech Stack

### Backend

- Python
- FastAPI
- Gmail API
- BeautifulSoup
- Google OAuth

### Frontend

- React
- Vite
- Tailwind CSS
- Lucide React

---

## Dashboard

Shows:

- Total Bookings
- Cancelled Tickets
- Completed Trips
- Total Ticket Cost
- Total Refund
- Net Amount Spent

---

## Project Structure

```
backend/
frontend/
```

---

## Installation

### Backend

```bash
cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

python main.py
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Privacy

Personal files such as:

- credentials.json
- token.json
- tickets.json

are intentionally excluded from this repository.

---

## Author

Omkar Singh