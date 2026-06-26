# TEXT2COURSE_CONVERTER

An AI-powered application that converts textbook content into interactive courses.

## Project Structure

- **app/**: Core application logic, including API routes and page layouts (Next.js).
- **components/**: Reusable UI components used throughout the application.
- **lib/**: Utility functions and core business logic.
- **hooks/**: Custom React hooks for application-specific state and logic.
- **config/**: Configuration files for various services and integrations.
- **drizzle/**: Database schema and migration files (Drizzle ORM).
- **public/**: Static assets such as images, logos, and trained data for OCR.
- **scripts/**: Helper scripts for testing and development.
- **eng.traineddata**: Language data for OCR processing.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Database**: [Drizzle ORM](https://orm.drizzle.team)
- **AI Integration**: Groq, Gemini, and OpenRouter APIs.
- **OCR**: Tesseract.js (via `eng.traineddata`).

## Getting Started

1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000) to view the application.
