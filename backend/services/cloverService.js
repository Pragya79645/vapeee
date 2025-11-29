

class CloverService {
  constructor() {
    this.baseUrl = 'https://apisandbox.dev.clover.com/v3/merchants';
    this.merchantId = process.env.CLOVER_MERCHANT_ID;
    this.apiToken = process.env.CLOVER_API_TOKEN;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  isConfigured() {
    return !!(this.merchantId && this.apiToken);
  }

  async getProducts() {
    if (!this.merchantId || !this.apiToken) return [];
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/items?expand=categories,tags`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching products from Clover:', error);
      throw error;
    }
  }

  async getCategories() {
    if (!this.merchantId || !this.apiToken) return [];
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/categories`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching categories from Clover:', error);
      throw error;
    }
  }

  async getOrders() {
    if (!this.merchantId || !this.apiToken) return [];
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/orders?expand=lineItems,customers,payments`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching orders from Clover:', error);
      throw error;
    }
  }

  async getProductBySku(sku) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      // Clover API filtering syntax: filter=sku={sku}
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/items?filter=sku=${sku}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      const data = await response.json();
      // Return the first match if any
      return (data.elements && data.elements.length > 0) ? data.elements[0] : null;
    } catch (error) {
      console.error(`Error fetching product by sku ${sku} from Clover:`, error);
      throw error;
    }
  }

  async createOrder(orderData) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      // Map Mongoose order to Clover order format
      // Clover expects 'lineItems' array, not 'items'
      const lineItems = (orderData.items || []).map(item => {
        return {
          name: item.name,
          price: Math.round(item.price * 100), // cents
          unitQty: item.quantity,
          // If we have an external Clover ID for the product, link it
          // item.productId might be an object if populated, or ID string
          // We need to check if we have the external ID.
          // Since orderData.items usually just has productId, we might not have externalCloverId here unless we populated it.
          // For now, we send name/price/qty which creates a custom line item.
          // Ideally, we should look up the Clover Item ID if possible to link inventory.
          // But 'orderData' passed from controller might not have it populated.
          // If we want inventory sync, we need the Item ID.
          // Let's try to use 'externalCloverId' if it was attached to the item object in the controller,
          // or rely on the fact that we are just creating a record.
          // If we want strict inventory sync, we should have the Clover Item ID.
          // Assuming for now we just create the order record.
        };
      });

      const cloverOrderPayload = {
        currency: 'USD',
        title: `Order #${orderData._id}`,
        note: `Placed via Web. Payment: ${orderData.paymentMethod}`,
        lineItems: lineItems,
        state: orderData.payment ? 'LOCKED' : 'OPEN', // LOCKED if paid
        manualTransaction: true, // Indicate this was external
        total: Math.round(orderData.amount * 100)
      };

      const response = await fetch(`${this.baseUrl}/${this.merchantId}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(cloverOrderPayload)
      });

      if (!response.ok) {
        // If 400, log body
        const errText = await response.text();
        console.error(`Clover createOrder failed: ${response.status} ${errText}`);
        throw new Error(`Clover API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating order in Clover:', error);
      throw error;
    }
  }

  async createProductInClover(productData) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/items`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: productData.name,
          price: Math.round(productData.price * 100), // Clover uses cents
          sku: productData.sku,
          hidden: !productData.showOnPOS
        })
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating product in Clover:', error);
      throw error;
    }
  }

  async updateProductInClover(cloverId, productData) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/items/${cloverId}`, {
        method: 'POST', // Clover often uses POST for updates
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: productData.name,
          price: Math.round(productData.price * 100),
          sku: productData.sku,
          hidden: !productData.showOnPOS
        })
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating product in Clover:', error);
      throw error;
    }
  }

  async deleteProductInClover(cloverId) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/items/${cloverId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error deleting product in Clover:', error);
      throw error;
    }
  }

  async updateInventory(cloverItemId, quantity) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      // First check if stock item exists
      const stockResponse = await fetch(`${this.baseUrl}/${this.merchantId}/item_stocks/${cloverItemId}`, {
        headers: this.getHeaders()
      });

      if (!stockResponse.ok) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/${this.merchantId}/item_stocks/${cloverItemId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          quantity: quantity
        })
      });
      return await response.json();

    } catch (error) {
      console.error('Error updating inventory in Clover:', error);
      return null;
    }
  }

  async chargeToken(token, amount) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      // Using /v1/charges for tokenized payments (hypothetical endpoint based on common Clover Ecomm patterns)
      // If this fails, we might need to adjust based on specific Clover setup
      const response = await fetch(`https://scl-sandbox.dev.clover.com/v1/charges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          source: token
        })
      });

      if (!response.ok) {
        // Fallback for production URL if sandbox fails or vice versa
        const prodResponse = await fetch(`https://scl.clover.com/v1/charges`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            currency: 'usd',
            source: token
          })
        });
        if (!prodResponse.ok) {
          console.error(`Clover Charge Error: ${prodResponse.statusText}`);
          throw new Error(`Clover Charge Failed: ${prodResponse.statusText}`);
        }
        return await prodResponse.json();
      }
      return await response.json();
    } catch (error) {
      console.error('Error charging Clover token:', error);
      throw error;
    }
  }
  async createCheckoutSession(orderData, returnUrl, cancelUrl) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      // Construct line items for Hosted Checkout
      const lineItems = (orderData.items || []).map(item => ({
        name: item.name,
        price: Math.round(item.price * 100), // cents
        unitQty: item.quantity,
        note: item.variantSize || ''
      }));

      const payload = {
        customer: {
          email: orderData.userId.email || '',
          firstName: orderData.address.firstName || '', // Assuming these fields exist or are passed
          lastName: orderData.address.lastName || '',
          phoneNumber: orderData.phone
        },
        shoppingCart: {
          lineItems: lineItems
        },
        redirectUrls: {
          success: returnUrl,
          failure: cancelUrl,
          cancel: cancelUrl
        }
      };

      // Hosted Checkout Endpoint
      // Note: The base URL for Hosted Checkout might be different or use the same base.
      // Documentation says /invoicingcheckoutservice/v1/checkouts
      // We'll append this to the base URL, but we need to be careful if base URL includes /v3/merchants

      // Adjusting base URL for this specific call if needed. 
      // The constructor sets baseUrl to 'https://apisandbox.dev.clover.com/v3/merchants'
      // We need 'https://apisandbox.dev.clover.com/invoicingcheckoutservice/v1/checkouts'

      const baseUrlHost = this.baseUrl.split('/v3')[0];
      const url = `${baseUrlHost}/invoicingcheckoutservice/v1/checkouts`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'X-Clover-Merchant-Id': this.merchantId // Sometimes required for global services
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Clover createCheckoutSession failed: ${response.status} ${errText}`);
        throw new Error(`Clover Checkout Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Clover checkout session:', error);
      throw error;
    }
  }
  async getItem(itemId) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/items/${itemId}?expand=categories`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching item ${itemId} from Clover:`, error);
      throw error;
    }
  }

  async addItemToCategory(itemId, categoryId) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/category_items`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          category: { id: categoryId },
          item: { id: itemId }
        })
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Error adding item ${itemId} to category ${categoryId}:`, error);
      throw error;
    }
  }

  async removeItemFromCategory(itemId, categoryId) {
    if (!this.merchantId || !this.apiToken) return null;
    try {
      const response = await fetch(`${this.baseUrl}/${this.merchantId}/categories/${categoryId}/items/${itemId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error(`Clover API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Error removing item ${itemId} from category ${categoryId}:`, error);
      throw error;
    }
  }
}

export default new CloverService();
