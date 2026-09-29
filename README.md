# SevaMitra

A Hindi first, responsive local services and Live Work marketplace built with Express, MongoDB and Mongoose.

## Run locally

1. Install Node.js 18 or newer and MongoDB.
2. Copy `.env.example` to `.env` and set `MONGO_URI` (or `MONGODB_URI`) and a private `SESSION_SECRET`.
3. Run `npm install`, then `npm start`.
4. Open `http://localhost:3000`.

The app waits for MongoDB before listening, creates starter categories, and provisions an admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Log in with that email and password. Choose a along password before putting the site on a public server.

If Atlas reports `querySrv ECONNREFUSED` but the SRV record resolves in PowerShell, Node may be using a local DNS proxy that rejects SRV requests. Set `MONGO_DNS_SERVERS=1.1.1.1,8.8.8.8` in `.env` to try public DNS for Node lookups, or configure an approved DNS resolver for your network. If outbound DNS is restricted, use Atlas's standard `mongodb://` connection string instead of the `mongodb+srv://` form.

## Main API routes

- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/posts` with optional `type`, `category`, `city`, `state`, `pincode`, `available`, and `q` filters
- `POST /api/posts`, `GET /api/posts/mine`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id`
- Admin review: `GET /api/posts/admin/all`, `PATCH /api/posts/:id/review`
- Category CRUD: `/api/categories`
- Admin user CRUD: `/api/auth/admin/users`
- Guest callback requests: `POST /api/leads`
- Listing details: `GET /api/posts/:id` and `/post/:id`
- Listing details: `GET /api/posts/:id` and `/post/:id`
- Authenticated photo upload: `POST /api/uploads` (`photos`, up to 8 JPG / PNG / WebP images)

New provider posts are published automatically. Admins can place a post on hold or approve it again. Posts expire after ten days. Passwords are hashed and application routes use session based authentication.
