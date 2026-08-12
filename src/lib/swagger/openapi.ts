export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LUXORA E-Commerce API Specification",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for LUXORA luxury e-commerce platform, covering authentication, product catalog, cart management, checkout orders, marketing coupons & flash sales, admin management, and AI Shopping Assistant.",
    contact: {
      name: "LUXORA Engineering",
      email: "support@luxora.dev",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
    {
      url: "https://luxora.vercel.app",
      description: "Production Server",
    },
  ],
  tags: [
    { name: "Authentication", description: "User registration, login, email verification, and password management" },
    { name: "Users", description: "User profile management" },
    { name: "Products", description: "Public product catalog and search" },
    { name: "Categories", description: "Product taxonomy and categories" },
    { name: "Cart", description: "Shopping cart operations" },
    { name: "Orders", description: "Customer order placement and history" },
    { name: "Coupons", description: "Discount coupon discovery and validation" },
    { name: "Banners", description: "Promotional hero and feature banners" },
    { name: "Admin Products", description: "Product management (ADMIN / MANAGER)" },
    { name: "Admin Categories", description: "Category management (ADMIN / MANAGER)" },
    { name: "Admin Orders", description: "Order fulfillment and status management (ADMIN / MANAGER)" },
    { name: "Admin Coupons", description: "Coupon creation and modification (ADMIN / MANAGER)" },
    { name: "Admin Flash Sales", description: "Flash sale creation and configuration (ADMIN / MANAGER)" },
    { name: "Admin Banners", description: "Banner image and text management (ADMIN / MANAGER)" },
    { name: "Admin Users", description: "User account role and status management (ADMIN)" },
    { name: "AI Assistant", description: "AI Shopping Assistant endpoints" },
    { name: "Monitoring", description: "Sentry integration verification (Development only)" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new customer account",
        description: "Creates a new customer user account and sends an email verification link.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "SecurePass123!" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Account registered successfully. Verification email sent.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Verification email sent. Please check your inbox." },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "Email address already registered.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate user credentials",
        description: "Verifies credentials and creates a NextAuth session cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "SecurePass123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully authenticated.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out active session",
        description: "Invalidates session tokens and clears session cookies.",
        responses: {
          200: {
            description: "Successfully logged out.",
          },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current authenticated user profile",
        description: "Retrieves details of the currently authenticated session user.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Current user profile data.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Authentication"],
        summary: "Verify user email address",
        description: "Validates verification token sent to email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string", example: "abc123token" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Email verified successfully.",
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Authentication"],
        summary: "Resend verification email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Verification email resent." },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset link sent if account exists." },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset account password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string", example: "resetToken123" },
                  password: { type: "string", format: "password", example: "NewSecurePass123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully." },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List public products with filtering, search, and pagination",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Category slug or ID" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search keyword" },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "size", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price-low", "price-high", "rating"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
        ],
        responses: {
          200: {
            description: "List of matching products with pagination metadata.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    total: { type: "integer", example: 45 },
                    page: { type: "integer", example: 1 },
                    totalPages: { type: "integer", example: 4 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/products": {
      post: {
        tags: ["Admin Products"],
        summary: "Create a new product (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Product created.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/products/{id}": {
      get: {
        tags: ["Admin Products"],
        summary: "Get product details by ID (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Admin Products"],
        summary: "Update existing product (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Admin Products"],
        summary: "Delete product by ID (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Product deleted successfully." },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all product categories",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Category" } },
              },
            },
          },
        },
      },
    },
    "/api/admin/categories": {
      post: {
        tags: ["Admin Categories"],
        summary: "Create category (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                  name: { type: "string", example: "Apparel" },
                  slug: { type: "string", example: "apparel" },
                  description: { type: "string", example: "Luxury clothing collection" },
                  imageUrl: { type: "string" },
                  parentId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } },
        },
      },
    },
    "/api/admin/categories/{id}": {
      put: {
        tags: ["Admin Categories"],
        summary: "Update category (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  imageUrl: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } },
        },
      },
      delete: {
        tags: ["Admin Categories"],
        summary: "Delete category (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category deleted." } },
      },
    },
    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get current user or guest cart",
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } },
        },
      },
      post: {
        tags: ["Cart"],
        summary: "Add item to shopping cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  variantId: { type: "string" },
                  quantity: { type: "integer", minimum: 1, example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } },
        },
      },
      put: {
        tags: ["Cart"],
        summary: "Update cart item quantity",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["itemId", "quantity"],
                properties: {
                  itemId: { type: "string" },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } },
        },
      },
    },
    "/api/cart/{id}": {
      delete: {
        tags: ["Cart"],
        summary: "Remove item from cart",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } },
        },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List authenticated user orders",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Order" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Orders"],
        summary: "Create new order from cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["shippingAddress", "paymentMethod"],
                properties: {
                  shippingAddress: {
                    type: "object",
                    required: ["fullName", "street", "city", "state", "postalCode", "country", "phone"],
                    properties: {
                      fullName: { type: "string", example: "Jane Smith" },
                      street: { type: "string", example: "123 Fifth Ave" },
                      city: { type: "string", example: "New York" },
                      state: { type: "string", example: "NY" },
                      postalCode: { type: "string", example: "10001" },
                      country: { type: "string", example: "USA" },
                      phone: { type: "string", example: "+1 555-0199" },
                    },
                  },
                  paymentMethod: { type: "string", enum: ["BANK_TRANSFER", "CREDIT_CARD", "PAYPAL", "COD"] },
                  couponCode: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
        },
      },
    },
    "/api/admin/orders": {
      get: {
        tags: ["Admin Orders"],
        summary: "List all orders (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "paymentStatus", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } },
        },
      },
    },
    "/api/admin/orders/{id}": {
      get: {
        tags: ["Admin Orders"],
        summary: "Get order details (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
        },
      },
      put: {
        tags: ["Admin Orders"],
        summary: "Update order status & payment status (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] },
                  paymentStatus: { type: "string", enum: ["PENDING", "PROOF_SUBMITTED", "PAID", "FAILED", "REFUNDED"] },
                },
              },
            },
          },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
        },
      },
    },
    "/api/coupons/available": {
      get: {
        tags: ["Coupons"],
        summary: "List available public active coupons",
        responses: {
          200: { content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Coupon" } } } } },
        },
      },
    },
    "/api/admin/coupons": {
      post: {
        tags: ["Admin Coupons"],
        summary: "Create coupon (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CouponInput" } } },
        },
        responses: {
          201: { content: { "application/json": { schema: { $ref: "#/components/schemas/Coupon" } } } },
        },
      },
    },
    "/api/admin/coupons/{id}": {
      put: {
        tags: ["Admin Coupons"],
        summary: "Update coupon (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CouponInput" } } },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Coupon" } } } },
        },
      },
      delete: {
        tags: ["Admin Coupons"],
        summary: "Delete coupon (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Coupon deleted." } },
      },
    },
    "/api/admin/flash-sales": {
      get: {
        tags: ["Admin Flash Sales"],
        summary: "List all flash sales (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/FlashSale" } } } } },
        },
      },
      post: {
        tags: ["Admin Flash Sales"],
        summary: "Create flash sale (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "startDate", "endDate", "items"],
                properties: {
                  title: { type: "string", example: "Midnight Flash Sale" },
                  startDate: { type: "string", format: "date-time" },
                  endDate: { type: "string", format: "date-time" },
                  isActive: { type: "boolean", default: true },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["productId", "salePrice"],
                      properties: {
                        productId: { type: "string" },
                        salePrice: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { content: { "application/json": { schema: { $ref: "#/components/schemas/FlashSale" } } } },
        },
      },
    },
    "/api/admin/flash-sales/{id}": {
      put: {
        tags: ["Admin Flash Sales"],
        summary: "Update flash sale (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/FlashSale" } } } } },
      },
      delete: {
        tags: ["Admin Flash Sales"],
        summary: "Delete flash sale (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Flash sale deleted." } },
      },
    },
    "/api/banners": {
      get: {
        tags: ["Banners"],
        summary: "List active promotional banners",
        responses: {
          200: { content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Banner" } } } } },
        },
      },
    },
    "/api/admin/banners": {
      post: {
        tags: ["Admin Banners"],
        summary: "Create banner (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BannerInput" } } },
        },
        responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/Banner" } } } } },
      },
    },
    "/api/admin/banners/{id}": {
      put: {
        tags: ["Admin Banners"],
        summary: "Update banner (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BannerInput" } } },
        },
        responses: {
          200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Banner" } } } },
        },
      },
      delete: {
        tags: ["Admin Banners"],
        summary: "Delete banner (ADMIN / MANAGER)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Banner deleted." } },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin Users"],
        summary: "List all platform users (ADMIN only)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/users/{id}": {
      put: {
        tags: ["Admin Users"],
        summary: "Update user role (ADMIN only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["CUSTOMER", "MANAGER", "ADMIN"] },
                },
              },
            },
          },
        },
        responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } },
      },
    },
    "/api/ai/shopping-assistant": {
      post: {
        tags: ["AI Assistant"],
        summary: "AI Shopping Assistant search & recommendation",
        description: "Processes natural language shopping requests and queries active Luxora products to generate personalized recommendations.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: { type: "string", example: "I need a luxury dress under $200 for a summer evening event" },
                  maxPrice: { type: "number", example: 200 },
                  category: { type: "string", example: "dresses" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "AI analysis and recommended products.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Here are the top luxury dresses under $200 matching your requirements:" },
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { description: "Too many AI assistant requests. Please try again shortly." },
        },
      },
    },
    "/api/test/sentry": {
      get: {
        tags: ["Monitoring"],
        summary: "Development Sentry verification endpoint",
        description: "Throws a test exception in development mode to verify Sentry event capturing. Returns 404 in production.",
        responses: {
          500: { description: "Sentry integration test exception triggered." },
          404: { description: "Not available in production." },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT / NextAuth Session",
        description: "Enter your NextAuth JWT session token or Bearer header",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "cuid12345" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", example: "john@example.com" },
          role: { type: "string", enum: ["CUSTOMER", "MANAGER", "ADMIN"], example: "CUSTOMER" },
          image: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Silk Evening Gown" },
          slug: { type: "string", example: "silk-evening-gown" },
          description: { type: "string" },
          price: { type: "number", example: 249.99 },
          comparePrice: { type: "number", nullable: true, example: 349.99 },
          badge: { type: "string", nullable: true, example: "Popular" },
          rating: { type: "number", example: 4.8 },
          reviewCount: { type: "integer", example: 14 },
          isFlashSale: { type: "boolean", example: false },
          isBestSeller: { type: "boolean", example: true },
          isNewArrival: { type: "boolean", example: true },
          categoryId: { type: "string" },
          category: { $ref: "#/components/schemas/Category" },
          images: { type: "array", items: { $ref: "#/components/schemas/ProductImage" } },
          variants: { type: "array", items: { $ref: "#/components/schemas/ProductVariant" } },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "slug", "description", "price", "categoryId"],
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          comparePrice: { type: "number" },
          badge: { type: "string" },
          categoryId: { type: "string" },
          isFlashSale: { type: "boolean" },
          isBestSeller: { type: "boolean" },
          isNewArrival: { type: "boolean" },
        },
      },
      ProductImage: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string" },
          alt: { type: "string" },
          isPrimary: { type: "boolean" },
        },
      },
      ProductVariant: {
        type: "object",
        properties: {
          id: { type: "string" },
          sku: { type: "string", example: "LUX-SE-S-BLK" },
          size: { type: "string", example: "M" },
          color: { type: "string", example: "Black" },
          colorHex: { type: "string", example: "#000000" },
          stock: { type: "integer", example: 8 },
          price: { type: "number", nullable: true },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Dresses" },
          slug: { type: "string", example: "dresses" },
          description: { type: "string", nullable: true },
          imageUrl: { type: "string", nullable: true },
        },
      },
      Cart: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string", nullable: true },
          items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          variantId: { type: "string", nullable: true },
          quantity: { type: "integer", example: 2 },
          product: { $ref: "#/components/schemas/Product" },
          variant: { $ref: "#/components/schemas/ProductVariant" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string", example: "LUX-2026-90412" },
          status: { type: "string", enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] },
          paymentStatus: { type: "string", enum: ["PENDING", "PROOF_SUBMITTED", "PAID", "FAILED", "REFUNDED"] },
          paymentMethod: { type: "string", enum: ["BANK_TRANSFER", "CREDIT_CARD", "PAYPAL", "COD"] },
          subtotal: { type: "number", example: 249.99 },
          discountAmount: { type: "number", example: 25.00 },
          shippingFee: { type: "number", example: 0.00 },
          total: { type: "number", example: 224.99 },
          bankReference: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Coupon: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string", example: "LUXURY20" },
          discountType: { type: "string", example: "PERCENTAGE" },
          discountValue: { type: "number", example: 20 },
          minOrderAmount: { type: "number", nullable: true, example: 100 },
          isActive: { type: "boolean", example: true },
        },
      },
      CouponInput: {
        type: "object",
        required: ["code", "discountType", "discountValue"],
        properties: {
          code: { type: "string" },
          discountType: { type: "string", enum: ["PERCENTAGE", "FIXED"] },
          discountValue: { type: "number" },
          minOrderAmount: { type: "number" },
          maxDiscount: { type: "number" },
          usageLimit: { type: "integer" },
          expiresAt: { type: "string", format: "date-time" },
          isActive: { type: "boolean" },
        },
      },
      FlashSale: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string", example: "Summer Luxury Sale" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          isActive: { type: "boolean" },
          items: { type: "array", items: { $ref: "#/components/schemas/FlashSaleItem" } },
        },
      },
      FlashSaleItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          salePrice: { type: "number", example: 149.99 },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      Banner: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          subtitle: { type: "string", nullable: true },
          imageUrl: { type: "string" },
          linkUrl: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      BannerInput: {
        type: "object",
        required: ["title", "imageUrl"],
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          mobileImageUrl: { type: "string" },
          linkUrl: { type: "string" },
          ctaText: { type: "string" },
          position: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Invalid request parameters" },
          message: { type: "string", example: "Detailed error explanation" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad Request - Invalid parameters or request body format",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Unauthorized: {
        description: "Unauthorized - Authentication required",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Forbidden: {
        description: "Forbidden - Insufficient permissions (Role restriction)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFound: {
        description: "Not Found - Requested entity does not exist",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
  },
};
