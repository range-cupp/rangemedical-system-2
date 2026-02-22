// /lib/calcom.js
// Cal.com API Helper - Booking management via Cal.com API v2
// Range Medical
// CREATED: 2026-02-22

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_BASE_URL = 'https://api.cal.com/v2';

// ============================================
// EVENT TYPES
// ============================================

export async function getEventTypes() {
  try {
    const response = await fetch(`${CALCOM_BASE_URL}/event-types`, {
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com getEventTypes error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching Cal.com event types:', error);
    return null;
  }
}

// ============================================
// AVAILABLE SLOTS
// ============================================

export async function getAvailableSlots(eventTypeId, startTime, endTime, timeZone = 'America/Los_Angeles') {
  try {
    const params = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      start: startTime,
      end: endTime,
      timeZone,
      format: 'range'
    });

    const response = await fetch(`${CALCOM_BASE_URL}/slots?${params}`, {
      headers: {
        'cal-api-version': '2024-09-04',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com getAvailableSlots error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    return result.data || {};
  } catch (error) {
    console.error('Error fetching Cal.com slots:', error);
    return null;
  }
}

// ============================================
// CREATE BOOKING
// ============================================

export async function createBooking({ eventTypeId, start, name, email, phoneNumber, notes }) {
  try {
    const body = {
      eventTypeId,
      start,
      attendee: {
        name,
        email,
        timeZone: 'America/Los_Angeles'
      }
    };

    if (phoneNumber) {
      body.attendee.phoneNumber = phoneNumber;
    }

    if (notes) {
      body.bookingFieldsResponses = { notes };
    }

    const response = await fetch(`${CALCOM_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com createBooking error:', response.status, errorText);
      return { error: errorText, status: response.status };
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Error creating Cal.com booking:', error);
    return { error: error.message };
  }
}

// ============================================
// CANCEL BOOKING
// ============================================

export async function cancelBooking(bookingUid, reason = '') {
  try {
    const body = {};
    if (reason) {
      body.cancellationReason = reason;
    }

    const response = await fetch(`${CALCOM_BASE_URL}/bookings/${bookingUid}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com cancelBooking error:', response.status, errorText);
      return { error: errorText, status: response.status };
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Error cancelling Cal.com booking:', error);
    return { error: error.message };
  }
}

// ============================================
// RESCHEDULE BOOKING
// ============================================

export async function rescheduleBooking(bookingUid, newStart) {
  try {
    const response = await fetch(`${CALCOM_BASE_URL}/bookings/${bookingUid}/reschedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ start: newStart })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com rescheduleBooking error:', response.status, errorText);
      return { error: errorText, status: response.status };
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('Error rescheduling Cal.com booking:', error);
    return { error: error.message };
  }
}
