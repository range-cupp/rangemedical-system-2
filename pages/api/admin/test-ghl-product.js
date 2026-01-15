// /pages/api/admin/test-ghl-product.js
// Test GHL Product/Price API to see variant data
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
  
  // Chris Cupp's 30-day peptide protocol
  const productId = req.query.product_id || '695ab4f21a57f11b9de0043e';
  const priceId = req.query.price_id || '695ab50d5fdfb570693fa668';
  
  try {
    // Try to get price details
    console.log('Fetching from GHL:', productId, priceId);
    
    const priceResponse = await fetch(
      `https://services.leadconnectorhq.com/products/${productId}/price/${priceId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );
    
    const priceStatus = priceResponse.status;
    const priceText = await priceResponse.text();
    
    let priceData = null;
    try {
      priceData = JSON.parse(priceText);
    } catch (e) {
      // Not JSON
    }
    
    // Also try to get the full product details
    const productResponse = await fetch(
      `https://services.leadconnectorhq.com/products/${productId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );
    
    const productStatus = productResponse.status;
    const productText = await productResponse.text();
    
    let productData = null;
    try {
      productData = JSON.parse(productText);
    } catch (e) {
      // Not JSON
    }
    
    return res.status(200).json({
      product_id: productId,
      price_id: priceId,
      price_api: {
        status: priceStatus,
        data: priceData,
        raw: priceData ? null : priceText
      },
      product_api: {
        status: productStatus,
        data: productData,
        raw: productData ? null : productText
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
