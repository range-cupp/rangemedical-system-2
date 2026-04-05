import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SEARCH_QUERY = 'Range Medical Newport Beach';

export default async function handler(req, res) {
  // Auth check for cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Step 1: Get or find Place ID
    let placeId = await getPlaceId();

    if (!placeId) {
      // Look up Place ID via Text Search
      const searchRes = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName'
          },
          body: JSON.stringify({ textQuery: SEARCH_QUERY })
        }
      );

      if (!searchRes.ok) {
        const err = await searchRes.text();
        throw new Error(`Places search failed: ${err}`);
      }

      const searchData = await searchRes.json();
      if (!searchData.places || searchData.places.length === 0) {
        throw new Error('Could not find Range Medical on Google Places');
      }

      placeId = searchData.places[0].id;

      // Cache the Place ID
      await supabase.from('google_reviews_meta').upsert({
        key: 'place_id',
        value: placeId,
        updated_at: new Date().toISOString()
      });
    }

    // Step 2: Fetch reviews from Google Places API (New)
    const placeRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'reviews,rating,userRatingCount'
        }
      }
    );

    if (!placeRes.ok) {
      const err = await placeRes.text();
      throw new Error(`Places detail failed: ${err}`);
    }

    const placeData = await placeRes.json();

    // Save aggregate rating info
    if (placeData.rating) {
      await supabase.from('google_reviews_meta').upsert({
        key: 'aggregate_rating',
        value: String(placeData.rating),
        updated_at: new Date().toISOString()
      });
    }
    if (placeData.userRatingCount) {
      await supabase.from('google_reviews_meta').upsert({
        key: 'total_review_count',
        value: String(placeData.userRatingCount),
        updated_at: new Date().toISOString()
      });
    }

    const reviews = placeData.reviews || [];
    let upserted = 0;

    // Step 3: Upsert reviews into Supabase
    for (const review of reviews) {
      // Create a stable ID from author + time
      const reviewId = Buffer.from(
        `${review.authorAttribution?.displayName || 'anon'}_${review.publishTime || ''}`
      ).toString('base64');

      const { error } = await supabase.from('google_reviews').upsert({
        google_review_id: reviewId,
        author_name: review.authorAttribution?.displayName || 'Anonymous',
        rating: review.rating || 5,
        text: review.text?.text || '',
        relative_time: review.relativePublishTimeDescription || '',
        review_time: review.publishTime || null,
        profile_photo_url: review.authorAttribution?.photoUri || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'google_review_id' });

      if (!error) upserted++;
    }

    // Update last sync time
    await supabase.from('google_reviews_meta').upsert({
      key: 'last_sync',
      value: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      placeId,
      reviewsFetched: reviews.length,
      reviewsUpserted: upserted,
      aggregateRating: placeData.rating,
      totalReviewCount: placeData.userRatingCount
    });

  } catch (error) {
    console.error('Google reviews sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getPlaceId() {
  const { data } = await supabase
    .from('google_reviews_meta')
    .select('value')
    .eq('key', 'place_id')
    .single();

  return data?.value || null;
}
