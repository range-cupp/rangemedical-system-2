// /pages/api/admin/list-calendars.js
// List all GHL calendars with IDs
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  try {
    // Get all calendars
    const calendarsResponse = await fetch(
      `https://services.leadconnectorhq.com/calendars/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    if (!calendarsResponse.ok) {
      return res.status(calendarsResponse.status).json({
        error: 'Failed to fetch calendars',
        status: calendarsResponse.status
      });
    }

    const data = await calendarsResponse.json();
    const calendars = data.calendars || [];

    // Separate by type
    const serviceCalendars = calendars.filter(c => c.calendarType === 'round_robin' || c.calendarType === 'event' || c.calendarType === 'class_booking' || c.calendarType === 'collective' || c.calendarType === 'service_calendar');
    const personalCalendars = calendars.filter(c => c.calendarType === 'personal');
    const otherCalendars = calendars.filter(c => !['personal', 'round_robin', 'event', 'class_booking', 'collective', 'service_calendar'].includes(c.calendarType));

    // Format output
    const formatCalendar = (c) => ({
      id: c.id,
      name: c.name,
      type: c.calendarType,
      description: c.description || null
    });

    return res.status(200).json({
      success: true,
      total: calendars.length,
      serviceCalendars: serviceCalendars.map(formatCalendar),
      personalCalendars: personalCalendars.map(formatCalendar),
      otherCalendars: otherCalendars.map(formatCalendar),
      allCalendars: calendars.map(formatCalendar)
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
