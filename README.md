# Tiger Rydo

**Ride Bold. Ride Clean. Ride Future.**

A premium electric scooter brand website built with Next.js, TypeScript, and MongoDB — following the Tiger Rydo brand guidelines v1.0.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB with Mongoose
- **Icons:** Lucide React

## Brand

- **Primary Colors:** Onyx Black `#0A0A0A`, Electric Orange `#FF5A00`
- **Typography:** Bebas Neue (headlines), Inter (body)
- **Tagline:** Built for the City. Smart. Clean. Electric.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
cd D:\tiger-rydo
npm install
copy .env.example .env.local
```

Edit `.env.local` with your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/tiger-rydo
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── scooters/     # GET scooter catalog
│   │   ├── inquiries/  # POST contact/test-ride forms
│   │   └── newsletter/   # POST newsletter signup
│   ├── layout.tsx
│   └── page.tsx
├── components/       # Brand-compliant UI components
├── lib/              # Constants, MongoDB connection
└── models/           # Mongoose schemas
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scooters` | List all scooters |
| POST | `/api/inquiries` | Submit contact/test-ride inquiry |
| POST | `/api/newsletter` | Subscribe to newsletter |

## Sections

- **Hero** — Ride the Future with key stats
- **Our Scooters** — Product catalog (Tiger E1, E1 Pro, E1 Lite)
- **Battery & Range** — 85 KM range, fast charging
- **Smart Connect** — App features and phone mockup
- **Built for the City** — Target audience and messaging
- **Contact** — Test ride booking form
- **Newsletter** — Email subscription CTA

## License

Private — Tiger Rydo Brand Guidelines v1.0
