import json
from datetime import datetime, timedelta

def check_availability(property_id, start_date, end_date):
    """Mock function to check property availability."""
    # In a real application, this would query a database.
    # For this mock, we'll assume the property is always available.
    return json.dumps({
        "available": True,
        "price_per_night": 300
    })

def get_quote(property_id, start_date, end_date, num_guests):
    """Mock function to get a price quote."""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    num_nights = (end - start).days
    total_price = 300 * num_nights
    return json.dumps({
        "total_price": total_price,
        "currency": "USD"
    })

def modify_booking(booking_id, new_start_date=None, new_end_date=None):
    """Mock function to modify a booking."""
    # In a real application, this would update a booking in the database.
    return json.dumps({
        "success": True,
        "booking_id": booking_id,
        "message": "Booking updated successfully."
    })

def send_message_to_host(message):
    """Mock function to send a message to the host."""
    print(f"Message to host: {message}")
    return json.dumps({
        "success": True,
        "message": "Message sent to host."
    })
